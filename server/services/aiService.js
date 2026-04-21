const axios = require('axios');

/**
 * Generates flashcards from text chunks using whichever AI key is configured.
 * Provider priority: Gemini > OpenAI > Anthropic > fallback heuristic.
 *
 * Returns an array of { front, back, hint, topic } objects.
 */

const SYSTEM_PROMPT = `You are an expert teacher creating high-quality flashcards for spaced repetition study.
Rules:
1. Each card must test ONE concept clearly.
2. Front = a precise question or prompt. Back = a focused, complete answer.
3. Cover key concepts, definitions, relationships, edge cases, and worked examples.
4. Avoid trivial cards ("What year was X?") unless the fact is genuinely important.
5. Prefer questions that require active recall over rote recognition.
6. For technical topics, include at least one "explain why" card alongside factual ones.
Respond with ONLY a valid JSON array. No prose, no markdown fences.
Schema: [{ "front": "...", "back": "...", "hint": "", "topic": "short topic label" }]`;

function buildUserPrompt(chunk, depth) {
  const counts = { quick: '4-6', balanced: '7-10', deep: '10-14' };
  const n = counts[depth] || counts.balanced;
  return `Generate ${n} flashcards from this study material.
Depth: ${depth} (${depth === 'quick' ? 'key terms and surface facts' : depth === 'deep' ? 'comprehensive analytical cards' : 'balanced mix of concepts and examples'})

MATERIAL:
${chunk}

Return JSON array only.`;
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
    return arr
      .filter((c) => c && typeof c.front === 'string' && typeof c.back === 'string')
      .map((c) => ({
        front: String(c.front).trim(),
        back: String(c.back).trim(),
        hint: c.hint ? String(c.hint).trim() : '',
        topic: c.topic ? String(c.topic).trim().slice(0, 60) : '',
      }));
  } catch (e) {
    return [];
  }
}

async function callGemini(chunk, depth) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(chunk, depth) }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' },
  };
  const { data } = await axios.post(url, payload, { timeout: 60000 });
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return safeParseJsonArray(text);
}

async function callOpenAI(chunk, depth) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(chunk, depth) },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    },
    { headers: { Authorization: `Bearer ${key}` }, timeout: 60000 }
  );
  const raw = data?.choices?.[0]?.message?.content || '';
  // OpenAI json_object might wrap in {"cards":[...]}
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.cards)) return parsed.cards;
    if (Array.isArray(parsed.flashcards)) return parsed.flashcards;
  } catch (e) {}
  return safeParseJsonArray(raw);
}

async function callAnthropic(chunk, depth) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(chunk, depth) }],
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

/**
 * Very simple fallback: pull sentence-definition pairs from the text.
 * Only used if no AI keys are configured — so the demo still produces *something*.
 */
function heuristicCards(chunk) {
  const sentences = chunk.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40 && s.length < 300);
  return sentences.slice(0, 6).map((s, i) => ({
    front: `Summarize this concept (auto-extracted #${i + 1})`,
    back: s.trim(),
    hint: '',
    topic: 'Auto-generated',
  }));
}

async function generateCardsFromText(fullText, depth = 'balanced') {
  const { chunkText } = require('./pdfService');
  const chunks = chunkText(fullText, 3500);
  const allCards = [];
  const maxChunks = Math.min(chunks.length, 10); // safety cap to control AI cost

  for (let i = 0; i < maxChunks; i++) {
    const chunk = chunks[i];
    let cards = null;
    try {
      cards = await callGemini(chunk, depth);
      if (!cards || !cards.length) cards = await callOpenAI(chunk, depth);
      if (!cards || !cards.length) cards = await callAnthropic(chunk, depth);
    } catch (err) {
      console.error(`AI call failed on chunk ${i}:`, err.message);
    }
    if (!cards || !cards.length) cards = heuristicCards(chunk);
    allCards.push(...cards);
  }

  // Deduplicate by exact front text
  const seen = new Set();
  const deduped = allCards.filter((c) => {
    const key = c.front.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

module.exports = { generateCardsFromText };
