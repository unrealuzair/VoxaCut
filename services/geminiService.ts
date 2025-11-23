
import { GoogleGenAI, Modality } from "@google/genai";
import { ImageGenOptions, ChatMessage } from "../types";

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, type: string) => {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type });
};

export const generateSpeech = async (text: string, apiKey: string, voiceName: string = 'Kore'): Promise<Blob> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find(p => p.inlineData);
    
    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini API");
    }

    return base64ToBlob(audioPart.inlineData.data, 'audio/mp3');

  } catch (error) {
    console.error("Error generating speech with Gemini:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, apiKey: string, options?: ImageGenOptions): Promise<Blob> => {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Construct parts: Prompt first, then reference images
    const parts: any[] = [{ text: prompt }];

    if (options?.referenceImages && options.referenceImages.length > 0) {
        options.referenceImages.forEach(img => {
            parts.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                }
            });
        });
    }

    // NOTE: imageConfig is used for Aspect Ratio
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
            aspectRatio: options?.aspectRatio || "1:1"
        }
      }
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    
    let base64Data = null;
    
    if (responseParts) {
        for (const part of responseParts) {
            if (part.inlineData) {
                base64Data = part.inlineData.data;
                break;
            }
        }
    }

    if (!base64Data) {
      throw new Error("No image data received from Gemini API");
    }

    return base64ToBlob(base64Data, 'image/png');

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw error;
  }
};
