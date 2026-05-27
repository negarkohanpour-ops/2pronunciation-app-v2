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

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [audioURL, setAudioURL] = useState("");
  const [analysis, setAnalysis] = useState<string[]>([]);

  const chunksRef = useRef<Blob[]>([]);
  const current = words[index];

  // 🔊 model
  const playModel = () => {
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "fr-FR";
    speechSynthesis.speak(utterance);
  };

  // 🧠 phonetic analysis (PHASE 4)
  const analyze = (spoken: string) => {
    const s = spoken.toLowerCase();
    const issues: string[] = [];
    let score = 30;

    // 🟢 full match boost
    if (s.includes(current.text.toLowerCase())) {
      score = 95;
    }

    // 🧠 detect /ɲ/ sound weakness
    const hasGN = s.includes("gn") || s.includes("ni") || s.includes("ny");

    if (hasGN) {
      score += 25;
    } else {
      issues.push("❌ Son /ɲ/ (gn) absent ou faible");
    }

    // 🧠 syllable check
    let correctSyllables = 0;

    current.syllables.forEach((syll) => {
      if (s.includes(syll.replace(/-/g, ""))) {
        correctSyllables++;
      } else {
        issues.push(`❌ Syllabe manquante: ${syll}`);
      }
    });

    score += correctSyllables * 10;

    // 🟡 fluency heuristic
    if (s.length > 4) score += 10;

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
        setAnalysis(result.issues);

        // 💬 teacher feedback
        if (result.issues.length === 0) {
          setFeedback("🟢 Excellent ! Prononciation très correcte");
        } else if (result.issues.length <= 2) {
          setFeedback("🟡 Bon, mais quelques erreurs");
        } else {
          setFeedback("🔴 À travailler davantage");
        }
      } catch (err) {
        setScore(0);
        setFeedback("Erreur transcription");
        setAnalysis([]);
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
    setScore(null);
    setFeedback("");
    setAnalysis([]);
    setAudioURL("");
  };

  const repeatWeak = () => {
    const weak = analysis.find((a) => a.includes("ɲ") || a.includes("Syllabe"));
    if (weak) {
      alert("🔁 Répéter la prononciation lente du mot");
      playModel();
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 AI Pronunciation Trainer — Phase 4</h1>

      <h2>{current.text}</h2>

      {/* 🧠 syllable visualization */}
      <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
        {current.syllables.map((syll, i) => (
          <span
            key={i}
            style={{
              padding: "5px 10px",
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
        style={{ borderRadius: 10 }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={playModel}>▶ Écouter</button>
        <button onClick={startRecording}>🎤 Enregistrer</button>
        <button onClick={nextWord}>➡ Suivant</button>
        <button onClick={repeatWeak}>🔁 Répéter</button>
      </div>

      {score !== null && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: score >= 70 ? "#d1fae5" : "#fee2e2",
            maxWidth: 500,
          }}
        >
          <h3>Score: {score}/100</h3>
          <p>{feedback}</p>

          {/* 🧠 teacher-style analysis */}
          {analysis.length > 0 && (
            <ul>
              {analysis.map((a, i) => (
                <li key={i}>⚠️ {a}</li>
              ))}
            </ul>
          )}
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
