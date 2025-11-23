
import { PexelsResponse } from '../types';

export const searchPexelsVideos = async (query: string, apiKey: string): Promise<PexelsResponse> => {
  if (!apiKey) {
    throw new Error("Pexels API Key is missing. Please add it in settings.");
  }

  try {
    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Pexels videos:", error);
    throw error;
  }
};
