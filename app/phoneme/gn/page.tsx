"use client";

import { useState, useRef } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",

    aliases: [
      "champignon",
      "champinyon",
      "champinon",
      "shampignon",
      "shampinyon",
      "champignion",
    ],
  },

  {
    text: "baignoire",
    image: "/images/baignoire.jpg",

    aliases: [
      "baignoire",
      "benoire",
      "beinwar",
      "benwar",
      "bainoire",
      "beignoire",
    ],
  },

  {
    text: "cigogne",
    image: "/images/cigogne.jpg",

    aliases: [
      "cigogne",
      "sigogne",
      "sigony",
      "sigone",
    ],
  },

  {
    text: "montagne",
    image: "/images/montagne.jpg",

    aliases: [
      "montagne",
      "montanya",
      "montagneu",
      "montane",
      "montagneh",
    ],
  },

  {
    text: "agneau",
    image: "/images/agneau.jpg",

    aliases: [
      "agneau",
      "agno",
      "anyo",
      "agneo",
      "anyoe",
      "agnoo",
      "anyoe",
    ],
  },
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

  const current = words[index];

  // 🔊 native model
  const playModel = () => {
    const utterance =
      new SpeechSynthesisUtterance(
        current.text
      );

    utterance.lang = "fr-FR";

    speechSynthesis.speak(
      utterance
    );
  };

  // 🧠 smarter tolerant scoring
  const getSimilarityScore = (
    spoken: string
  ) => {
    const lower =
      spoken.toLowerCase();

    // 🟢 close aliases
    const aliasMatch =
      current.aliases.some(
        (alias) =>
          lower.includes(alias)
      );

    if (aliasMatch) {
      return 95;
    }

    // 🟢 strong phonetic hints
    if (
      lower.includes("gn") ||
      lower.includes("ny") ||
      lower.includes("nio") ||
      lower.includes("yo") ||
      lower.includes("ni")
    ) {
      return 82;
    }

    // 🟡 partial similarity
    if (
      lower.length >= 3
    ) {
      return 65;
    }

    // 🔴 weak
    return 35;
  };

  // 🎤 recording
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

      recorder.onstop =
        async () => {
          const blob =
            new Blob(
              chunksRef.current,
              {
                type:
                  "audio/webm",
              }
            );

          setAudioURL(
            URL.createObjectURL(
              blob
            )
          );

          try {
            const formData =
              new FormData();

            formData.append(
              "file",
              blob,
              "audio.webm"
            );

            const res =
              await fetch(
                "/api/transcribe",
                {
                  method:
                    "POST",
                  body: formData,
                }
              );

            const data =
              await res.json();

            const spoken =
              (
                data.text || ""
              )
                .toLowerCase()
                .trim();

            let scoreValue =
              getSimilarityScore(
                spoken
              );

            // 🎤 audio confidence bonus
            if (
              chunksRef.current
                .length > 10
            ) {
              scoreValue += 5;
            }

            // 📊 cap
            if (
              scoreValue > 100
            ) {
              scoreValue = 100;
            }

            setScore(
              scoreValue
            );

            // 💬 feedback
            if (
              scoreValue >= 90
            ) {
              setFeedback(
                "🟢 Très bonne prononciation"
              );
            } else if (
              scoreValue >= 75
            ) {
              setFeedback(
                "🟡 Bonne prononciation"
              );
            } else if (
              scoreValue >= 55
            ) {
              setFeedback(
                "🟠 Prononciation acceptable"
              );
            } else {
              setFeedback(
                "🔴 Essayez encore"
              );
            }
          } catch (err) {
            setScore(0);

            setFeedback(
              "❌ AI error"
            );
          }

          chunksRef.current =
            [];

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

  // ⏭ next word
  const nextWord = () => {
    setIndex(
      (prev) =>
        (prev + 1) %
        words.length
    );

    setAudioURL("");

    setScore(null);

    setFeedback("");
  };

  return (
    <main
      style={{
        padding: 40,
      }}
    >
      <h1>
        🇫🇷 AI Phonetics Trainer
      </h1>

      <h2>
        {current.text}
      </h2>

      <img
        src={current.image}
        width={250}
        style={{
          marginTop: 10,
          borderRadius: 10,
        }}
        alt={current.text}
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
          onClick={nextWord}
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
              score >= 75
                ? "#d1fae5"
                : "#fee2e2",
            maxWidth: 350,
          }}
        >
          <h3>
            Score:
            {" "}
            {score}
            /100
          </h3>

          <p>
            {feedback}
          </p>
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
