
export type MediaType = 'video' | 'audio' | 'image' | 'text';

export interface ClipStyle {
  scale: number; // Percentage (100 = 1x)
  position: { x: number; y: number };
  rotation: number; // Degrees
  opacity: number; // 0-1
}

export interface ClipFilter {
  brightness: number; // Percentage (100 default)
  contrast: number; // Percentage (100 default)
  saturation: number; // Percentage (100 default)
  grayscale: number; // Percentage (0 default)
}

export interface TextData {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  outlineColor?: string;
  outlineWidth?: number;
  effectId?: string; // Reference to TEXT_EFFECTS
}

export interface Clip {
  id: string;
  trackId: string;
  type: MediaType;
  src: string;
  thumbnail?: string;
  name: string;
  duration: number; // in seconds
  startOffset: number; // seconds (Where it sits on the timeline)
  mediaStartOffset: number; // seconds (Where playback starts within the source file)
  sourceDuration: number; // Total duration of the source file
  
  // Editable Properties
  style: ClipStyle;
  filter: ClipFilter;
  volume: number; // 0-100
  speed: number; // 1 = normal
  voiceName?: string; // For TTS clips
  
  // Text Specific
  textData?: TextData;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  color: string;
  isMuted: boolean;
  isHidden: boolean;
  isLocked: boolean;
}

// Pexels API Response Types
export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  full_res: string;
  image: string;
  url: string;
  video_files: PexelsVideoFile[];
  user: {
    name: string;
  }
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  total_results: number;
}

// Vecteezy API Response Types
export interface VecteezyFile {
  id: string;
  title: string;
  thumb_url: string;
  preview_url: string;
  content_type: 'video' | 'photo' | 'vector';
  duration: number;
}

export interface ExportSettings {
  name: string;
  resolution: string;
  quality: 'High' | 'Standard' | 'Web'; // New Quality Preset
  frameRate: string;
  codec: string;
  format: string;
  bitrate: string; // Kept for backward compat/display, but controlled by quality
}

export interface ProjectData {
    version: string;
    meta: {
        created: string;
        appName: string;
        exportSettings: ExportSettings;
    };
    timeline: {
        tracks: Track[];
        clips: Clip[]; 
    };
}

export interface ReferenceImage {
  id: string;
  type: 'subject' | 'scene' | 'style';
  data: string; // Base64 without prefix
  mimeType: string;
  preview: string; // Full Data URL for UI
}

export interface ImageGenOptions {
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  referenceImages: ReferenceImage[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
