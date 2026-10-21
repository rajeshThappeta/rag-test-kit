import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const DOCS_DIR = process.env.DOCS_DIR || "./docs";

// Loads every .txt file in the docs folder.
// docId is the file name, so labels stay readable: "refund-policy.txt".
export async function loadDocs() {
  const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith(".txt"));
  const docs = new Map();
  for (const file of files) {
    docs.set(file, await readFile(path.join(DOCS_DIR, file), "utf8"));
  }
  return docs;
}

// Turns a label { docId, quote } into a character span { docId, start, end }.
// Labels point at the SOURCE TEXT, never at a chunk id,
// so the test set survives any change to chunk size or overlap.
export function quoteToSpan(docs, { docId, quote }) {
  const text = docs.get(docId);
  if (text === undefined) throw new Error(`Unknown document: ${docId}`);

  const start = text.indexOf(quote);
  if (start === -1) throw new Error(`Quote not found in ${docId}: "${quote}"`);
  if (text.indexOf(quote, start + 1) !== -1) {
    throw new Error(`Quote appears more than once in ${docId}, make it longer: "${quote}"`);
  }
  return { docId, start, end: start + quote.length };
}
