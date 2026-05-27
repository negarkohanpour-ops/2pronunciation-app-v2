import { NextResponse } from "next/server";

const rules: Record<string, { ok: string[] }> = {
  champignon: { ok: ["champignon", "champinon", "shampion", "champinjon"] },
  baignoire: { ok: ["baignoire", "benoire", "benwar", "bainoire"] },
  cigogne: { ok: ["cigogne", "sigogne", "sigon"] },
  montagne: { ok: ["montagne", "montan", "montani", "montaigne"] },
  agneau: { ok: ["agneau", "anyo", "anjo", "agneo"] },
};

export async function POST(req: Request) {
  const { spoken, target } = await req.json();

  const s = (spoken || "").toLowerCase().replace(/\s/g, "");
  const t = (target || "").toLowerCase();

  const rule = rules[t];

  let score = 40;

  if (rule) {
    const match = rule.ok.some((w) => s.includes(w));

    if (match) {
      score = 95; // 👈 قبول تلفظ درست
    } else if (s.length > 0) {
      score = 60;
    } else {
      score = 20;
    }
  }

  return NextResponse.json({ score });
}
