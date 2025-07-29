import OpenAI from 'openai';
import { functions, getFrozenTreatIdeas } from '../lib/functions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ChatMessage = { type: 'user' | 'ai'; text: string };
export type ContextPayload = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: string | false;
  pantry?: string[];
  weather?: string;
};

const API_URL = 'https://cba-swart.vercel.app/api/protocol';

export async function streamToChiliB(contextPayload: any, onChunk: (text: string) => void) {
  const response = await fetch('https://cba-swart.vercel.app/api/protocol', {
    method: 'POST',
    body: JSON.stringify(contextPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onChunk(text);
  }

  return text;
}

export async function sendToChiliB(messages: any[]) {
  const res = await openai.chat.completions.create({
    model: 'gpt-4-0613',
    messages,
    functions,
    function_call: 'auto',
  });

  const msg = res.choices[0].message;

  if (msg.function_call) {
    const { name, arguments: argsString } = msg.function_call;
    const args = JSON.parse(argsString);

    if (name === 'getFrozenTreatIdeas') {
      const result = await getFrozenTreatIdeas(args);

      return {
        role: 'function',
        name,
        content: JSON.stringify(result),
      };
    }
  }

  return msg;
}