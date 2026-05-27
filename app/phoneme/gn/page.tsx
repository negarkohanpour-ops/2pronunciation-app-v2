"use client";

import { useState, useRef } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",
  },
  {
    text: "baignoire",
    image: "/images/baignoire.jpg",
  },
  {
    text: "cigogne",
    image: "/images/cigogne.jpg",
  },
  {
    text: "montagne",
    image: "/images/montagne.jpg",
  },
  {
    text: "agneau",
    image: "/images/agneau.jpg",
  },
];

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [audioURL, setAudioURL] = useState("");

  const [history, setHistory] = useState<number[]>([]);

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🔊 écouter modèle
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🎤 enregistrement
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
        // 1️⃣ transcription (Whisper API)
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const spoken = (data.text || "").toLowerCase().trim();

        // 2️⃣ scoring API
        const res2 = await fetch("/api/score", {
          method: "POST",
          body: JSON.stringify({
            spoken,
            target: current.text,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await res2.json();
        const finalScore = result.score;

        setScore(finalScore);
        setHistory((h) => [...h, finalScore]);

        // 💬 feedback FR
        if (finalScore >= 85) {
          setFeedback("🟢 Excellente prononciation (niveau natif)");
        } else if (finalScore >= 70) {
          setFeedback("🟡 Bon, mais améliore l’articulation");
        } else if (finalScore >= 50) {
          setFeedback("🟠 Compréhensible mais manque de clarté");
        } else {
          setFeedback("🔴 Répétez lentement et clairement");
        }
      } catch (err) {
        setScore(0);
        setFeedback("❌ Erreur de transcription");
      }

      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();

    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  // ➡️ mot suivant
  const nextWord = () => {
    setIndex((p) => (p + 1) % words.length);
    setScore(null);
    setFeedback("");
    setAudioURL("");
  };

  // 📈 tendance
  const getTrend = () => {
    if (history.length < 2) return "stable";

    const last = history[history.length - 1];
    const prev = history[history.length - 2];

    if (last > prev) return "📈 amélioration";
    if (last < prev) return "📉 baisse";
    return "➡ stable";
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 Coach de Prononciation IA</h1>

      <div style={{ marginBottom: 20 }}>
        <h3>📊 Statistiques</h3>
        <p>Score précédent: {history[history.length - 2] || "-"}</p>
        <p>Tendance: {getTrend()}</p>
      </div>

      <h2>{current.text}</h2>

      <img
        src={current.image}
        width={250}
        style={{ borderRadius: 10, marginTop: 10 }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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
