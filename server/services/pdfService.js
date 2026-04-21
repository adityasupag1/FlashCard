const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF on disk.
 * Returns { text, numPages } and cleans up weird whitespace.
 */
async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = (data.text || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, numPages: data.numpages };
}

/**
 * Chunk text into ~3k char windows, respecting paragraph boundaries where possible.
 * Helps keep prompts inside model context limits for big PDFs.
 */
function chunkText(text, targetSize = 3000) {
  if (!text) return [];
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > targetSize && current.length > 0) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

module.exports = { extractPdfText, chunkText };
