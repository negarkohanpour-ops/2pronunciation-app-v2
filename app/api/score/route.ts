import { NextResponse } from "next/server";

// 🧠 pronunciation DB
const pronunciationDB: any = {
  champignon: {
    ideal: ["/ʃɑ̃.pi.ɲɔ̃/"],
    acceptable: [
      "/ʃam.pi.ɲɔ̃/",
      "/ʃam.pi.ɲon/",
      "/ʃɑ̃.pi.ɲon/",
      "/ʃɑ̃.pi.njɔ̃/",
    ],
  },

  baignoire: {
    ideal: ["/bɛ.ɲwaʁ/"],
    acceptable: ["/bɛ.njwaʁ/", "/be.ɲwaʁ/", "/benwaʁ/"],
  },

  cigogne: {
    ideal: ["/si.ɡɔɲ/"],
    acceptable: ["/si.ɡoɲ/"],
  },

  montagne: {
    ideal: ["/mɔ̃.taɲ/"],
    acceptable: ["/mon.taɲ/", "/mɔn.taɲ/"],
  },
};

export async function POST(req: Request) {
  const { spoken, target } = await req.json();

  const t = (target || "").toLowerCase();
  const s = (spoken || "").toLowerCase();

  const entry = pronunciationDB[t];

  let score = 40;

  if (entry) {
    const normalized = s.replace(/\s+/g, "");

    // 🟢 ideal match
    if (
      entry.ideal?.some((p: string) =>
        normalized.includes(p.replace(/\//g, "").replace(/\./g, ""))
      )
    ) {
      score = 100;
    }

    // 🟡 acceptable match
    else if (
      entry.acceptable?.some((p: string) =>
        normalized.includes(p.replace(/\//g, "").replace(/\./g, ""))
      )
    ) {
      score = 85;
    } else {
      score = 50;
    }
  }

  return NextResponse.json({ score });
}
