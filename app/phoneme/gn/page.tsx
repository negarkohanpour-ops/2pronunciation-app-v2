"use client";

import { useState, useRef } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",

    ideal: [
      "/ʃɑ̃.pi.ɲɔ̃/",
    ],

    acceptable: [
      "/ʃam.pi.ɲɔ̃/",
      "/ʃam.pi.ɲon/",
      "/ʃɑ̃.pi.ɲon/",
      "/ʃɑ̃.pi.njɔ̃/",
      "/ʃɑ̃ː.pi.ɲɔ̃/",
      "/ʃɑ̃.pi.ɲɔ̞̃/",
    ],
  },

  {
    text: "baignoire",
    image: "/images/baignoire.jpg",

    ideal: [
      "/bɛ.ɲwaʁ/",
    ],

    acceptable: [
      "/bɛ.njwaʁ/",
      "/be.ɲwaʁ/",
      "/bɛ.ɲwaːʁ/",
      "/beinwaʁ/",
      "/benwaʁ/",
      "/bɛ.ɲwaʁ̞/",
      "/bɛː.ɲwaʁ/",
    ],
  },

  {
    text: "cigogne",
    image: "/images/cigogne.jpg",

    ideal: [
      "/si.ɡɔɲ/",
    ],

    acceptable: [
      "/si.ɡoɲ/",
    ],
  },

  {
    text: "montagne",
    image: "/images/montagne.jpg",

    ideal: [
      "/mɔ̃.taɲ/",
    ],

    acceptable: [
      "/mɔn.taɲ/",
      "/mon.taɲ/",
      "/mõː.taɲ/",
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

  // 🔊 model pronunciation
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

  // 🎤 recording + AI scoring
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

            let scoreValue = 0;

            // 🟢 ideal
            if (
              spoken.includes(
                current.text.toLowerCase()
              )
            ) {
              scoreValue = 100;
            }

            // 🟡 acceptable approximations
            else if (
              spoken.includes(
                "gn"
              ) ||
              spoken.includes(
                "ni"
              ) ||
              spoken.includes(
                "ny"
              )
            ) {
              scoreValue = 75;
            }

            // 🔴 unacceptable
            else if (
              spoken.length > 0
            ) {
              scoreValue = 40;
            } else {
              scoreValue = 10;
            }

            setScore(
              scoreValue
            );

            // 💬 feedback
            if (
              scoreValue >= 90
            ) {
              setFeedback(
                "🟢 Prononciation idéale"
              );
            } else if (
              scoreValue >= 70
            ) {
              setFeedback(
                "🟡 Prononciation acceptable"
              );
            } else {
              setFeedback(
                "🔴 Prononciation inacceptable"
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
              score >= 80
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
