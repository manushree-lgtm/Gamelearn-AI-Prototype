require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 25000);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'PASTE_YOUR_GEMINI_API_KEY_HERE'),
    model: MODEL
  });
});

app.post('/api/generate-case', async (req, res) => {
  try {
    const { topic, level = 'Beginner' } = req.body || {};
    if (!topic || !String(topic).trim()) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Add GEMINI_API_KEY to .env.'
      });
    }

    const cleanTopic = String(topic).replace(/[<>]/g, '').slice(0, 120);
    const cleanLevel = String(level).slice(0, 30);

    const prompt = `You are the educational content engine for GameLearn AI - Error Detective.
Create a learning case for the topic: ${cleanTopic}
Difficulty: ${cleanLevel}

The student MUST learn the concepts before entering Detective City. Create clear, beginner-friendly learning material appropriate to the selected difficulty. Include definitions, key concepts/subtopics, and short examples where useful.

Then create exactly 4 error-detection investigations. Every investigation must test a concept that was explicitly taught in the lessons. The question should ask the student to identify the incorrect statement/line. There must be exactly one correct option: the option that identifies the error. Do not make trick questions unrelated to the lesson.

Return ONLY valid JSON in this exact shape:
{
  "name": "topic name",
  "intro": "short case-file introduction",
  "sub": ["concept 1", "concept 2", "concept 3"],
  "lessons": [
    ["Concept title", "clear explanation", "short example"]
  ],
  "q": [
    {
      "place": "Investigation location",
      "q": "Which statement/line contains the error?",
      "code": "short code or example to inspect",
      "opts": ["option A", "option B", "option C"],
      "ans": 0,
      "why": "Explain why the selected option is the error, using the lesson."
    }
  ]
}

Rules:
- lessons: 4 to 7 items.
- q: exactly 4 items.
- Each opts array: exactly 3 options.
- ans: integer 0, 1, or 2.
- Use simple language and factual teaching.
- Do not include markdown fences or any text outside the JSON.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: 'application/json'
          }
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini request failed.'
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(502).json({ error: 'Gemini returned no case content.' });

    let generated;
    try {
      generated = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: 'Gemini returned invalid JSON.' });
    }

    if (!generated.name || !Array.isArray(generated.lessons) || generated.lessons.length < 4 ||
        !Array.isArray(generated.q) || generated.q.length !== 4) {
      return res.status(502).json({ error: 'Generated case did not match the required format.' });
    }

    res.json(generated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while generating the case.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GameLearn AI running at http://localhost:${PORT}`);
});
