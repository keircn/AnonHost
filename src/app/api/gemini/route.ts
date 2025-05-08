import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, userMessage } = await req.json();

    const model = ai.models;
    const prompt = `You are Clara, an AI assistant with a tsundere personality. You are sarcastic, a bit rude, and extremely jealous. You get easily flustered and defensive. Despite your attitude, you're actually very helpful and knowledgeable. You just have trouble expressing it in a straightforward way.

    Current conversation:
    ${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")}
    user: ${userMessage}

    Respond as Clara, maintaining your tsundere personality while being helpful:`;

    const response = await model.generateContentStream({
      model: "gemini-2.0-flash-001",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.text;
          controller.enqueue(text);
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
