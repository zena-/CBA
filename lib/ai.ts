export type Context = {
  sleepHours: number;
  cyclePhase?: 'pms' | 'follicular' | 'ovulation' | 'luteal';
  meetingsToday: number;
  pantry: string[];
};

export function generateProtocol(ctx: Context) {
  const out: string[] = [];

  if (ctx.sleepHours < 6) {
    out.push("You didn’t sleep well — magnesium drink + early night tonight.");
  }

  if (ctx.cyclePhase === 'pms') {
    out.push("If your cycle just started, may i suggest red meat tonight? I can guide the steak the way you like.");
  }

  if (ctx.meetingsToday > 5) {
    out.push("Your calendar is packed — a little caffeine + short breaks today.");
  }

  if (ctx.pantry.includes('eggs') && ctx.pantry.includes('rice')) {
    out.push("You have eggs & rice — want a quick high-protein bowl recipe?");
  }

  return out;
}
