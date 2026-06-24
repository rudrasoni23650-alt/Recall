const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAll() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-pro"
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello, respond in one word.");
      console.log(`SUCCESS with ${modelName}: "${result.response.text().trim()}"`);
    } catch (err) {
      console.error(`FAILED with ${modelName}:`, err.message);
    }
  }
}

testAll();
