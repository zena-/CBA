import { OpenAI } from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    });

    res.status(200).json({ result: completion.choices[0].message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
