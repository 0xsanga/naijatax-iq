export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body', received: req.body });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured — GEMINI_API_KEY is missing' });
  }

  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = system
      ? { parts: [{ text: system }] }
      : { parts: [{ text: 'You are NaijaTax IQ, a knowledgeable Nigerian tax assistant.' }] };

    const geminiBody = {
      system_instruction: systemInstruction,
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(200).json({ 
        text: `DEBUG ERROR: ${JSON.stringify(data)}`,
        raw: data
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

    if (!text) {
      return res.status(200).json({ 
        text: `DEBUG EMPTY: ${JSON.stringify(data)}`,
        raw: data
      });
    }

    return res.status(200).json({ text });

  } catch (err) {
    return res.status(200).json({ text: `DEBUG EXCEPTION: ${err.message}` });
  }
}