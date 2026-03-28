// generate.js - نسخة محسنة للتعامل مع الأخطاء
const fetch = require("node-fetch"); // استخدم require بدل import

// قراءة متغيرات البيئة من Vercel
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGING_API_KEY = process.env.HUGGING_API_KEY;

// توليد صورة عبر Gemini مع معالجة الأخطاء
async function generateWithGemini(prompt) {
  try {
    const response = await fetch("https://api.gemini.ai/v1/generate-image", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 512,
        height: 512,
        samples: 1
      })
    });

    const text = await response.text(); // نقرأ النص أولاً
    try {
      return JSON.parse(text); // محاولة تحويله إلى JSON
    } catch {
      return { error: "Invalid JSON response from Gemini", raw: text };
    }
  } catch (err) {
    return { error: "Failed to fetch Gemini API", details: err.message };
  }
}

// توليد صورة عبر HuggingFace مع معالجة الأخطاء
async function generateWithHugging(prompt) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true }
        })
      }
    );

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: "Invalid JSON response from HuggingFace", raw: text };
    }
  } catch (err) {
    return { error: "Failed to fetch HuggingFace API", details: err.message };
  }
}

// الدالة الرئيسية API Route في Vercel
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, service } = req.body;

  if (!prompt || !service) {
    return res.status(400).json({ error: "Prompt and service are required" });
  }

  try {
    let result;
    if (service === "gemini") {
      result = await generateWithGemini(prompt);
    } else if (service === "hugging") {
      result = await generateWithHugging(prompt);
    } else {
      return res.status(400).json({ error: "Unknown service" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};
