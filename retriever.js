import { loadDocs } from "./docs.js";

// ---------------------------------------------------------------------------
// Replace this file with your own retriever.
// The only contract: retrieve(question, k) returns the top k chunks, each with
//   { docId, start, end }   // where the chunk sits in its source document
// Store start and end at ingestion time, next to chunkText and embedding.
//
// Example with MongoDB Atlas Vector Search:
//
// export async function retrieve(question, k) {
//   const queryVector = await embed(question); // your embedding service
//   return chunksCollection.aggregate([
//     { $vectorSearch: { index: "chunks_index", path: "embedding",
//                        queryVector, numCandidates: 100, limit: k } },
//     { $project: { _id: 0, docId: 1, start: 1, end: 1 } },
//   ]).toArray();
// }
// ---------------------------------------------------------------------------

// Demo retriever so the kit runs with no setup:
// fixed-size chunks with overlap, scored by shared words.
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE) || 300;
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP) || 50;

function chunkDoc(docId, text) {
  const chunks = [];
  for (let start = 0; start < text.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push({ docId, start, end, text: text.slice(start, end) });
    if (end === text.length) break;
  }
  return chunks;
}

const words = (s) => s.toLowerCase().match(/[a-z]{4,}/g) ?? [];

let allChunks;

export async function retrieve(question, k) {
  if (!allChunks) {
    const docs = await loadDocs();
    allChunks = [...docs].flatMap(([docId, text]) => chunkDoc(docId, text));
  }
  const qWords = new Set(words(question));
  return allChunks
    .map((c) => ({ ...c, score: words(c.text).filter((w) => qWords.has(w)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
