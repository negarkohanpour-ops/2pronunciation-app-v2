import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { spoken, target } = await req.json();

    const s = (spoken || "").toLowerCase().trim();
    const t = (target || "").toLowerCase().trim();

    let score = 0;

    // 🧠 1. exact match (very strong)
    if (s === t) {
      score = 100;
    }

    // 🧠 2. close match
    else if (s.includes(t) || t.includes(s)) {
      score = 80;
    }

    // 🧠 3. partial similarity (word overlap)
    else {
      const sWords = s.split(" ");
      const tWords = t.split(" ");

      let match = 0;

      for (const w of sWords) {
        if (tWords.includes(w)) match++;
      }

      score = Math.round((match / Math.max(tWords.length, 1)) * 70 + 30);
    }

    // 🧠 4. phoneme bonus (French nasal /ɲ/ etc.)
    if (t.includes("gn")) {
      if (s.includes("gn") || s.includes("ni") || s.includes("ny")) {
        score += 10;
      } else {
        score -= 10;
      }
    }

    if (t.includes("an") || t.includes("en")) {
      if (s.includes("an") || s.includes("en") || s.includes("am")) {
        score += 5;
      }
    }

    // 🧠 5. penalty for too different length
    const diff = Math.abs(s.length - t.length);
    score -= diff * 1.5;

    // 🔒 clamp
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return NextResponse.json({
      score,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur de scoring" },
      { status: 500 }
    );
  }
}
