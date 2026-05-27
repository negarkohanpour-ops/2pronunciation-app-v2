"use client";

import { useState, useRef } from "react";

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

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🔊 model
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🧠 improved phonetic logic
  const analyzePronunciation = (spoken: string, target: string) => {
    const s = spoken.toLowerCase();

    let score = 20;
    let issues: string[] = [];

    // 🟢 full match
    if (s.includes(target.toLowerCase())) {
      score = 95;
    }

    // 🟡 nasal / gn detection (important for French)
    const hasGN =
      s.includes("gn") || s.includes("ni") || s.includes("ny");

    if (hasGN) {
      score += 20;
    } else {
      issues.push("Son /ɲ/ (gn) manquant");
    }

    // 🟡 syllable awareness
    const syllables = current.syllables.split("-");
    const syllableMatch = syllables.filter((syll) =>
      s.includes(syll.replace(/-/g, ""))
    ).length;

    score += syllableMatch * 10;

    if (syllableMatch < syllables.length / 2) {
      issues.push("Structure syllabique incorrecte");
    }

    // 🟡 length heuristic
    if (s.length > 3) score += 10;

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

        const result = analyzePronunciation(
          spoken,
          current.text
        );

        setScore(result.score);

        // 🎯 level system
        if (result.score >= 85) {
          setLevel("🟢 Excellent");
        } else if (result.score >= 70) {
          setLevel("🟡 Bon");
        } else if (result.score >= 50) {
          setLevel("🟠 Moyen");
        } else {
          setLevel("🔴 À améliorer");
        }

        // 💬 feedback
        setFeedback(
          result.issues.length > 0
            ? result.issues.join(" | ")
            : "Prononciation correcte 🎉"
        );
      } catch (err) {
        setScore(0);
        setFeedback("Erreur transcription");
        setLevel("🔴 Error");
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
      <h1>🇫🇷 AI Phonetics Trainer — Phase 2</h1>

      <h2>{current.text}</h2>

      <p>📚 Syllabes: {current.syllables}</p>

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

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: score >= 70 ? "#d1fae5" : "#fee2e2",
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
