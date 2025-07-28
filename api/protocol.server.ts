// api/protocol.ts
import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DailyProtocol } from "../types/protocol";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ZAPIER_MCP_URL = process.env.ZAPIER_MCP_URL!;
const ZAPIER_MCP_KEY = process.env.ZAPIER_MCP_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const context = req.body ?? {};

    const system = `
You are Chili B., a background wellness copilot. You read the user's context, calendar, weather, pantry,
and produce a short, warm, actionable protocol for the day in the morning. If needed a update in the afternoon and evening. Keep it practical and specific. Prefer Chili B. drinks, protein forward suggestions, and low waste.
Always return valid JSON that matches the provided schema.
`;

    const user = `
Context JSON (from app):
${JSON.stringify(context, null, 2)}

Use Zapier MCP tools *if helpful* to: 
- read calendar busy periods
- check current weather
- fetch a YouTube recipe or stretching video
- etc.

Return a DailyProtocol JSON object.
`;

    const jsonSchema = {
      name: "DailyProtocol",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          date: { type: "string" },
          summary: { type: "string" },
          weather: {
            type: "object",
            additionalProperties: false,
            properties: {
              location: { type: "string", nullable: true },
              tempF: { type: "number", nullable: true },
              summary: { type: "string", nullable: true },
              humidity: { type: "number", nullable: true },
            },
            nullable: true
          },
          busy: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                start: { type: "string" },
                end: { type: "string" },
                label: { type: "string", nullable: true }
              },
              required: ["start", "end"]
            },
            nullable: true
          },
          pantry_ideas: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          blocks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              title: { enum: ["morning", "afternoon", "evening", "general"] },
              items: {
                type: "array",
                items: { type: "string" }
              },
              rationale: { type: "string", nullable: true }
            },
            required: ["id", "title", "items"]
          }
        },
        reminders: {
          type: "array",
          items: { type: "string" },
          nullable: true
        },
        media: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              url: { type: "string" }
            },
            required: ["label", "url"]
          },
          nullable: true
        },
        sources: {
          type: "array",
          items: { type: "string" },
          nullable: true
        }
        },
        required: ["date", "summary", "blocks"]
      },
      strict: true
    };

    const response = await openai.responses.create({
      model: "gpt-4.1-mini", // cheap + tool use; bump to 4.1 if needed
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: jsonSchema },
      tools: [
        {
          type: "mcp",
          server_label: "zapier",
          server_url: ZAPIER_MCP_URL,
          require_approval: "never",
          headers: {
            Authorization: `Bearer ${ZAPIER_MCP_KEY}`,
          },
        },
      ],
      tool_choice: "auto",
      temperature: 0.2,
    });

    // Parse JSON output
    const message = response.output?.find((o: any) => o.type === "message");
    const content = message?.content?.find((c: any) => c.type === "output_json");
    const protocol = (content?.parsed ?? content?.json) as DailyProtocol | undefined;

    if (!protocol) {
      throw new Error("Model did not return valid JSON protocol");
    }

    return res.status(200).json(protocol);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      error: "protocol_failed",
      message: err?.message ?? "Unknown error",
    });
  }
}
