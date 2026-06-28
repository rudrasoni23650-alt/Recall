require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function backfill() {
  const { data: memories } = await supabase.from('memories').select('*').is('summary', null);
  console.log(`Found ${memories.length} memories to backfill.`);
  
  for (const memory of memories) {
    console.log(`Processing: ${memory.title}`);
    
    const content = [
      memory.title, memory.excerpt, memory.plain_text, memory.body
    ].filter(Boolean).join(' ').slice(0, 3000);

    const prompt = `You are the AI engine for Recall, a private second-memory app.
Analyze this saved memory:
Type: "${memory.type}"
URL: "${memory.source_url || memory.url || ''}"
Content: "${content}"

Return a JSON object (no markdown):
{
  "title": "Improved short title (3-8 words) or null to keep existing",
  "summary": "2-3 sentence editorial summary of what this memory contains and why it matters",
  "ai_tags": ["up to 6 concise topic tags, lowercase"],
  "type": "best type from: note|link|article|image|screenshot|pdf|quote|highlight|todo|voice|video|reminder — or null to keep existing",
  "importance": "low|medium|high"
}`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(text);
      console.log(`Generated summary: ${parsed.summary}`);
      
      await supabase.from('memories').update({
        summary: parsed.summary,
        ai_tags: parsed.ai_tags || [],
        title: (parsed.title && parsed.title !== memory.title) ? parsed.title : memory.title,
        type: (parsed.type && parsed.type !== memory.type) ? parsed.type : memory.type,
        processing_status: 'completed'
      }).eq('id', memory.id);
      
    } catch (err) {
      console.error(`Failed to process ${memory.id}:`, err.message);
    }
  }
  
  console.log("Done backfilling.");
}

backfill();
