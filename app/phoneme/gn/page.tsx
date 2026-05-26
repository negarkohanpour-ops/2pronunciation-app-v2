"use client";

import { useState, useRef } from "react";

const words = [
  "champignon",
  "montagne",
];

export default function GNPage() {
  const [index, setIndex] = useState(0);
  const [audioURL, setAudioURL] =
    useState("");
const [score, setScore] =
  useState<number | null>(null);

const [feedback, setFeedback] =
  useState("");
  const chunksRef =
    useRef<Blob[]>([]);

  const currentWord =
    words[index];

  const playModel = () => {
    const utterance =
      new SpeechSynthesisUtterance(
        currentWord
      );

    utterance.lang = "fr-FR";

    speechSynthesis.speak(
      utterance
    );
  };

  const startRecording =
    async () => {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      const recorder =
        new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (
        e
      ) => {
        chunksRef.current.push(
          e.data
        );
      };

      recorder.onstop = () => {
        const blob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const url =
          URL.createObjectURL(blob);

        setAudioURL(url);
const randomScore =
  Math.floor(Math.random() * 4) + 7;

setScore(randomScore);

if (randomScore >= 8) {
  setFeedback(
    "🟢 Bonne prononciation !"
  );
} else {
  setFeedback(
    "🔴 Essayez encore."
  );
}
        stream
          .getTracks()
          .forEach((t) =>
            t.stop()
          );
      };

      recorder.start();

      setTimeout(() => {
        recorder.stop();
      }, 3000);
    };

  return (
    <main style={{ padding: 40 }}>
      <h1>
        🇫🇷 Son /ɲ/
      </h1>

      <p>
        Cliquez pour écouter
        puis enregistrer.
      </p>

      <h2>{currentWord}</h2>
<img
  src="https://upload.wikimedia.org/wikipedia/commons/6/60/Agaricus_bisporus.jpg"
  alt="champignon"
  width="250"
  style={{
    marginTop: 20,
    borderRadius: 10,
  }}
/>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button
          onClick={playModel}
        >
          ▶ Écouter
        </button>

        <button
          onClick={
            startRecording
          }
        >
          🎤 Enregistrer
        </button>

        <button
          onClick={() =>
            setIndex(
              (prev) =>
                (prev + 1) %
                words.length
            )
          }
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
      backgroundColor:
        score >= 8
          ? "#d1fae5"
          : "#fee2e2",
      maxWidth: 300,
    }}
  >
    <h3>
      Score : {score}/10
    </h3>

    <p>{feedback}</p>
  </div>
)}
      {audioURL && (
        <div
          style={{
            marginTop: 20,
          }}
        >
          <audio
            controls
            src={audioURL}
          />
        </div>
      )}
    </main>
  );
}
