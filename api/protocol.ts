import OpenAI from "openai";

export const config = {
  runtime: "edge", // no @vercel/node
};

type Context = {
  sleepHours?: number;
  meetingsToday?: number;
  cyclePhase?: boolean;
  pantry?: string[];
  weather?: {
    tempF?: number;
    summary?: string;
  };
};

const protocolSchema = {
  name: "DailyProtocol",
  schema: {
    type: "object",
    required: ["date", "summary", "blocks"],
    properties: {
      date: { type: "string" },
      summary: { type: "string" },
      blocks: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "title", "items"],
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
      pantry_ideas: {
        type: "array",
        items: { type: "string" },
      },
      weather: {
        type: "object",
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
          properties: {
            kind: { type: "string" },
            url: { type: "string" },
            title: { type: "string" },
          },
        },
      },
      sources: { type: "array", items: { type: "string" } },
    },
  },
} as const;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let ctx: Context;
  try {
    ctx = (await req.json()) as Context;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const zapierTool = {
      type: "mcp",
      server_label: "zapier",
      server_url: process.env.ZAPIER_MCP_URL!,
      require_approval: "never" as const,
      headers: {
        Authorization: `Bearer ${process.env.ZAPIER_MCP_KEY}`,
      },
    };

    // Cast to any to dodge SDK type drift on Vercel (we can tighten later)
    const resp: any = await (openai as any).responses.create({
      model: "gpt-4.1-mini",
      tool_choice: "auto",
      tools: [zapierTool],
      response_format: {
        type: "json_schema",
        json_schema: protocolSchema,
      },
      input: [
        {
          role: "system",
          content:
            "You are Chili B., a calm, low-friction background wellness copilot. Always return JSON that matches the schema.",
        },
        {
          role: "user",
          content: `Context:\n${JSON.stringify(ctx, null, 2)}`,
        },
      ],
    });

    const message = resp?.output?.[0];
    const jsonNode = message?.content?.find(
      (c: any) => c.type === "output_json"
    );
    const json = jsonNode?.json;

    if (!json) {
      throw new Error("No output_json in response");
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("protocol API error", err);
    return new Response(
      JSON.stringify({
        error: err?.message ?? "unknown",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
