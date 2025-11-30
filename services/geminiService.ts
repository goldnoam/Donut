import { GoogleGenAI, Type } from "@google/genai";
import { Prize } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. Image generation will fail.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePrize = async (): Promise<Prize | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    // Step 1: Generate a creative concept
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Create a unique, magical Hanukkah-themed item for a game reward. It should be one of: Neon Dreidel, Glowing Menorah, Golden Sufganiyot, Ancient Oil Jug, Magical Flashlight, or Cyberpunk Gelt. Provide a cool fantasy name, a 1-sentence magical description, and a detailed visual prompt for an image generator. Return JSON.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          },
          required: ["name", "description", "visualPrompt"]
        }
      }
    });

    const data = JSON.parse(textResponse.text || "{}");
    if (!data.visualPrompt) throw new Error("Failed to generate prize concept");

    // Step 2: Generate the image based on the concept
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `${data.visualPrompt}, 3d render, isometric, magical glow, high quality, dark background` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    let imageBase64 = "";
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageBase64) return null;

    return {
      name: data.name,
      description: data.description,
      image: imageBase64
    };

  } catch (error) {
    console.error("Failed to generate prize:", error);
    return null;
  }
};
