import { NextResponse } from "next/server";

// 🧠 Pronunciation database (simplified)
const db: Record<
  string,
  {
    parfait: string[];
    acceptable: string[];
  }
> = {
  champignon: {
    parfait: ["/ʃɑ̃.pi.ɲɔ̃/"],
    acceptable: [
      "/ʃam.pi.ɲɔ̃/",
      "/ʃam.pi.ɲon/",
      "/ʃɑ̃.pi.ɲon/",
      "/ʃɑ̃.pi.njɔ̃/",
      "/ʃɑ̃ː.pi.ɲɔ̃/",
    ],
  },

  baignoire: {
    parfait: ["/bɛ.ɲwaʁ/"],
    acceptable: [
      "/bɛ.njwaʁ/",
      "/be.ɲwaʁ/",
      "/bɛ.ɲwaːʁ/",
      "/benwaʁ/",
    ],
  },

  cigogne: {
    parfait: ["/si.ɡɔɲ/"],
    acceptable: ["/si.ɡoɲ/"],
  },

  montagne: {
    parfait: ["/mɔ̃.taɲ/"],
    acceptable: ["/mon.taɲ/", "/mɔn.taɲ/", "/mõː.taɲ/"],
  },

  agneau: {
    parfait: ["/aɲo/"],
    acceptable: ["/anyo/", "/anjo/", "/agneo/"],
  },
};

// 🧠 normalize
function clean(t: string) {
  return (t || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?]/g, "");
}

export async function POST(req: Request) {
  const { spoken, target } = await req.json();

  const s = clean(spoken);
  const t = clean(target);

  const entry = db[t];

  // fallback
  if (!entry) {
    return NextResponse.json({
      score: 50,
      level: "acceptable",
    });
  }

  // 🟢 PARFAIT
  const isPerfect = entry.parfait.some((p) => {
    const cleanP = p.replace(/\//g, "");
    return s.includes(cleanP);
  });

  if (isPerfect) {
    return NextResponse.json({
      score: 100,
      level: "parfait",
    });
  }

  // 🟡 ACCEPTABLE
  const isOk = entry.acceptable.some((p) => {
    const cleanP = p.replace(/\//g, "");
    return s.includes(cleanP);
  });

  if (isOk) {
    return NextResponse.json({
      score: 80,
      level: "acceptable",
    });
  }

  // 🔴 INACCEPTABLE (fallback phonetic hints)
  let score = 35;

  if (t.includes("gn") && (s.includes("gn") || s.includes("ni"))) {
    score += 20;
  }

  if (t.includes("an") || t.includes("en")) {
    if (s.includes("an") || s.includes("en")) {
      score += 10;
    }
  }

  return NextResponse.json({
    score,
    level: "inacceptable",
  });
}
