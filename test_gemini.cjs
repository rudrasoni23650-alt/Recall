require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test(excerpt) {
  const prompt = `You are the AI engine for Recall, a private second-memory app.
Analyze this saved memory:
Type: "note"
URL: ""
Content: "${excerpt}"

Return a JSON object (no markdown):
{
  "title": "Improved short title (3-8 words) or null to keep existing",
  "summary": "2-3 sentence editorial summary of what this memory contains and why it matters",
  "ai_tags": ["up to 6 concise topic tags, lowercase"],
  "type": "best type from: note|link|article|image|screenshot|pdf|quote|highlight|todo|voice|video|reminder — or null to keep existing",
  "importance": "low|medium|high"
}`;
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  console.log(`Excerpt: ${excerpt}`);
  console.log(result.response.text());
}

(async () => {
  await test("Apple is a fruit");
  await test("Banana is yellow");
})();
