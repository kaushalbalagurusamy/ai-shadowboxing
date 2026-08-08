import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const tavusKeyMatch = envContent.match(/TAVUS_API_KEY="?([^"\n]+)"?/);
const apiKey = tavusKeyMatch ? tavusKeyMatch[1] : '';

const testConvId = process.argv[2] || "c12408d7adc314f0";

async function checkVerboseEvents(convId: string) {
  const res = await fetch(`https://tavusapi.com/v2/conversations/${convId}?verbose=true`, {
    method: 'GET',
    headers: { "x-api-key": apiKey }
  });

  const data = await res.json();
  console.log("Full Events Payload:", JSON.stringify(data.events, null, 2));
}

checkVerboseEvents(testConvId);
