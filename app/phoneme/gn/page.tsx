"use client";

import { useState, useRef } from "react";

const words = [
  {
    text: "champignon",
    image: "/images/champignon.jpg",

    idealIPA: "/ʃɑ̃.pi.ɲɔ̃/",

    aliases: [
      "champignon",
      "champinyon",
      "champinon",
      "shampignon",
      "shampinyon",
    ],
  },

  {
    text: "baignoire",
    image: "/images/baignoire.jpg",

    idealIPA: "/bɛ.ɲwaʁ/",

    aliases: [
      "baignoire",
      "benoire",
      "beinwar",
      "benwar",
    ],
  },

  {
    text: "cigogne",
    image: "/images/cigogne.jpg",

    idealIPA: "/si.ɡɔɲ/",

    aliases: [
      "cigogne",
      "sigogne",
      "sigony",
    ],
  },

  {
    text: "montagne",
    image: "/images/montagne.jpg",

    idealIPA: "/mɔ̃.taɲ/",

    aliases: [
      "montagne",
      "montanya",
      "montagneu",
    ],
  },

  {
    text: "agneau",
    image: "/images/agneau.jpg",

    idealIPA: "/a.ɲo/",

    aliases: [
      "agneau",
      "agno",
      "anyo",
      "agneo",
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

  // 🔊 pronunciation model
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

  // 🧠 phonetic similarity
  const getSimilarityScore = (
    spoken: string
  ) => {
    const lower =
      spoken.toLowerCase();

    // 🟢 alias match
    const matched =
      current.aliases.some(
        (alias) =>
          lower.includes(alias)
      );

    if (matched) {
      return 95;
    }

    // 🟡 phonetic approximations
    if (
      lower.includes("gn") ||
      lower.includes("ny") ||
      lower.includes("ni") ||
      lower.includes("yo")
    ) {
      return 75;
    }

    // 🟠 weak speech detected
    if (lower.length > 2) {
      return 45;
    }

    // 🔴 almost nothing
    return 10;
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

            // 🎤 audio realism bonus
            if (
              chunksRef.current
                .length > 15
            ) {
              scoreValue += 5;
            }

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
                "🟢 Prononciation excellente"
              );
            } else if (
              scoreValue >= 70
            ) {
              setFeedback(
                "🟡 Prononciation acceptable"
              );
            } else if (
              scoreValue >= 40
            ) {
              setFeedback(
                "🟠 Prononciation proche"
              );
            } else {
              setFeedback(
                "🔴 Prononciation incorrecte"
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

  // ⏭ next
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

      <p>
        IPA idéale:
        {" "}
        {current.idealIPA}
      </p>

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
