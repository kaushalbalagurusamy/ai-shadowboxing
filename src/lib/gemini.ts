import { GoogleGenerativeAI } from "@google/generative-ai";

const getModel = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview" 
  });
};

export const geminiModel = {
  generateContent: async (prompt: string) => {
    const model = getModel();
    return model.generateContent(prompt);
  }
};
