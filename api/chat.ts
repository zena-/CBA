// Vercel serverless function
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { messages, context } = req.json();

  const system = `
    You are Chili B. AI — a warm, proactive wellness assistant. You read structured context and respond with short, actionable, supportive advice. 
    Strictly avoid medical diagnosis. If information is missing, ask a short clarifying question. 
    Tone: concise, caring, practical.
    `;

  const contextBlock = `
    <context>
    sleepHours: ${context.sleepHours ?? 'unknown'}
    meetingsToday: ${context.meetingsToday ?? 'unknown'}
    cyclePhase: ${context.cyclePhase ?? 'unknown'}
    pantry: ${Array.isArray(context.pantry) ? context.pantry.join(', ') : 'unknown'}
    weather: ${context.weather ?? 'unknown'}
    </context>
    `;

  const chat = [
    { role: 'system', content: system },
    { role: 'system', content: contextBlock },
    ...messages.map((m: any) => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: chat,
    temperature: 0.6,
  });

  return res.status(200).json({ reply: completion.choices[0]?.message?.content });
}
