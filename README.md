# RAG Test Kit

**A small starter kit for testing RAG retrieval with a golden test set: plain Node.js, no dependencies.**

Most RAG apps are tested by asking a few questions and checking whether the answers "look right". This kit replaces that with a number you can compare: did retrieval bring back every part of the answer in the top k chunks?

It runs as soon as you clone it, on two small sample documents. Then you swap in your own documents, test questions and retriever.

```bash
git clone <this repo>
cd rag-test-kit
npm run eval
```

```
PASS  q1   single     1/1 parts   I joined a self-paced course 3 days ago ...
PASS  q2   single     1/1 parts   My live batch already had its first class ...
PASS  q3   single     1/1 parts   How long does it take for refunded money ...
PASS  q4   single     1/1 parts   Do quiz marks matter for getting certified?
FAIL  q5   multi-part 1/2 parts   If I take a refund after finishing, what ...

Strict hit@3: 4/5
  single     4/4
  multi-part 0/1
```

The failure is on purpose. Questions whose answer spans two places are usually the first to fail, and a single overall score hides that. This is why the kit reports them separately.

---

## The rules this kit is built on

These came from a LinkedIn discussion with developers who had built real RAG systems.

1. **Write questions from the source documents, not from your chunks.** Questions written from chunks fit neatly inside one chunk and reuse its words, so retrieval looks better than it really is.
2. **Paraphrase.** Real users do not use the document's exact words. "My live batch already had its first class" should still find "Once the first live session has started".
3. **Include multi-part questions,** where the answer needs text from two or more places.
4. **Label answers by source text, not chunk ID.** Each answer is a `docId` plus an exact `quote`. The kit turns the quote into a character span and checks which retrieved chunks overlap it. Change your chunk size, and the test set still works.
5. **Score strictly.** A question passes only when every part of its answer is retrieved. Partial credit makes numbers look fine while answers are half wrong.
6. **Review the set yourself.** If an LLM helps you write questions, remove the ones that are too easy or unclear.
7. **Add real user questions** as soon as you have them. They are the best test cases.
8. **Re-run after every change:** a new embedding model, chunk size, overlap or top-k.

---

## Use it with your own app

**1. Add your documents** to `docs/` as `.txt` files (or set `DOCS_DIR`). The file name is the `docId`.

**2. Write your test set** in `test-set.json`:

```json
{
  "id": "q5",
  "question": "If I take a refund after finishing, what happens to my certificate?",
  "answer": [
    { "docId": "certificates.txt", "quote": "any certificate already issued for that course is cancelled" }
  ]
}
```

A quote must appear exactly once in its document. If it appears more than once, the kit stops and asks you to make it longer.

**3. Replace `retriever.js`** with your own retrieval. The only contract:

```js
// returns the top k chunks, each with its position in the source document
export async function retrieve(question, k) {
  return [{ docId: "certificates.txt", start: 512, end: 812 }, /* ... */];
}
```

That means your chunks need `start` and `end` offsets. Save them at ingestion time, next to `chunkText` and `embedding`. A MongoDB Atlas Vector Search example is in the comments of `retriever.js`.

**4. Run it** and compare settings:

```bash
npm run eval                              # top 3 (default)
K=5 npm run eval                          # top 5
CHUNK_SIZE=150 CHUNK_OVERLAP=20 npm run eval   # demo retriever only
```

---

## Files

```
rag-test-kit/
├── eval.js          # loads the test set, runs retrieval, scores strictly
├── docs.js          # loads documents, turns quotes into character spans
├── retriever.js     # demo keyword retriever: replace with yours
├── test-set.json    # 5 sample questions, including one multi-part
└── docs/            # 2 sample documents (fictional "Sample Academy")
```

## Honest limits

- **It tests retrieval only,** not the final answer. A retrieved chunk can still be misread by the model.
- **The demo retriever is keyword-based.** It exists so the kit runs with no setup. Its scores mean nothing about your system.
- **Quotes must match the text exactly,** including spaces. Cleaned or re-extracted text (for example from PDFs) needs the quotes updated.

## Author

**Rajesh T**, AI Engineering Educator, Hyderabad
[rajesh-t.dev](https://www.rajesh-t.dev) · [LinkedIn](https://www.linkedin.com/in/rajesh-t)
