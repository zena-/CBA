import OpenAI from "openai";

export const config = { runtime: "edge" };

type Context = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: boolean;
  pantry?: string[];
  weather?: { tempF?: number; summary?: string };
};

const protocolJsonSchema = {
  type: "object",
  required: ["date", "summary", "blocks", "weather", "pantry_ideas", "busy"],
  additionalProperties: false,
  properties: {
    date: { type: "string" },
    summary: { type: "string" },
    blocks: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "items"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "other"],
          },
          items: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    pantry_ideas: { type: "array", items: { type: "string" } },
    weather: {
      type: "object",
      required: ["tempF", "summary"],
      additionalProperties: false,
      properties: {
        tempF: { type: "number" },
        summary: { type: "string" },
      },
    },
    busy: { type: "array", items: { type: "string" } },
    reminders: { type: "array", items: { type: "string" } },
    media: {
      type: "array",
      items: {
        type: "object",
        required: ["kind", "url", "title"], // Optional: only if all 3 are needed
        additionalProperties: false,
        properties: {
          kind: { type: "string" },
          url: { type: "string" },
          title: { type: "string" },
        },
      },
    },
    sources: { type: "array", items: { type: "string" } },
  },
} as const;

function cors(origin?: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!process.env.ZAPIER_MCP_URL) missing.push("ZAPIER_MCP_URL");
  if (!process.env.ZAPIER_MCP_KEY) missing.push("ZAPIER_MCP_KEY");
  if (missing.length) {
    return new Response(JSON.stringify({ error: `Missing env vars: ${missing.join(", ")}` }), {
      status: 500,
      headers: { ...cors(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }

  let ctx: Context;
  try {
    ctx = (await req.json()) as Context;
  } catch {
    return new Response(JSON.stringify({ error: "Bad Request: invalid JSON" }), {
      status: 400,
      headers: { ...cors(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const zapierTool = {
      type: "mcp",
      server_label: "zapier",
      server_url: process.env.ZAPIER_MCP_URL!,
      require_approval: "never" as const,
      headers: { Authorization: `Bearer ${process.env.ZAPIER_MCP_KEY}` },
    };

    const response: any = await (openai as any).responses.create({
      model: "gpt-4.1-mini",
      tools: [zapierTool],
      tool_choice: "auto",
      text: {
        format: {
          type: "json_schema",
          name: "DailyProtocol",
          strict: true,
          schema: protocolJsonSchema,
        },
      },
      input: [
        {
          role: "system",
          content:
            "You are Chili B., a calm, low-friction background wellness copilot. Always return ONLY JSON that matches the provided schema.",
        },
        {
          role: "user",
          content: `Context:\n${JSON.stringify(ctx, null, 2)}`,
        },
      ],
    });

    let json: any = response?.output_parsed;
    if (!json && response?.output_text) {
      try {
        json = JSON.parse(response.output_text);
      } catch {/* ignore */}
    }
    if (!json && Array.isArray(response?.output)) {
      try {
        const first = response.output[0];
        const node = first?.content?.find(
          (c: any) => c?.type === "output_json" || c?.parsed || c?.json
        );
        json = node?.parsed ?? node?.json;
      } catch {/* ignore */}
    }

    if (!json) {
      console.error("Could not extract JSON. Full response:\n", JSON.stringify(response, null, 2));
      throw new Error("No JSON found in OpenAI response");
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { ...cors(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("protocol API error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "unknown" }),
      { status: 500, headers: { ...cors(req.headers.get("origin")), "Content-Type": "application/json" } }
    );
  }
}
