export type ChatMessage = { type: 'user' | 'ai'; text: string };
export type ContextPayload = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: string | false;
  pantry?: string[];
  weather?: string;
};

const API_URL = 'https://cba-pzlu.vercel.app/api/chat';

export async function sendToChiliB(
  messages: ChatMessage[],
  context: ContextPayload
): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });

  if (!res.ok) {
    console.warn('Chat API error', await res.text());
    throw new Error('Chat API failed');
  }

  const data = await res.json();
  return data.reply as string;
}
