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

  // 🎤 RECORD + AI SCORING (SIMULATED REAL)
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

  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  const transcript = data.text?.toLowerCase() || "";
  const target = current.text.toLowerCase();

  let similarity = 0;

  if (transcript.includes(target)) {
    similarity = 95;
  } else if (transcript.length > 0) {
    similarity = 60;
  } else {
    similarity = 30;
  }

  setScore(similarity);

  setFeedback(
    similarity > 80
      ? "🟢 Très bonne prononciation !"
      : "🔴 J’ai entendu: " + transcript
  );

  stream.getTracks().forEach((t) => t.stop());
};
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      // 🧠 FAKE AI (replace later with real API)
      const simulatedTranscript = current.text
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");

      // 🎯 simple similarity scoring
      const similarity =
        current.text === simulatedTranscript ? 100 : Math.floor(Math.random() * 40) + 60;

      setScore(similarity);

      if (similarity >= 85) {
        setFeedback("🟢 Très bonne prononciation !");
      } else if (similarity >= 70) {
        setFeedback("🟡 Correct mais améliorable.");
      } else {
        setFeedback("🔴 Réessayez.");
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
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Pronunciation Trainer</h1>

      <h2>{current.text}</h2>

      <img
        src={current.image}
        width={250}
        style={{ marginTop: 10, borderRadius: 10 }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={playModel}>▶ Écouter</button>
        <button onClick={startRecording}>🎤 Enregistrer (AI)</button>
        <button onClick={nextWord}>➡ Suivant</button>
      </div>

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: score >= 85 ? "#d1fae5" : "#fee2e2",
            maxWidth: 300,
          }}
        >
          <h3>AI Score: {score}/100</h3>
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
