export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic rate limiting via Vercel Edge (IP-based, in-memory per instance)
  // For production, replace with Upstash Redis or similar
  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Build Gemini-compatible contents array
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Prepend system prompt as first user turn if provided
    const systemInstruction = system
      ? { parts: [{ text: system }] }
      : { parts: [{ text: 'You are NaijaTax IQ, a knowledgeable Nigerian tax assistant. Answer questions about Nigerian taxation accurately and helpfully.' }] };

    const geminiBody = {
      system_instruction: systemInstruction,
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
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
      console.error('Gemini error:', data);
      return res.status(geminiRes.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

    // Return in a shape the frontend can use easily
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
