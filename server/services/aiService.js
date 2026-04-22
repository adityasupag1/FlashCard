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
      front: c.front,
      back: c.back,
      hint: c.hint ? String(c.hint).trim() : '',
      topic: c.topic ? String(c.topic).trim().slice(0, 60) : '',
    }))
    .filter((c) => c.front.length >= 12 && c.back.length >= 25 && c.front.length <= 180)
    .filter((c) => c.front.endsWith('?'));
}

function safeParseJsonArray(str) {
  if (!str) return [];
  // Strip markdown fences if any
  const cleaned = str.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  // Find the first [ and last ]
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
      const raw = data?.choices?.[0]?.message?.content || '';
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

async function generateCardsFromText(fullText, depth = 'balanced') {
  if (!hasAiProviderConfigured()) {
    throw new Error('No AI provider configured. Add OPENAI_API_KEY (preferred) in server/.env');
  }

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
