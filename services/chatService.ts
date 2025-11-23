
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";
import { CHAT_PROVIDERS } from "../constants";

export const sendChatMessage = async (
    providerId: string,
    history: ChatMessage[], 
    newMessage: string, 
    apiKey: string
): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");

    // We verify the provider exists in our (now reduced) list
    const providerConfig = CHAT_PROVIDERS.find(p => p.id === providerId);
    if (!providerConfig) throw new Error("Invalid Provider");

    const fullHistory = [...history, { role: 'user', text: newMessage } as ChatMessage];

    if (providerId === 'gemini') {
        const ai = new GoogleGenAI({ apiKey });
        
        // The SDK expects history as an array of Content objects, excluding the last message (which is sent via sendMessage)
        const sdkHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({
            model: providerConfig.modelId,
            history: sdkHistory,
            config: {
                systemInstruction: "You are VoxaBot, a video editing assistant. Help the user with editing tips, script ideas, or technical questions about video production.",
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "No response.";
    }

    throw new Error("Provider not implemented");
};
