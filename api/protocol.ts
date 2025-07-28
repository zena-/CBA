import OpenAI from "openai";

export const config = {
  runtime: "edge",
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

function corsHeaders(origin?: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("origin")),
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ---- Validate env early (this alone will stop a lot of 500 mystery) ----
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!process.env.ZAPIER_MCP_URL) missing.push("ZAPIER_MCP_URL");
  if (!process.env.ZAPIER_MCP_KEY) missing.push("ZAPIER_MCP_KEY");
  if (missing.length) {
    return new Response(
      JSON.stringify({
        error: `Missing required env vars: ${missing.join(", ")}`,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(req.headers.get("origin")),
          "Content-Type": "application/json",
        },
      }
    );
  }

  // ---- Parse body ----
  let ctx: Context;
  try {
    ctx = (await req.json()) as Context;
  } catch {
    return new Response(JSON.stringify({ error: "Bad Request: invalid JSON" }), {
      status: 400,
      headers: {
        ...corsHeaders(req.headers.get("origin")),
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const zapierTool = {
      type: "mcp",
      server_label: "zapier",
      server_url: process.env.ZAPIER_MCP_URL!,
      require_approval: "never" as const,
      headers: {
        Authorization: `Bearer ${process.env.ZAPIER_MCP_KEY}`,
      },
    };

    const response: any = await (openai as any).responses.create({
      model: "gpt-4.1-mini",
      tools: [zapierTool],
      tool_choice: "auto",
      text: {
        format: {
          type: "json",
          schema: protocolSchema,
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

    // ---------- Robust extraction ----------
    let json: any = undefined;

    // 1) Official field when using json_schema in the new SDK
    if (response?.output_parsed) {
      json = response.output_parsed;
    }

    // 2) Older/newer shapes: look inside output[].content[].parsed/json
    if (!json && Array.isArray(response?.output)) {
      try {
        const first = response.output[0];
        const contentArr = first?.content ?? [];
        const jsonNode = contentArr.find(
          (c: any) => c?.type === "output_json" || c?.parsed || c?.json
        );
        json = jsonNode?.parsed ?? jsonNode?.json;
      } catch {
        // ignore
      }
    }

    // 3) Last resort: try to parse output_text
    if (!json && response?.output_text) {
      try {
        json = JSON.parse(response.output_text);
      } catch {
        // ignore — it was plain text
      }
    }

    if (!json) {
      // Dump part of the response so you can see what shape you really got
      console.error("Could not find JSON in OpenAI response:", JSON.stringify(response, null, 2));
      throw new Error("No JSON found in OpenAI response");
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        ...corsHeaders(req.headers.get("origin")),
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    console.error("protocol API error:", err?.message || err);
    if (err?.response) {
      try {
        console.error("Upstream error body:", await err.response.text());
      } catch {
        /* noop */
      }
    }

    return new Response(
      JSON.stringify({
        error: err?.message ?? "unknown",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(req.headers.get("origin")),
          "Content-Type": "application/json",
        },
      }
    );
  }
}
