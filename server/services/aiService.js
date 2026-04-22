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
Front must be a question heading. Back must be a brief, detailed teacher-style explanation.`;
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(chunk, depth, targetCount) }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  };
  const { data } = await axios.post(url, payload, { timeout: 60000 });
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return safeParseJsonArray(text);
}

async function callOpenAI(chunk, depth, targetCount) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(chunk, depth, targetCount) },
      ],
      temperature: 0.2,
    },
    { headers: { Authorization: `Bearer ${key}` }, timeout: 60000 }
  );
  const raw = data?.choices?.[0]?.message?.content || '';
  // Some models may still wrap in an object.
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return normalizeCards(parsed);
    if (Array.isArray(parsed.cards)) return normalizeCards(parsed.cards);
    if (Array.isArray(parsed.flashcards)) return normalizeCards(parsed.flashcards);
  } catch (e) {}
  return safeParseJsonArray(raw);
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
    }
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
    throw new Error('AI did not return valid teacher-style cards. Check API key/model and retry.');
  }

  // If too many chunks fail, surface a hard error instead of low-quality output.
  if (failedChunks >= Math.ceil(maxChunks * 0.6)) {
    throw new Error('Most PDF chunks failed card generation. Verify API key, model access, and retry.');
  }

  return deduped.slice(0, targetTotalCards);
}

module.exports = { generateCardsFromText };
