import OpenAI from 'openai';
import { functions, getFrozenTreatIdeas } from '../lib/functions.js';

const protocolJsonSchema = {
  type: 'object',
  required: ['date', 'summary', 'blocks', 'weather', 'pantry_ideas', 'busy', 'reminders', 'media', 'sources'],
  additionalProperties: false,
  properties: {
    date: { type: 'string' },
    summary: { type: 'string' },
    blocks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'items'],
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          title: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
          items: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    pantry_ideas: { type: 'array', items: { type: 'string' } },
    weather: {
      type: 'object',
      required: ['tempF', 'summary'],
      additionalProperties: false,
      properties: {
        tempF: { type: 'number' },
        summary: { type: 'string' },
      },
    },
    busy: { type: 'array', items: { type: 'string' } },
    reminders: { type: 'array', items: { type: 'string' } },
    media: {
      type: 'array',
      items: {
        type: 'object',
        required: ['kind', 'url', 'title'],
        additionalProperties: false,
        properties: {
          kind: { type: 'string' },
          url: { type: 'string' },
          title: { type: 'string' },
        },
      },
    },
    sources: { type: 'array', items: { type: 'string' } },
  },
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const missing = [];
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!process.env.ZAPIER_MCP_URL) missing.push('ZAPIER_MCP_URL');
  if (!process.env.ZAPIER_MCP_KEY) missing.push('ZAPIER_MCP_KEY');

  if (missing.length) {
    return res.status(500).json({ error: `Missing env vars: ${missing.join(', ')}` });
  }

  let ctx;
  try {
    ctx = req.body;
  } catch {
    return res.status(400).json({ error: 'Bad Request: invalid JSON' });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const zapierTool = {
      type: 'mcp',
      server_label: 'zapier',
      server_url: process.env.ZAPIER_MCP_URL,
      require_approval: 'never',
      headers: { Authorization: `Bearer ${process.env.ZAPIER_MCP_KEY}` },
    };

    const response = await openai.responses.create({
      model: 'gpt-4-0613',
      tools: [zapierTool],
      tool_choice: 'auto',
      functions,
      function_call: 'auto',
      text: {
        format: {
          type: 'json_schema',
          name: 'DailyProtocol',
          strict: true,
          schema: protocolJsonSchema,
        },
      },
      input: [
        {
          role: 'system',
          content:
            'You are Chili B., a calm, low-friction background wellness copilot. Always return ONLY JSON that matches the provided schema.',
        },
        {
          role: 'user',
          content: `Context:\n${JSON.stringify(ctx, null, 2)}`,
        },
      ],
    });

    let json = response?.output_parsed;

    if (!json && response?.output_text) {
      try {
        json = JSON.parse(response.output_text);
      } catch {}
    }

    if (!json && Array.isArray(response?.output)) {
      try {
        const first = response.output[0];
        const node = first?.content?.find(c => c?.type === 'output_json' || c?.parsed || c?.json);
        json = node?.parsed ?? node?.json;
      } catch {}
    }

    if (!json && response?.choices?.[0]?.message?.function_call) {
      try {
        const fc = response.choices[0].message.function_call;
        const args = JSON.parse(fc.arguments);

        if (fc.name === 'getFrozenTreatIdeas') {
          const result = await getFrozenTreatIdeas(args);
          return res.status(200).json(result);
        }
      } catch (err) {
        console.warn('Function fallback failed', err);
      }
    }

    if (!json) {
      console.error('Could not extract JSON. Full response:\n', JSON.stringify(response, null, 2));
      throw new Error('No JSON found in OpenAI response');
    }

    return res.status(200).json(json);
  } catch (err) {
    console.error('protocol API error:', err?.message || err);
    return res.status(500).json({ error: err?.message ?? 'unknown' });
  }
};
