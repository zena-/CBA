import { config } from "dotenv";
import OpenAI from "openai";

config(); // load env vars

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function dailyProtocol() {
  const response = await withRetry(() => openai.responses.create({
    model: "gpt-4o-mini",
    input: `Run daily_protocol: 
    1. Check today's Google Calendar for busy times
    2. Grab the current weather in Austin, TX
    3. how to make monkeybread?
    Return a short morning/afternoon/evening wellness protocol.`,
    tool_choice: "auto",
    tools: [
      {
        type: "mcp",
        server_label: "zapier",
        server_url: "https://mcp.zapier.com/api/mcp/mcp",
        require_approval: "never",
        headers: {
          Authorization: "Bearer OWQ0MDFkN2MtMzlmOC00ZmZmLTg4ZGEtNzk0MWQ3NjRjMTI5OmRiZGJjZjUyLTY3ZWMtNDg5MS04ODJlLWVlNjhjMTNjMzljMg=="
        }
      }
    ]
  }));

  console.log(JSON.stringify(response, null, 2));
}

async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (e) {
    if (retries === 0) throw e;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

dailyProtocol();
