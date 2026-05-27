import { NextResponse } from "next/server";

// 🧠 pronunciation database (your rules)
const pronunciationDB: Record<
  string,
  {
    ideal: string[];
    acceptable: string[];
  }
> = {
  champignon: {
    ideal: ["/ʃɑ̃.pi.ɲɔ̃/"],
    acceptable: [
      "/ʃam.pi.ɲɔ̃/",
      "/ʃam.pi.ɲon/",
      "/ʃɑ̃.pi.ɲon/",
      "/ʃɑ̃.pi.njɔ̃/",
      "/ʃɑ̃ː.pi.ɲɔ̃/",
      "/ʃɑ̃.pi.ɲɔ̞̃/",
    ],
  },

  baignoire: {
    ideal: ["/bɛ.ɲwaʁ/"],
    acceptable: [
      "/bɛ.njwaʁ/",
      "/be.ɲwaʁ/",
      "/bɛ.ɲwaːʁ/",
      "/beinwaʁ/",
      "/benwaʁ/",
      "/bɛ.ɲwaʁ̞/",
      "/bɛː.ɲwaʁ/",
    ],
  },

  cigogne: {
    ideal: ["/si.ɡɔɲ/"],
    acceptable: ["/si.ɡoɲ/"],
  },

  montagne: {
    ideal: ["/mɔ̃.taɲ/"],
    acceptable: ["/mɔn.taɲ/", "/mon.taɲ/", "/mõː.taɲ/"],
  },
};

export async function POST(req: Request) {
  const { spoken, target } = await req.json();

  const t = target.toLowerCase();
  const s = spoken.toLowerCase();

  const entry = pronunciationDB[t];

  if (!entry) {
    return NextResponse.json({ score: 50 });
  }

  // 🧠 normalize spoken (very important)
  const normalized = s
    .replace(/\s+/g, "")
    .replace(/[^\wɲɑ̃ɔɛœʃʒ]/g, "");

  let score = 0;

  // 🟢 ideal match = 100
  if (
    entry.ideal.some((p) =>
      normalized.includes(p.replace(/\//g, "").replace(/\./g, ""))
    )
  ) {
    score = 100;
  }

  // 🟡 acceptable match = 80–90
  else if (
    entry.acceptable.some((p) =>
      normalized.includes(p.replace(/\//g, "").replace(/\./g, ""))
    )
  ) {
    score = 85;
  }

  // 🟠 partial phoneme hint
  else {
    const hints = {
      champignon: ["gn", "ni"],
      baignoire: ["gn", "wa"],
      cigogne: ["gn"],
      montagne: ["gn"],
    };

    const h = hints[t] || [];

    let match = 0;

    h.forEach((x) => {
      if (s.includes(x)) match++;
    });

    score = 40 + match * 10;
  }

  // 🔒 clamp
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return NextResponse.json({ score });
}
