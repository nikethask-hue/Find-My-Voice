const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('WARNING: ANTHROPIC_API_KEY is not set. The /api/match endpoint will return an error until it is configured.');
}

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.post('/api/match', async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured with ANTHROPIC_API_KEY.' });
  }

  const { range, tone, genre, highs, desc } = req.body || {};
  if (!range || !tone || !genre || !highs || !desc) {
    return res.status(400).json({ error: 'Missing required profile fields.' });
  }

  const prompt = `You are a helpful music assistant. Given a singer profile, return a JSON array of 3-5 artist match objects. Each object must contain: name (artist name), why (one-sentence reason why they match based on the profile), song (a single song suggestion to try). Do not include any extra text, only return valid JSON.\n\nProfile:\nVocal range: ${range}\nTone: ${tone}\nGenre: ${genre}\nHigh note approach: ${highs}\nDescription: ${desc}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens_to_sample: 800
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Claude API error: ${text}` });
    }

    const json = await response.json();
    const text = extractResponseText(json);
    const matches = parseJsonArray(text);
    return res.json({ matches });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Unknown server error' });
  }
});

function extractResponseText(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message && typeof data.message.content === 'string') return data.message.content;
  if (data.output && Array.isArray(data.output) && typeof data.output[0]?.content === 'string') return data.output[0].content;
  if (typeof data.completion === 'string') return data.completion;
  return JSON.stringify(data);
}

function parseJsonArray(text) {
  const match = text.match(/\[([\s\S]*)\]/);
  if (!match) {
    throw new Error('Could not parse JSON array from Claude response.');
  }
  return JSON.parse(match[0]);
}

app.listen(port, () => {
  console.log(`Find My Voice server running at http://localhost:${port}`);
});
