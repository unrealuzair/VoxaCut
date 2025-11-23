
import { GoogleGenAI, Modality } from "@google/genai";

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

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<Blob> => {
  try {
    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Call Gemini TTS
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

    // Extract audio data
    const parts = response.candidates?.[0]?.content?.parts;
    const audioPart = parts?.find(p => p.inlineData);
    
    if (!audioPart || !audioPart.inlineData || !audioPart.inlineData.data) {
      throw new Error("No audio data received from Gemini API");
    }

    // Convert to Blob
    return base64ToBlob(audioPart.inlineData.data, 'audio/mp3');

  } catch (error) {
    console.error("Error generating speech with Gemini:", error);
    throw error;
  }
};
