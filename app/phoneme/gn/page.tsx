"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",
    syllables: ["cham", "pi", "gnon"],
    focus: "ɲ",
  },
  {
    text: "baignoire",
    image: "/images/baignoire.jpg",
    syllables: ["bai", "gnoi", "re"],
    focus: "ɲ",
  },
  {
    text: "cigogne",
    image: "/images/cigogne.jpg",
    syllables: ["ci", "gogne"],
    focus: "ɲ",
  },
  {
    text: "montagne",
    image: "/images/montagne.jpg",
    syllables: ["mon", "ta", "gne"],
    focus: "ɲ",
  },
  {
    text: "agneau",
    image: "/images/agneau.jpg",
    syllables: ["a", "gneau"],
    focus: "ɲ",
  },
];

type Mastery = "weak" | "learning" | "mastered";

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [mastery, setMastery] = useState<Record<string, Mastery>>({});

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🔊 model
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🧠 ANALYSIS ENGINE (PHASE 5)
  const analyze = (spoken: string) => {
    const s = spoken.toLowerCase();

    let score = 30;
    const issues: string[] = [];
    const syllableHits: Record<string, boolean> = {};

    // 🟢 full match
    if (s.includes(current.text.toLowerCase())) {
      score = 95;
    }

    // 🧠 /ɲ/ detection
    const hasGN =
      s.includes("gn") || s.includes("ni") || s.includes("ny");

    if (hasGN) {
      score += 25;
    } else {
      issues.push("Son /ɲ/ absent ou incorrect");
    }

    // 🧠 syllables
    let correct = 0;

    current.syllables.forEach((syll) => {
      const clean = syll.replace(/-/g, "");
      const ok = s.includes(clean);

      syllableHits[syll] = ok;

      if (ok) correct++;
      else issues.push(`Syllabe manquante: ${syll}`);
    });

    score += correct * 10;

    if (score > 100) score = 100;

    return { score, issues, syllableHits };
  };

  // 🧠 mastery system
  const updateMastery = (word: string, score: number) => {
    let level: Mastery = "weak";

    if (score >= 85) level = "mastered";
    else if (score >= 60) level = "learning";

    setMastery((prev) => ({
      ...prev,
      [word]: level,
    }));
  };

  // 🎤 recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      try {
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const spoken = (data.text || "").toLowerCase().trim();

        const result = analyze(spoken);

        setScore(result.score);
        setAnalysis(result.issues);

        updateMastery(current.text, result.score);

        // 💬 AI-style feedback
        if (result.score >= 85) {
          setFeedback("🟢 Excellent pronunciation !");
        } else if (result.score >= 70) {
          setFeedback("🟡 Good, but refine nasal sound /ɲ/");
        } else if (result.score >= 50) {
          setFeedback("🟠 Keep practicing syllables");
        } else {
          setFeedback("🔴 Focus on pronunciation slow repetition");
        }
      } catch (err) {
        setScore(0);
        setFeedback("Erreur transcription");
      }

      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 3000);
  };

  const nextWord = () => {
    setIndex((prev) => (prev + 1) % words.length);
    setScore(null);
    setFeedback("");
    setAnalysis([]);
  };

  // 🧠 AI hint system
  const getHint = () => {
    if (score === null) return "🎧 Écoutez d'abord le modèle";
    if (score < 50) return "👉 Prononce lentement chaque syllabe";
    if (score < 80) return "👉 Focus sur le son nasal /ɲ/";
    return "✅ Très bon niveau, continuez";
  };

  const getColor = (syll: string, ok?: boolean) => {
    if (ok === undefined) return "#eee";
    return ok ? "#bbf7d0" : "#fecaca";
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Pronunciation Coach — Phase 5</h1>

      {/* 📊 dashboard */}
      <div style={{ marginBottom: 15 }}>
        <h3>📊 Progress Dashboard</h3>
        <ul>
          {words.map((w) => (
            <li key={w.text}>
              {w.text} →{" "}
              {mastery[w.text] || "not tested"}
            </li>
          ))}
        </ul>
      </div>

      <h2>{current.text}</h2>

      {/* 🧩 syllable heatmap */}
      <div style={{ display: "flex", gap: 5 }}>
        {current.syllables.map((syll) => {
          const ok =
            analysis.length === 0
              ? undefined
              : !analysis.some((a) =>
                  a.includes(syll)
                );

          return (
            <span
              key={syll}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: getColor(syll, ok),
                fontWeight: 600,
              }}
            >
              {syll}
            </span>
          );
        })}
      </div>

      <img
        src={current.image}
        width={250}
        style={{ marginTop: 10, borderRadius: 10 }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={playModel}>▶ Écouter</button>
        <button onClick={startRecording}>🎤 Enregistrer</button>
        <button onClick={nextWord}>➡ Suivant</button>
      </div>

      {/* 🧠 hint engine */}
      <p style={{ marginTop: 10, fontStyle: "italic" }}>
        {getHint()}
      </p>

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor:
              score >= 70 ? "#d1fae5" : "#fee2e2",
            maxWidth: 500,
          }}
        >
          <h3>Score: {score}/100</h3>
          <p>{feedback}</p>

          {analysis.length > 0 && (
            <ul>
              {analysis.map((a, i) => (
                <li key={i}>⚠️ {a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
