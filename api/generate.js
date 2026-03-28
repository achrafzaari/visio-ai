// generate.js - CommonJS version
const fetch = require("node-fetch"); // استعمل require بدل import

// قراءة متغيرات البيئة من Vercel
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUGGING_API_KEY = process.env.HUGGING_API_KEY;

// توليد صورة عبر Gemini
async function generateWithGemini(prompt) {
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
  return response.json();
}

// توليد صورة عبر HuggingFace
async function generateWithHugging(prompt) {
  const response = await fetch("https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HUGGING_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true }
    })
  });
  return response.json();
}

// الدالة الرئيسية API Route في Vercel
module.exports = async function handler(req, res) {
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
    res.status(500).json({ error: "Failed to generate image" });
  }
};
