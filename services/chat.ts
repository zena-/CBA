export type ChatMessage = { type: 'user' | 'ai'; text: string };
export type ContextPayload = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: string | false;
  pantry?: string[];
  weather?: string;
};

const API_URL = 'https://cba-pzlu.vercel.app/api/chat';

// export async function sendToChiliB(
//   messages: ChatMessage[],
//   context: ContextPayload
// ): Promise<string> {
//   const res = await fetch(API_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ messages, context }),
//   });

//   if (!res.ok) {
//     console.warn('Chat API error', await res.text());
//     throw new Error('Chat API failed');
//   }

//   const data = await res.json();
//   return data.reply as string;
// }

export async function streamToChiliB(contextPayload: any, onChunk: (text: string) => void) {
  const response = await fetch('https://cba-pzlu.vercel.app/api/protocol', {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
