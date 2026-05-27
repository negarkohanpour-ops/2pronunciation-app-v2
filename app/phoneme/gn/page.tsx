"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",
    syllables: "cham-pi-gnon",
  },
  {
    text: "baignoire",
    image: "/images/baignoire.jpg",
    syllables: "bai-gnoi-re",
  },
  {
    text: "cigogne",
    image: "/images/cigogne.jpg",
    syllables: "ci-gogne",
  },
  {
    text: "montagne",
    image: "/images/montagne.jpg",
    syllables: "mon-ta-gne",
  },
  {
    text: "agneau",
    image: "/images/agneau.jpg",
    syllables: "a-gneau",
  },
];

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [audioURL, setAudioURL] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [level, setLevel] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🧠 load progress
  useEffect(() => {
    const saved = localStorage.getItem("progress");
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  const saveProgress = (newProgress: Record<string, number>) => {
    setProgress(newProgress);
    localStorage.setItem("progress", JSON.stringify(newProgress));
  };

  // 🔊 model
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🧠 scoring engine
  const analyze = (spoken: string) => {
    const s = spoken.toLowerCase();
    let score = 20;

    if (s.includes(current.text.toLowerCase())) {
      score = 95;
    }

    const gn =
      s.includes("gn") || s.includes("ni") || s.includes("ny");

    if (gn) score += 20;

    const syllables = current.syllables.split("-");
    const match = syllables.filter((sy) =>
      s.includes(sy.replace("-", ""))
    ).length;

    score += match * 10;

    if (score > 100) score = 100;

    return score;
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

        const newScore = analyze(spoken);

        setScore(newScore);

        // 🎯 LEVEL
        let lvl = "";
        if (newScore >= 85) lvl = "🟢 Excellent";
        else if (newScore >= 70) lvl = "🟡 Bon";
        else if (newScore >= 50) lvl = "🟠 Moyen";
        else lvl = "🔴 À améliorer";

        setLevel(lvl);

        // 💬 feedback
        setFeedback(
          newScore >= 70
            ? "Bonne prononciation"
            : "Continue à pratiquer"
        );

        // 📊 SAVE PROGRESS
        const updated = {
          ...progress,
          [current.text]:
            Math.max(
              progress[current.text] || 0,
              newScore
            ),
        };

        saveProgress(updated);
      } catch (err) {
        setScore(0);
        setFeedback("Erreur transcription");
      }

      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();

    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  const nextWord = () => {
    setIndex((prev) => (prev + 1) % words.length);
    setAudioURL("");
    setScore(null);
    setFeedback("");
    setLevel("");
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Phonetics Trainer — Phase 3</h1>

      <h2>{current.text}</h2>

      <p>📚 Syllabes: {current.syllables}</p>

      <p>
        🧠 Best score:{" "}
        {progress[current.text] || 0}
      </p>

      <img
        src={current.image}
        width={250}
        style={{
          marginTop: 10,
          borderRadius: 10,
          border:
            (progress[current.text] || 0) >= 80
              ? "3px solid green"
              : "3px solid transparent",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button onClick={playModel}>▶ Écouter</button>
        <button onClick={startRecording}>🎤 Enregistrer</button>
        <button onClick={nextWord}>➡ Suivant</button>
      </div>

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor:
              score >= 70 ? "#d1fae5" : "#fee2e2",
            maxWidth: 400,
          }}
        >
          <h3>Score: {score}/100</h3>
          <h4>{level}</h4>
          <p>{feedback}</p>
        </div>
      )}

      {audioURL && (
        <div style={{ marginTop: 20 }}>
          <audio controls src={audioURL} />
        </div>
      )}
    </main>
  );
}
