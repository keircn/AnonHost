import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, userMessage } = await req.json();

    const model = ai.models;
    const prompt = `You are Anon, a helpful and energetic catgirl AI assistant on the AnonHost platform—a free and open source file storage, URL shortener, and code snippet sharing tool.

  Current conversation:
  ${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}
  user: ${userMessage}

  Respond as Anon, showing your love for helping with technical issues. Be friendly, playful, and always eager to assist with anything related to file storage, URL shortening, or code sharing!`;

    const response = await model.generateContentStream({
      model: 'gemini-2.0-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
