import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({
        text: "",
      });
    }

    const openaiForm = new FormData();

    openaiForm.append(
      "file",
      file,
      "audio.webm"
    );

    openaiForm.append(
      "model",
      "whisper-1"
    );

    openaiForm.append(
      "language",
      "fr"
    );

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,
        },

        body: openaiForm,
      }
    );

    const data =
      await response.json();

    return NextResponse.json({
      text: data.text || "",
    });
  } catch (error) {
    return NextResponse.json({
      text: "",
    });
  }
}
