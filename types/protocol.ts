export type BusyWindow = {
  start: string; // ISO
  end: string;   // ISO
  label?: string;
};

export type Weather = {
  location?: string;
  tempF?: number;
  summary?: string;
  humidity?: number;
};

export type MediaSuggestion = {
  label: string;
  url: string;
};

export type ProtocolBlock = {
  id: string;
  title: 'morning' | 'afternoon' | 'evening' | 'general';
  items: string[];          // bullet/action items
  rationale?: string;       // optional “why”
};

export type DailyProtocol = {
  date: string;             // YYYY-MM-DD
  summary: string;          // 1–2 lines
  weather?: Weather;
  busy?: BusyWindow[];
  pantry_ideas?: string[];  // e.g., “eggs + rice → high-protein bowl”
  blocks: {
    title: string;
    items: string[];
  }[];
  reminders?: string[];     // notifications to schedule
  media?: MediaSuggestion[];// YouTube 
  sources?: string[];       // which tools were used (calendar, weather, etc.)
};
