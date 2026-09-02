import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

const getModel = (generationConfig?: GenerationConfig) => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig
  });
};

export const geminiModel = {
  generateContent: async (prompt: string, generationConfig?: GenerationConfig) => {
    const model = getModel(generationConfig);
    return model.generateContent(prompt);
  }
};

