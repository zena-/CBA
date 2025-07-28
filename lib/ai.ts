import type { Context } from './types';
import type { DailyProtocol } from '../types/protocol';

export type Context = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: boolean;
  pantry?: string[];
  weather?: {
    tempF?: number;
    summary?: string;
  };
};

// Prioritize env var, fallback to production URL
const API_URL =
  process.env.EXPO_PUBLIC_API_BASE?.trim() ||
  'https://cba-pzlu.vercel.app/api/protocol';

export async function generateProtocol(context: Context): Promise<DailyProtocol> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user: context }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate protocol');
  }

  const data = await res.json();
  return data.protocol;
}

// --- Very small fallback just in case ---
function fallbackProtocol(ctx: Context): DailyProtocol {
  const date = new Date().toISOString().slice(0, 10);
  return {
    date,
    summary: "Simple protocol fallback",
    blocks: [
      {
        id: "morning",
        title: "morning",
        items: [
          `Hydrate + Magnesium (you slept ${ctx.sleepHours ?? "?"}h)`,
          "Get 5–10 minutes of direct sunlight",
        ],
      },
      {
        id: "afternoon",
        title: "afternoon",
        items: [
          "Take a short walk after lunch",
          "Protein-focused snack (e.g., eggs, yogurt)",
        ],
      },
      {
        id: "evening",
        title: "evening",
        items: ["Screen-time cutoff 60 mins before bed", "Gentle stretch"],
      },
    ],
    pantry_ideas: ctx.pantry?.length ? [`Use: ${ctx.pantry.join(", ")}`] : [],
    weather: ctx.weather,
    busy: [],
    reminders: [],
    media: [],
    sources: ["local-fallback"],
  };
}
