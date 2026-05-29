export const config = { runtime: 'edge' };

const MAX_BODY_BYTES = 32_768; // 32 KB

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

  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Request body too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Service configuration error. Please try again later.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const body = await req.json();
  const { messages, system } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid request format.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const systemMessage = {
    role: 'system',
    content: system || 'You are NaijaTax IQ, a knowledgeable Nigerian tax assistant. Answer questions about Nigerian taxation accurately and helpfully.'
  };

  const groqMessages = [systemMessage, ...messages];

  const groqBody = {
    model: 'llama-3.1-8b-instant',
    messages: groqMessages,
    max_tokens: 1024,
    temperature: 0.7
  };

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(groqBody)
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return new Response(JSON.stringify({ error: 'The assistant is currently unavailable. Please try again later.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || 'No response received. Please try again.';

    return new Response(JSON.stringify({ text: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
