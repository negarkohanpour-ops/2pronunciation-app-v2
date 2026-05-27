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

  // 🧠 phonetic scoring (NO API)
  const getSimilarityScore = (spoken: string, target: string) => {
    const s = spoken.toLowerCase();

    // 🟢 perfect match
    if (s.includes(target.toLowerCase())) {
      return 95;
    }

    // 🟡 French nasal /ɲ/ patterns (important for your phoneme set)
    const gnSound =
      s.includes("gn") ||
      s.includes("ni") ||
      s.includes("ny") ||
      s.includes("gne");

    if (gnSound) return 85;

    // 🟠 partial similarity (letters overlap)
    const overlap = target
      .toLowerCase()
      .split("")
      .filter((c) => s.includes(c)).length;

    const ratio = overlap / target.length;

    if (ratio > 0.7) return 75;
    if (ratio > 0.4) return 60;

    // 🔴 weak speech
    if (s.length > 2) return 45;

    return 20;
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

        // 🧠 SCORE
        let scoreValue = getSimilarityScore(spoken, current.text);

        // 🎧 small bonus for real speech
        if (chunksRef.current.length > 10) {
          scoreValue += 5;
        }

        if (scoreValue > 100) scoreValue = 100;

        setScore(scoreValue);

        // 💬 feedback
        if (scoreValue >= 90) {
          setFeedback("🟢 Très bonne prononciation");
        } else if (scoreValue >= 75) {
          setFeedback("🟡 Bonne prononciation");
        } else if (scoreValue >= 55) {
          setFeedback("🟠 Prononciation acceptable");
        } else {
          setFeedback("🔴 Essayez encore");
        }
      } catch (err) {
        setScore(0);
        setFeedback("❌ Erreur transcription AI");
      }

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
      <h1>🇫🇷 AI Pronunciation Trainer</h1>

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
            backgroundColor: score >= 75 ? "#d1fae5" : "#fee2e2",
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
