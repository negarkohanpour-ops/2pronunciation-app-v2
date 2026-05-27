import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { spoken, target } = await req.json();

  const emb = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: [spoken, target],
  });

  const a = emb.data[0].embedding;
  const b = emb.data[1].embedding;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  const similarity = dot / (magA * magB);

  const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

  return Response.json({
    score,
  });
}
