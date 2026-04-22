const axios = require('axios');

/**
 * Generates flashcards from text chunks using whichever AI key is configured.
 * Provider priority: OpenAI > Gemini > Anthropic.
 *
 * Returns an array of { front, back, hint, topic } objects.
 */

const SYSTEM_PROMPT = `You are an expert teacher creating high-quality flashcards for spaced repetition study.

Generate cards that maximize understanding and long-term retention.

Rules:
1. Each card tests ONE concept clearly.
2. The "front" must always be written as a clear question heading.
   - Use question forms like "Why...", "How...", "What happens when...", "Compare..."
   - End with a question mark.
   - Do not write statement-style fronts.
3. Cover key concepts, definitions, relationships, edge cases, and worked examples.
4. Favor active-recall prompts over rote facts.
5. Avoid trivial questions and avoid copying text verbatim.
6. Include a balanced mix of conceptual, application, and explain-why cards.
7. Keep language clear and student-friendly.
8. Ground every answer in the provided material; do not invent facts.
9. The "back" must be a brief but detailed teacher-style explanation:
   - 2-5 sentences
   - explain reasoning, not just the final fact
   - for process/problem cards, include short stepwise logic
10. Every question heading must include at least one concrete term (topic, formula, concept name, event, or keyword) that appears in the material.
11. Never use generic headings like "Summarize this concept" or "Explain this topic" without a concrete concept name.
12. Ensure comprehensive coverage across the source material: key concepts, definitions, relationships, edge cases, and worked examples.
13. Cards should feel like they were written by a great teacher, not scraped by a bot.

Return ONLY valid JSON using this exact schema:
[
  {
    "front": "question/prompt",
    "back": "focused answer",
    "hint": "optional short hint",
    "topic": "short topic label"
  }
]`;

function buildUserPrompt(chunk, depth, targetCount = 12) {
  const n = Math.max(1, Math.min(Number(targetCount) || 12, 12));
  return `Generate exactly ${n} flashcards from this study material.
Depth: ${depth} (${depth === 'quick' ? 'key terms and surface facts' : depth === 'deep' ? 'comprehensive analytical cards' : 'balanced mix of concepts and examples'})
Required mix:
- ~50% core concepts/definitions
- ~30% applied or scenario-based questions
- ~20% explain-why or compare/contrast questions
Include at least one edge-case style card and one worked-example style card when material allows.

MATERIAL:
${chunk}

Return JSON array only with fields: front, back, hint, topic.
Front must be a question heading, include concrete terms from MATERIAL, and must not be generic.
Back must be a brief, detailed teacher-style explanation grounded in MATERIAL only.`;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'what', 'when', 'where', 'which',
  'your', 'their', 'there', 'have', 'will', 'would', 'could', 'should', 'each', 'card', 'cards', 'question',
  'answer', 'explain', 'concept', 'topic', 'material', 'study', 'using', 'used', 'into', 'over', 'under',
  'than', 'then', 'they', 'them', 'been', 'being', 'also', 'just', 'only', 'more', 'most', 'some', 'many',
  'does', 'done', 'make', 'made', 'like', 'such', 'very', 'much', 'across', 'through', 'between'
]);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t));
}

function isGenericFront(front) {
  const s = String(front || '').toLowerCase();
  const banned = [
    'summarize this concept',
    'explain this concept',
    'explain this topic',
    'what is this concept',
    'describe this topic',
    'what is discussed in',
  ];
  return banned.some((p) => s.includes(p));
}

function filterCardsGroundedInChunk(cards, chunk) {
  if (!Array.isArray(cards) || !cards.length) return [];
  const chunkTokens = new Set(tokenize(chunk));
  return cards.filter((c) => {
    if (!c?.front || isGenericFront(c.front)) return false;
    const frontTokens = tokenize(c.front);
    const overlap = frontTokens.filter((t) => chunkTokens.has(t));
    return overlap.length >= 1;
  });
}

function normalizeCards(cards) {
  if (!Array.isArray(cards)) return [];
  return cards
    .filter((c) => c && typeof c === 'object')
    .map((c) => {
      // Accept alternate provider keys but normalize into the app schema.
      const front = typeof c.front === 'string' ? c.front : c.question;
      const back = typeof c.back === 'string' ? c.back : c.answer;
      return {
        front: String(front || '').trim(),
        back: String(back || '').trim(),
        hint: c.hint ? String(c.hint).trim() : '',
        topic: c.topic ? String(c.topic).trim().slice(0, 60) : '',
      };
    })
    .filter((c) => c.front && c.back)
    .map((c) => ({
      front: c.front.endsWith('?') ? c.front : `${c.front}?`,
      back: c.back,
      hint: c.hint ? String(c.hint).trim() : '',
      topic: c.topic ? String(c.topic).trim().slice(0, 60) : '',
    }))
    .filter((c) => c.front.length >= 12 && c.back.length >= 25 && c.front.length <= 180)
    .filter((c) => c.front.includes('?'));
}

function safeParseJsonArray(str) {
  if (!str) return [];
  // Strip markdown fences if any
  const cleaned = str.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return normalizeCards(parsed);
    if (Array.isArray(parsed?.cards)) return normalizeCards(parsed.cards);
    if (Array.isArray(parsed?.flashcards)) return normalizeCards(parsed.flashcards);
  } catch (e) {}
  // Find the first [ and last ] in mixed text outputs
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return normalizeCards(arr);
  } catch (e) {
    return [];
  }
}

function extractAssistantText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        if (typeof p === 'string') return p;
        if (typeof p?.text === 'string') return p.text;
        return '';
      })
      .join('\n');
  }
  return '';
}

async function callGemini(chunk, depth, targetCount) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
  ].filter(Boolean);

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(chunk, depth, targetCount) }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  };

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const { data } = await axios.post(url, payload, { timeout: 60000 });
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cards = safeParseJsonArray(text);
      if (cards.length) return cards;
    } catch (err) {
      // If one model alias is unavailable for this key/account, try the next.
      const status = err?.response?.status;
      if (status !== 404) throw err;
    }
  }

  return [];
}

async function callOpenAI(chunk, depth, targetCount) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const primaryModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const fallbackModels = String(process.env.OPENAI_MODEL_FALLBACKS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const modelsToTry = [primaryModel, ...fallbackModels];
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  for (const model of modelsToTry) {
    try {
      const { data } = await axios.post(
        endpoint,
        {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(chunk, depth, targetCount) },
          ],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      const raw = extractAssistantText(data?.choices?.[0]?.message?.content);
      // Some models may still wrap in an object.
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return normalizeCards(parsed);
        if (Array.isArray(parsed.cards)) return normalizeCards(parsed.cards);
        if (Array.isArray(parsed.flashcards)) return normalizeCards(parsed.flashcards);
      } catch (e) {}
      const cards = safeParseJsonArray(raw);
      if (cards.length) return cards;
    } catch (err) {
      const status = err?.response?.status;
      // Free providers/models are often temporarily rate-limited; try next.
      if (status === 429 || status === 404) continue;
      throw err;
    }
  }

  return [];
}

async function callAnthropic(chunk, depth, targetCount) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(chunk, depth, targetCount) }],
    },
    {
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 60000,
    }
  );
  const text = data?.content?.[0]?.text || '';
  return safeParseJsonArray(text);
}

function hasAiProviderConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

function extractProviderErrorMessage(err) {
  if (!err) return '';
  const status = err?.response?.status;
  const apiMsg =
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message;
  if (!status) return apiMsg || '';
  return `AI provider returned ${status}${apiMsg ? `: ${apiMsg}` : ''}`;
}

function generateHeuristicCards(fullText, targetTotalCards = 12) {
  const desired = Math.max(6, Number(targetTotalCards) || 12);
  const sentences = String(fullText || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 35)
    .slice(0, 120);

  const normalize = (s) => String(s || '').replace(/\s+/g, ' ').trim().replace(/[.?!]+$/, '');
  const toTitle = (s) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase());
  const verbCutoffs = new Set([
    'is', 'are', 'was', 'were', 'has', 'have', 'had', 'uses', 'use', 'causes', 'cause', 'means', 'refers', 'includes',
    'involves', 'shows', 'explains', 'produces', 'creates', 'leads', 'results', 'compares', 'contrasts', 'happens',
    'absorbs', 'initiates', 'converts', 'breaks', 'defines', 'compare', 'defined',
  ]);

  const sentenceTokens = (s) =>
    normalize(s)
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

  // Extract natural topic phrase (before main verb) rather than odd bigrams.
  const topicFromSentence = (s) => {
    const words = sentenceTokens(s);
    const cleaned = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wl = w.toLowerCase();
      if (verbCutoffs.has(wl) && cleaned.length >= 1) break;
      if (STOPWORDS.has(wl) && cleaned.length === 0) continue;
      if (wl.length < 3) continue;
      cleaned.push(w);
      if (cleaned.length >= 5) break;
    }
    if (cleaned.length) return cleaned.join(' ');
    const fallback = sentenceTokens(s).filter((w) => w.length >= 4).slice(0, 3).join(' ');
    return fallback || 'core concept';
  };

  const relationOf = (s) => {
    const t = normalize(s).toLowerCase();
    if (/\b(example|apply|application|calculate|compute|solve|given|area|profit|distance|when)\b/.test(t)) return 'application';
    if (/\b(cause|causes|because|therefore|thus|leads to|results in)\b/.test(t)) return 'cause-effect';
    if (/\b(process|cycle|step|stage|sequence)\b/.test(t)) return 'process';
    if (/\b(define|definition|means|refers to|is called)\b/.test(t)) return 'definition';
    if (/\b(compare|difference|versus|vs)\b/.test(t)) return 'comparison';
    if (/\b(if|unless|except|edge case|boundary)\b/.test(t)) return 'edge-case';
    return 'concept';
  };

  const questionByRelation = (topic, relation, idx, sentence) => {
    const t = toTitle(topic);
    const s = normalize(sentence).toLowerCase();
    if (s.startsWith('define ')) {
      const defined = normalize(sentence)
        .replace(/^define\s+/i, '')
        .split(/\band\b/i)[0]
        .trim();
      return `What is ${defined}?`;
    }
    if (s.includes('compare ') && s.includes(' and ')) {
      const part = normalize(sentence)
        .replace(/^compare\s+/i, '')
        .split(/\bin terms of\b/i)[0]
        .trim();
      return `How do ${part} differ in purpose and outcome?`;
    }
    if (s.startsWith('if ')) {
      const condition = normalize(sentence).split(',')[0];
      return `What happens when ${condition.replace(/^if\s+/i, '')}?`;
    }
    const patterns = {
      concept: [
        `What is the main idea behind ${t}?`,
        `Why is ${t} important for understanding this chapter?`,
        `How would you teach ${t} to a beginner?`,
      ],
      definition: [
        `How would you define ${t} in one clear sentence?`,
        `What does ${t} mean in this context?`,
      ],
      process: [
        `What are the key steps in ${t}, and why do they occur in that order?`,
        `How does ${t} work from start to finish?`,
      ],
      'cause-effect': [
        `Why does ${t} happen, and what does it lead to?`,
        `What trigger-and-outcome pattern best explains ${t}?`,
      ],
      comparison: [
        `How does ${t} differ from a related concept in this material?`,
        `What comparison helps clarify ${t} most effectively?`,
      ],
      application: [
        `How would you apply ${t} to solve a practical problem?`,
        `What worked-example best demonstrates ${t}?`,
      ],
      'edge-case': [
        `What is an important edge case for ${t}, and why does it matter?`,
        `When can ${t} behave differently than expected?`,
      ],
    };
    const list = patterns[relation] || patterns.concept;
    return list[idx % list.length];
  };

  const answerByRelation = (topic, relation, sentence) => {
    const t = toTitle(topic);
    const s = normalize(sentence);
    const concise = s.length > 180 ? `${s.slice(0, 177)}...` : s;
    if (relation === 'process') {
      return `${t} is best taught as an ordered sequence: begin with the first step, explain why each next step follows, and show how the sequence leads to the final outcome. A clear teaching summary is: ${concise}`;
    }
    if (relation === 'cause-effect') {
      return `${t} should be taught with a cause-and-effect chain: identify the trigger, explain the mechanism of change, and then describe the resulting outcome. In simple terms: ${concise}`;
    }
    if (relation === 'definition') {
      return `${t} can be taught as a precise definition plus application: explain what it is, how to recognize it, and when to use it correctly. A student-friendly explanation is: ${concise}`;
    }
    if (relation === 'comparison') {
      return `${t} is easiest to learn through comparison: highlight how it differs in purpose, mechanism, and outcome from related ideas. A direct explanation is: ${concise}`;
    }
    if (relation === 'application') {
      return `${t} is best learned by applying it to a concrete scenario. Start from the given information, choose the correct relationship or formula, and solve step by step while explaining why each step is valid. A worked style explanation is: ${concise}`;
    }
    if (relation === 'edge-case') {
      return `${t} should include edge-case reasoning: explain when normal assumptions break, what changes in behavior follow, and how to handle that case correctly. Teach it as: ${concise}`;
    }
    return `${t} is a core concept. Teach it by stating the central principle, connecting it to a related idea, and giving one practical implication. In plain language: ${concise}`;
  };

  const unique = [];
  const seenTopics = new Set();
  for (const s of sentences) {
    const topic = topicFromSentence(s);
    const key = topic.toLowerCase();
    if (seenTopics.has(key)) continue;
    seenTopics.add(key);
    unique.push({ topic, sentence: s, relation: relationOf(s) });
    if (unique.length >= desired * 2) break;
  }
  if (!unique.length) return [];

  const typeOf = (relation) => {
    if (relation === 'definition') return 'definition';
    if (relation === 'comparison') return 'comparison';
    if (relation === 'edge-case') return 'edge-case';
    if (relation === 'application') return 'application';
    return 'concept';
  };

  const buckets = {
    definition: [],
    concept: [],
    application: [],
    comparison: [],
    'edge-case': [],
  };
  for (const item of unique) buckets[typeOf(item.relation)].push(item);

  const targetMix = desired === 12
    ? { definition: 3, concept: 3, application: 3, comparison: 2, 'edge-case': 1 }
    : {
        definition: Math.max(1, Math.round(desired * 0.25)),
        concept: Math.max(1, Math.round(desired * 0.25)),
        application: Math.max(1, Math.round(desired * 0.25)),
        comparison: Math.max(1, Math.round(desired * 0.17)),
        'edge-case': Math.max(1, desired - (Math.round(desired * 0.25) * 3 + Math.round(desired * 0.17))),
      };

  const relationForType = {
    definition: 'definition',
    concept: 'concept',
    application: 'application',
    comparison: 'comparison',
    'edge-case': 'edge-case',
  };
  const seedPool = unique.length ? unique : [{ topic: 'core concept', sentence: String(fullText || ''), relation: 'concept' }];
  for (const key of ['definition', 'concept', 'application', 'comparison', 'edge-case']) {
    let cursor = 0;
    while (buckets[key].length < targetMix[key]) {
      const seed = seedPool[cursor % seedPool.length];
      buckets[key].push({
        topic: seed.topic,
        sentence: seed.sentence,
        relation: relationForType[key],
      });
      cursor += 1;
      if (cursor > desired * 3) break;
    }
  }

  const pickIndex = { definition: 0, concept: 0, application: 0, comparison: 0, 'edge-case': 0 };
  const cards = [];
  const usedFronts = new Set();

  const pushCard = (item, i) => {
    if (!item) return false;
    const front = questionByRelation(item.topic, item.relation, i, item.sentence);
    const fkey = front.toLowerCase();
    if (usedFronts.has(fkey)) return false;
    usedFronts.add(fkey);
    cards.push({
      front,
      back: answerByRelation(item.topic, item.relation, item.sentence),
      hint: `Explain ${item.topic} with reasoning, not memorization.`,
      topic: item.topic.slice(0, 60),
    });
    return true;
  };

  let turn = 0;
  for (const key of ['definition', 'concept', 'application', 'comparison', 'edge-case']) {
    while (cards.length < desired && targetMix[key] > 0) {
      const item = buckets[key][pickIndex[key]++];
      if (!item) break;
      if (pushCard(item, turn++)) targetMix[key] -= 1;
      if (pickIndex[key] > unique.length + desired) break;
    }
  }

  // Fill remaining cards from any leftover buckets while keeping uniqueness.
  const leftovers = Object.values(buckets).flat();
  let i = 0;
  while (cards.length < desired && i < leftovers.length * 3) {
    const item = leftovers[i % leftovers.length];
    pushCard(item, turn++);
    i += 1;
  }

  return cards.slice(0, desired);
}

async function generateCardsFromText(fullText, depth = 'balanced') {
  if (!hasAiProviderConfigured()) return generateHeuristicCards(fullText, 12);

  const { chunkText } = require('./pdfService');
  const chunks = chunkText(fullText, 3500);
  const targetTotalCards = 12;
  const allCards = [];
  const maxChunks = Math.min(chunks.length, 10); // safety cap to control AI cost
  let failedChunks = 0;
  let lastProviderError = '';

  for (let i = 0; i < maxChunks; i++) {
    if (allCards.length >= targetTotalCards) break;
    const chunk = chunks[i];
    const remaining = targetTotalCards - allCards.length;
    let cards = null;
    try {
      cards = await callOpenAI(chunk, depth, remaining);
      if (!cards || !cards.length) cards = await callGemini(chunk, depth, remaining);
      if (!cards || !cards.length) cards = await callAnthropic(chunk, depth, remaining);
    } catch (err) {
      console.error(`AI call failed on chunk ${i}:`, err.message);
      const providerMsg = extractProviderErrorMessage(err);
      if (providerMsg) lastProviderError = providerMsg;
    }
    cards = filterCardsGroundedInChunk(cards, chunk);
    if (!cards || !cards.length) {
      failedChunks += 1;
      continue;
    }
    allCards.push(...cards.slice(0, remaining));
  }

  // Deduplicate by exact front text
  const seen = new Set();
  const deduped = allCards.filter((c) => {
    const key = c.front.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!deduped.length) {
    const fallbackCards = generateHeuristicCards(fullText, targetTotalCards);
    if (fallbackCards.length) return fallbackCards;
    if (lastProviderError) throw new Error(lastProviderError);
    throw new Error('AI did not return valid teacher-style cards. Check API key/model and retry.');
  }

  // If too many chunks fail, surface a hard error instead of low-quality output.
  if (failedChunks >= Math.ceil(maxChunks * 0.6)) {
    throw new Error('Most PDF chunks failed card generation. Verify API key, model access, and retry.');
  }

  return deduped.slice(0, targetTotalCards);
}

module.exports = { generateCardsFromText };
