"use client";

import { useState, useRef } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",
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
  const [audioURL, setAudioURL] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  const chunksRef = useRef<Blob[]>([]);

  const current = words[index];

  // 🔊 model pronunciation
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🎤 AI recording + scoring
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

        // 🧠 SAFE AI OUTPUT
        const spoken = (data.text || "").toLowerCase().trim();
        const target = current.text.toLowerCase();

        const cleanSpoken = spoken.replace(/[^a-z]/g, "");
        const cleanTarget = target.replace(/[^a-z]/g, "");

        let scoreValue = 0;

        // 🧠 ADVANCED SCORING (stable + safe)
        if (!cleanSpoken) {
          scoreValue = 15;
        } else if (cleanSpoken === cleanTarget) {
          scoreValue = 100;
        } else if (cleanSpoken.startsWith(cleanTarget.slice(0, 3))) {
          scoreValue = 85;
        } else if (
          cleanSpoken.includes(cleanTarget) ||
          cleanTarget.includes(cleanSpoken)
        ) {
          scoreValue = 70;
        } else {
          const lenDiff = Math.abs(
            cleanSpoken.length - cleanTarget.length
          );

          scoreValue = Math.max(35, 60 - lenDiff * 5);
        }

        setScore(scoreValue);

        // 💬 feedback (no transcript shown)
        if (scoreValue >= 90) {
          setFeedback("🟢 Parfait ! Excellente prononciation");
        } else if (scoreValue >= 75) {
          setFeedback("🟡 Bon travail, continue");
        } else if (scoreValue >= 50) {
          setFeedback("🔴 À améliorer");
        } else {
          setFeedback("🔴 Réessayez");
        }
      } catch (err) {
        setScore(0);
        setFeedback("❌ AI error");
      }

      chunksRef.current = [];
      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();

    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  // ⏭ next word
  const nextWord = () => {
    setIndex((prev) => (prev + 1) % words.length);
    setAudioURL("");
    setScore(null);
    setFeedback("");
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Pronunciation Trainer (/ɲ/)</h1>

      <h2>{current.text}</h2>

      <img
        src={current.image}
        width={250}
        style={{ marginTop: 10, borderRadius: 10 }}
        alt={current.text}
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
            backgroundColor: score >= 80 ? "#d1fae5" : "#fee2e2",
            maxWidth: 350,
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
