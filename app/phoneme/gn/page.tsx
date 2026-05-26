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

  // 🎧 play pronunciation
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🎤 record audio
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      // 🎯 fake score (prototype)
      const randomScore = Math.floor(Math.random() * 4) + 7;

      setScore(randomScore);

      if (randomScore >= 8) {
        setFeedback("🟢 Bonne prononciation !");
      } else {
        setFeedback("🔴 Essayez encore.");
      }

      stream.getTracks().forEach((t) => t.stop());
    };

    recorder.start();

    setTimeout(() => {
      recorder.stop();
    }, 3000);
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 Son /ɲ/</h1>

      <p>Cliquez pour écouter puis enregistrer.</p>

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

        <button
          onClick={() => {
            setIndex((prev) => (prev + 1) % words.length);
            setAudioURL("");
            setScore(null);
            setFeedback("");
          }}
        >
          ➡ Suivant
        </button>
      </div>

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: score >= 8 ? "#d1fae5" : "#fee2e2",
            maxWidth: 300,
          }}
        >
          <h3>Score : {score}/10</h3>
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
