
import { VecteezyFile } from '../types';

export const searchVecteezy = async (query: string, apiKey: string, type: 'video' | 'photo' | 'vector' = 'video'): Promise<VecteezyFile[]> => {
    if (!apiKey) {
        throw new Error("Vecteezy API Key is missing. Please add it in settings.");
    }

    // Map internal types to API content_type values (plural)
    const contentTypeMap = {
        'video': 'videos',
        'photo': 'photos',
        'vector': 'vectors'
    };
    
    const contentType = contentTypeMap[type];

    try {
        // FIX: Use global search endpoint (/v1/global/search) instead of direct resource endpoints which return 404.
        // This is the correct endpoint for searching media.
        const url = `https://api.vecteezy.com/v1/global/search?term=${encodeURIComponent(query)}&content_type=${contentType}&page=1&per_page=12`;
        
        console.log(`Fetching Vecteezy: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
             if (response.status === 401) throw new Error("Invalid Vecteezy API Key. Please check your credentials.");
             if (response.status === 403) throw new Error("Access Forbidden. Check API Key permissions.");
             if (response.status === 404) throw new Error("Vecteezy API Endpoint Not Found (404). Please contact support.");
             throw new Error(`Vecteezy API Error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        
        if (!json.data) {
            console.warn("Vecteezy response missing data property", json);
            return [];
        }

        // Map response to internal VecteezyFile type
        return json.data.map((item: any) => {
            const attrs = item.attributes || {};
            
            // Robust Thumbnail Extraction
            let thumb = attrs.thumb_url;
            if (!thumb && attrs.image_urls && attrs.image_urls.length > 0) {
                thumb = attrs.image_urls[0].url;
            }
            // Fallback for vectors sometimes
            if (!thumb && attrs.preview_image_url) {
                thumb = attrs.preview_image_url;
            }

            // Robust Preview/HighRes Extraction
            let preview = attrs.preview_url;
            // For videos, sometimes it's in video_previews
            if (type === 'video' && !preview && attrs.video_previews && attrs.video_previews.length > 0) {
                 preview = attrs.video_previews[0].url;
            }
            // For photos/vectors, preview is usually the large thumbnail or standard image
            if (type !== 'video' && !preview) {
                preview = thumb;
            }

            return {
                id: item.id ? item.id.toString() : Math.random().toString(),
                title: attrs.title || 'Untitled',
                thumb_url: thumb || '',
                preview_url: preview || '',
                content_type: type,
                // Videos usually have duration, others don't. Default to 10s for video, 5s for image.
                duration: type === 'video' ? (parseFloat(attrs.duration) || 10) : 5 
            };
        });

    } catch (error) {
        console.error("Error fetching Vecteezy media:", error);
        throw error;
    }
};
