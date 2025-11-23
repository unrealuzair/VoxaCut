
// Helper to convert audio URL to Blob
const urlToBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to download audio file from Murf");
    return await response.blob();
};

export const generateMurfSpeech = async (text: string, voiceId: string, apiKey: string): Promise<Blob> => {
  if (!apiKey) {
    throw new Error("Murf API Key is missing. Please enter it in the settings.");
  }

  // Trim whitespace which often causes 401 errors
  const cleanKey = apiKey.trim();

  try {
    // 1. Request generation
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': cleanKey,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        voiceId: voiceId,
        text: text,
        style: 'General',
        rate: 0,
        pitch: 0,
        sampleRate: 48000,
        format: 'MP3',
        channel: 'STEREO',
        encodeAsBase64: false // We want a URL to fetch
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Murf API Error Details:", JSON.stringify(errorData, null, 2));
      
      // Try to extract a meaningful message
      const message = errorData.message || errorData.error || response.statusText;
      throw new Error(`Murf API Error: ${response.status} - ${message}`);
    }

    const data = await response.json();

    // 2. Murf returns a URL to the generated file
    if (!data.audioFile) {
      throw new Error("No audio URL received from Murf API");
    }

    // 3. Fetch the actual audio blob so we can use it in the timeline offline/locally
    return await urlToBlob(data.audioFile);

  } catch (error) {
    console.error("Error generating speech with Murf:", error);
    throw error;
  }
};
