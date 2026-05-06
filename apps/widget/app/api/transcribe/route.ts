import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as string) || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const groqUrl = "https://api.groq.com/openai/v1/audio/transcriptions";

    const upstreamForm = new FormData();
    upstreamForm.append("file", file, file.name || "audio.webm");
    upstreamForm.append("model", "whisper-large-v3-turbo");
    if (language) upstreamForm.append("language", language);

    const groqRes = await fetch(groqUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json(
        { error: "Groq request failed", details: errText },
        { status: groqRes.status }
      );
    }

    const data = await groqRes.json();
    // OpenAI-compatible response typically has { text: string }
    return NextResponse.json({ text: data.text ?? "", raw: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
