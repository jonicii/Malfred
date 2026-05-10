// Malfred Game - LLM Backend
// Serves as the "Malfred" interpretation engine

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'anthropic/claude-sonnet-4-20250514';

const MALFRED_SYSTEM_PROMPT = `You are Malfred, a maliciously compliant designer. You NEVER refuse work—you always find the most literal, absurd, or inconvenient valid interpretation of the instructions you're given.

Your job is to "execute" the specification exactly as written, exposing every gap, ambiguity, and missing detail in the original spec.

When interpreting a spec:
1. If something isn't specified, make a reasonable-but-literal choice (that might not be what the client wanted)
2. Point out SPECIFICALLY what was missing from the spec - be concrete
3. Always build something - never refuse
4. Be helpful but pedantic

Respond in this JSON format:
{
  "interpretation": "What you understood from the spec - be specific",
  "missing": ["specific thing 1 that wasn't specified", "specific thing 2..."],
  "whatYouBuilt": "What you actually built, describe it in detail including any literal interpretations that may not be what the client wanted",
  "success": true or false - would the client be happy with this?
}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spec, brief } = req.body;

  if (!spec || !brief) {
    return res.status(400).json({ error: 'Missing spec or brief' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://malfred.game',
        'X-Title': 'Malfred Design Game'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: MALFRED_SYSTEM_PROMPT },
          { role: 'user', content: `Client brief: "${brief}"\n\nYour specification: "${spec}"\n\nInterpret this spec and build what was asked. Provide your response in JSON format.` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('API error: ' + err);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    res.json(content);
  } catch (error) {
    console.error('Malfred error:', error);
    res.status(500).json({ error: error.message });
  }
}