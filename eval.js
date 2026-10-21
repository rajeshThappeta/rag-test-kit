import { readFile } from "node:fs/promises";
import { loadDocs, quoteToSpan } from "./docs.js";
import { retrieve } from "./retriever.js";

const K = Number(process.env.K) || 3;
const TEST_SET = process.argv[2] || "./test-set.json";

// A chunk covers a span when they share at least one character.
const overlaps = (chunk, span) =>
  chunk.docId === span.docId && chunk.start < span.end && span.start < chunk.end;

const docs = await loadDocs();
const testSet = JSON.parse(await readFile(TEST_SET, "utf8"));

const totals = {};
let passed = 0;

for (const item of testSet) {
  const spans = item.answer.map((label) => quoteToSpan(docs, label));
  const retrieved = await retrieve(item.question, K);

  const covered = spans.filter((span) => retrieved.some((c) => overlaps(c, span))).length;
  // Strict scoring: a pass only when EVERY part of the answer was retrieved.
  // Partial credit makes numbers look fine while answers are half wrong.
  const pass = covered === spans.length;
  if (pass) passed++;

  const type = spans.length > 1 ? "multi-part" : "single";
  totals[type] ??= { passed: 0, total: 0 };
  totals[type].total++;
  if (pass) totals[type].passed++;

  console.log(
    `${pass ? "PASS" : "FAIL"}  ${item.id.padEnd(4)} ${type.padEnd(10)} ` +
      `${covered}/${spans.length} parts   ${item.question}`
  );
}

console.log(`\nStrict hit@${K}: ${passed}/${testSet.length}`);
for (const [type, t] of Object.entries(totals)) {
  console.log(`  ${type.padEnd(10)} ${t.passed}/${t.total}`);
}
