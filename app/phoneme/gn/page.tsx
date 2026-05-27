"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",
    syllables: ["cham", "pi", "gnon"],
  },
  {
    text: "baignoire",
    image: "/images/baignoire.jpg",
    syllables: ["bai", "gnoi", "re"],
  },
  {
    text: "cigogne",
    image: "/images/cigogne.jpg",
    syllables: ["ci", "gogne"],
  },
  {
    text: "montagne",
    image: "/images/montagne.jpg",
    syllables: ["mon", "ta", "gne"],
  },
  {
    text: "agneau",
    image: "/images/agneau.jpg",
    syllables: ["a", "gneau"],
  },
];

// 🧠 pseudo phoneme scoring rules
const phonemeRules = {
  "ɲ": ["gn", "ni", "ny"],
  "ʃ": ["ch", "sh"],
  "ɑ̃": ["an", "en", "am", "em"],
};

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [audioURL, setAudioURL] = useState("");

  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🔊 model
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🧠 phoneme detection (pseudo AI)
  const detectPhonemes = (text: string) => {
    const s = text.toLowerCase();

    const detected: string[] = [];

    Object.entries(phonemeRules).forEach(([phoneme, patterns]) => {
      if (patterns.some((p) => s.includes(p))) {
        detected.push(phoneme);
      }
    });

    return detected;
  };

  // 🧠 scoring engine (Phase 6)
  const analyze = (spoken: string) => {
    const s = spoken.toLowerCase();

    let score = 30;
    const issues: string[] = [];

    // 🟢 exact match
    if (s.includes(current.text.toLowerCase())) {
      score = 95;
    }

    // 🧠 phoneme detection
    const detected = detectPhonemes(s);

    if (detected.includes("ɲ")) {
      score += 25;
    } else {
      issues.push("Son /ɲ/ manquant");
    }

    if (detected.includes("ʃ")) {
      score += 10;
    }

    if (detected.includes("ɑ̃")) {
      score += 10;
    }

    // 🧩 syllable bonus
    let syllableHits = 0;
    current.syllables.forEach((syll) => {
      if (s.includes(syll.replace(/-/g, ""))) {
        syllableHits++;
      } else {
        issues.push(`Syllabe faible: ${syll}`);
      }
    });

    score += syllableHits * 8;

    if (score > 100) score = 100;

    return { score, issues };
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

      setAudioURL(URL.createObjectURL(blob));

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
        setHistory((h) => [...h, result.score]);

        // 🔥 streak system
        if (result.score >= 80) {
          setStreak((s) => s + 1);
          setPoints((p) => p + 10);
        } else {
          setStreak(0);
        }

        // 💬 AI feedback
        if (result.score >= 85) {
          setFeedback("🟢 Excellent pronunciation");
        } else if (result.score >= 70) {
          setFeedback("🟡 Good, refine nasal sounds");
        } else if (result.score >= 50) {
          setFeedback("🟠 Keep practicing syllables");
        } else {
          setFeedback("🔴 Slow repetition needed");
        }
      } catch (err) {
        setScore(0);
        setFeedback("Error transcription");
      }

      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 3000);
  };

  const nextWord = () => {
    setIndex((i) => (i + 1) % words.length);
    setScore(null);
    setFeedback("");
    setAudioURL("");
  };

  // 📈 trend
  const getTrend = () => {
    if (history.length < 2) return "stable";
    const last = history[history.length - 1];
    const prev = history[history.length - 2];

    if (last > prev) return "📈 improving";
    if (last < prev) return "📉 dropping";
    return "➡ stable";
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Speech Coach — Phase 6</h1>

      {/* 🎮 gamification */}
      <div style={{ marginBottom: 15 }}>
        <h3>🎮 Game Stats</h3>
        <p>🔥 Streak: {streak}</p>
        <p>⭐ Points: {points}</p>
        <p>📊 Trend: {getTrend()}</p>
      </div>

      <h2>{current.text}</h2>

      {/* 🧩 syllables */}
      <div style={{ display: "flex", gap: 5 }}>
        {current.syllables.map((syll) => (
          <span
            key={syll}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              background: "#eee",
              fontWeight: 600,
            }}
          >
            {syll}
          </span>
        ))}
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

      {/* 🧠 feedback */}
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
        </div>
      )}

      {/* 🎧 audio */}
      {audioURL && (
        <div style={{ marginTop: 20 }}>
          <audio controls src={audioURL} />
        </div>
      )}
    </main>
  );
}
