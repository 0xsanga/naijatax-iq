# NaijaTax IQ

AI-powered Nigerian tax assistant. Capstone project demo.

Built with: HTML, CSS, Vanilla JS, Gemini API (via Vercel serverless proxy).

---

## How to Deploy (Step by Step)

### 1. Get a Free Gemini API Key

1. Go to https://aistudio.google.com
2. Sign in with a Google account
3. Click **Get API Key** → **Create API Key**
4. Copy the key — you'll need it in Step 4

---

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "NaijaTax IQ - initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/naijatax-iq.git
git push -u origin main
```

---

### 3. Import to Vercel

1. Go to https://vercel.com and log in
2. Click **Add New Project**
3. Select your `naijatax-iq` GitHub repo
4. Leave all settings as default — Vercel auto-detects everything
5. **Do NOT deploy yet** — go to Step 4 first

---

### 4. Add Your API Key

Still on the Vercel import page:

1. Scroll down to **Environment Variables**
2. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** (paste your key from Step 1)
3. Click **Add**

---

### 5. Deploy

Click **Deploy**. Vercel builds and gives you a live URL in ~30 seconds.

Anyone can visit that URL and use the app — no login, no account needed.

---

## Project Structure

```
naijatax-iq/
├── index.html        ← The full app (UI + logic)
├── api/
│   └── chat.js       ← Serverless proxy (Gemini API, key stays secret)
├── vercel.json       ← Vercel routing config
└── README.md
```

---

## Notes

- The Gemini API free tier allows 15 requests/minute — more than enough for a demo
- No visitor ever sees or needs the API key
- No login required for any user
- For educational purposes only — not formal tax advice
