export function detectUserIntent(input: string): {
  mode: 'chat' | 'protocol';
  topic?: string;
  aiText?: string;
} {
  const normalized = input.toLowerCase();

  if (normalized.includes('dinner')) {
    return {
      mode: 'chat',
      topic: 'dinner',
      aiText: "Would you like recipe ideas, a pantry check, or outfit/restaurant suggestions for tonight’s weather?",
    };
  }

  if (
    normalized.includes('meeting') ||
    normalized.includes('calendar') ||
    normalized.includes('schedule') ||
    normalized.includes('update')
  ) {
    return {
      mode: 'protocol',
      topic: 'schedule',
    };
  }

  return { mode: 'chat' };
}
