
export const generateElevenLabsSpeech = async (text: string, voiceId: string, apiKey: string): Promise<Blob> => {
    if (!apiKey) {
        throw new Error("ElevenLabs API Key is missing.");
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("ElevenLabs API Error:", errorData);
            throw new Error(`ElevenLabs API Error: ${response.status}`);
        }

        return await response.blob();

    } catch (error) {
        console.error("Error generating speech with ElevenLabs:", error);
        throw error;
    }
};
