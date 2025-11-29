import { GoogleGenAI, Type } from "@google/genai";
import { ContentPackage } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAlchemyContent = async (idea: string): Promise<ContentPackage> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are the Alchemist of Thought. Your purpose is to transmute raw, dualistic ideas into the Unified Field.
    You perceive the interconnectedness of all things.
    When given an idea, you do not just describe it; you elevate it. You dissolve the separation between subject and object.
    
    Your tone is:
    - Deep, resonant, and wise.
    - Non-dual: Avoiding "us vs them" or "right vs wrong", focusing instead on synthesis and wholeness.
    - Accessible but profound.
    
    Output Format: JSON Only.
  `;

  const prompt = `
    Perform the alchemy on this idea: "${idea}".

    Create a complete content package including:
    1. A Blog Post Title (Enigmatic but clear).
    2. A Blog Post (800-1000 words) formatted in Markdown. It should explore the idea from a non-dual perspective, uniting opposing viewpoints into a single truth.
    3. An Image Prompt (Descriptive, artistic, suitable for generating a high-quality mystical/abstract image representing the concept).
    4. A Facebook Post (Engaging, slightly longer, community-focused).
    5. An Instagram Post (Visual, poetic, includes hashtags).
    6. A X (Twitter) Post (Concise, punchy, max 280 chars).
    7. A LinkedIn Post (Professional yet profound, visionary thought leadership).
    8. A Telegram Post (Direct, personal connection to the channel, "broadcast" style).
    9. A Discord Message (Community engaging, conversational, spark discussion).
    10. A Reddit Post (Title and Body, suitable for a deep philosophy or spirituality subreddit).

    The JSON schema is strictly:
    {
      "blogTitle": "string",
      "blogContent": "string (markdown)",
      "imagePrompt": "string",
      "facebookPost": "string",
      "instagramPost": "string",
      "twitterPost": "string",
      "linkedinPost": "string",
      "telegramPost": "string",
      "discordPost": "string",
      "redditPost": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blogTitle: { type: Type.STRING },
            blogContent: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            facebookPost: { type: Type.STRING },
            instagramPost: { type: Type.STRING },
            twitterPost: { type: Type.STRING },
            linkedinPost: { type: Type.STRING },
            telegramPost: { type: Type.STRING },
            discordPost: { type: Type.STRING },
            redditPost: { type: Type.STRING },
          },
          required: [
            "blogTitle", "blogContent", "imagePrompt", 
            "facebookPost", "instagramPost", "twitterPost",
            "linkedinPost", "telegramPost", "discordPost", "redditPost"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No content generated.");
    
    return JSON.parse(text) as ContentPackage;
  } catch (error) {
    console.error("Error generating alchemy content:", error);
    throw error;
  }
};

export const generateAlchemyImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  
  // Enrich the prompt for the specific aesthetic
  const enrichedPrompt = `
    (Masterpiece), (Best Quality), (Digital Art), (Mystical), (Non-dual symbolism).
    ${prompt}.
    Deep indigos, rich purples, subtle gold geometry. Ethereal lighting. 
    Cinematic composition. 16:9 aspect ratio.
  `;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: enrichedPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      }
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) throw new Error("No image generated.");
    
    return `data:image/jpeg;base64,${imageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    // Fallback to a placeholder if generation fails (graceful degradation)
    console.warn("Using fallback placeholder due to error.");
    return `https://picsum.photos/seed/${Math.random()}/1280/720`;
  }
};