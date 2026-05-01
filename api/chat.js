export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ text: 'DEBUG: GEMINI_API_KEY is not set' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const body = await req.json();
  const { messages, system } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ text: 'DEBUG: invalid messages array' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const contents = messages.map(function(m) {
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    };
  });

  const systemInstruction = system
    ? { parts: [{ text: system }] }
    : { parts: [{ text: 'You are NaijaTax IQ, a knowledgeable Nigerian tax assistant. Answer questions about Nigerian taxation accurately and helpfully.' }] };

  const geminiBody = {
    system_instruction: systemInstruction,
    contents: contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
  };

  try {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b-001:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return new Response(JSON.stringify({ text: 'DEBUG GEMINI ERROR: ' + JSON.stringify(data) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    var text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      text = data.candidates[0].content.parts.map(function(p) { return p.text || ''; }).join('');
    }

    if (!text) {
      text = 'DEBUG EMPTY RESPONSE: ' + JSON.stringify(data);
    }

    return new Response(JSON.stringify({ text: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ text: 'DEBUG EXCEPTION: ' + err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
