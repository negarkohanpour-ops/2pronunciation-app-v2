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

  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

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
        const target = current.text.toLowerCase();

        const cleanSpoken = spoken.replace(/[^a-z]/g, "");
        const cleanTarget = target.replace(/[^a-z]/g, "");

        // 🧠 BASE SCORE
        let baseScore = 0;

        if (!cleanSpoken) {
          baseScore = 10;
        } else if (cleanSpoken === cleanTarget) {
          baseScore = 100;
        } else if (cleanSpoken.includes(cleanTarget.slice(0, 4))) {
          baseScore = 85;
        } else if (
          cleanSpoken.includes(cleanTarget) ||
          cleanTarget.includes(cleanSpoken)
        ) {
          baseScore = 70;
        } else {
          const lenDiff = Math.abs(
            cleanSpoken.length - cleanTarget.length
          );

          baseScore = Math.max(30, 60 - lenDiff * 5);
        }

        // 🎤 AUDIO BONUS (simulated improvement)
        const audioLength = chunksRef.current.length;

        let audioBonus = 0;

        if (audioLength > 15) audioBonus = 5;
        if (audioLength > 25) audioBonus = 10;

        // 📊 FINAL SCORE
        const finalScore = Math.min(
          100,
          baseScore + audioBonus
        );

        setScore(finalScore);

        // 💬 feedback
        if (finalScore >= 90) {
          setFeedback("🟢 Excellent pronunciation !");
        } else if (finalScore >= 75) {
          setFeedback("🟡 Good, but can improve");
        } else if (finalScore >= 50) {
          setFeedback("🔴 Not bad, try again");
        } else {
          setFeedback("🔴 Very weak pronunciation");
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
