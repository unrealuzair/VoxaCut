
// ---------------------------------------------------------------------------
// API KEYS
// Keys are now managed via LocalStorage by the user.
// ---------------------------------------------------------------------------

export const APP_NAME = "VoxaCut";
export const LOCAL_STORAGE_KEY = 'voxacut_project_v1';
export const EXPORT_SETTINGS_KEY = 'voxacut_export_settings_v1';

// Storage Keys
export const MURF_API_KEY_STORAGE = 'voxacut_murf_key_v1';
export const GEMINI_API_KEY_STORAGE = 'voxacut_gemini_key_v1';
export const PEXELS_API_KEY_STORAGE = 'voxacut_pexels_key_v1';
export const ELEVENLABS_API_KEY_STORAGE = 'voxacut_elevenlabs_key_v1';

export const TRACK_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  TEXT: 'text',
} as const;

export const DEFAULT_TRACKS = [
  { id: 't1', name: 'Video Track 1', type: TRACK_TYPES.VIDEO, color: 'bg-blue-600', isMuted: false, isHidden: false, isLocked: false },
  { id: 't2', name: 'Audio Track 1', type: TRACK_TYPES.AUDIO, color: 'bg-teal-600', isMuted: false, isHidden: false, isLocked: false },
  { id: 't3', name: 'Audio Track 2', type: TRACK_TYPES.AUDIO, color: 'bg-emerald-600', isMuted: false, isHidden: false, isLocked: false },
  { id: 't4', name: 'Text Track 1', type: TRACK_TYPES.TEXT, color: 'bg-purple-600', isMuted: false, isHidden: false, isLocked: false },
];

// --- CHAT PROVIDERS ---

export const CHAT_PROVIDERS = [
  { 
    id: 'gemini', 
    name: 'Gemini Flash 2.5', 
    providerName: 'Google', 
    storageKey: GEMINI_API_KEY_STORAGE,
    modelId: 'gemini-2.5-flash' 
  }
];

// --- VOICE LISTS ---

export const GEMINI_VOICES = [
    { id: 'Puck', name: 'Puck (Male, Neutral)' },
    { id: 'Charon', name: 'Charon (Male, Deep)' },
    { id: 'Kore', name: 'Kore (Female, Calm)' },
    { id: 'Fenrir', name: 'Fenrir (Male, Intense)' },
    { id: 'Zephyr', name: 'Zephyr (Female, Soft)' },
];

export const MURF_VOICES = [
  { id: 'en-US-terrell', name: 'Terrell (Male, Deep, Promo)' },
  { id: 'en-US-natalie', name: 'Natalie (Female, Professional, Narration)' },
  { id: 'en-US-cooper', name: 'Cooper (Male, Young, Casual)' },
  { id: 'en-US-iris', name: 'Iris (Female, Calm, Audiobooks)' },
  { id: 'en-US-marcus', name: 'Marcus (Male, Authoritative)' },
  { id: 'en-US-brianna', name: 'Brianna (Female, Soft, Storytelling)' },
  { id: 'en-UK-gabriel', name: 'Gabriel (Male, British, Elegant)' },
  { id: 'en-UK-hazel', name: 'Hazel (Female, British, News)' },
];

export const ELEVENLABS_VOICES = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female, American, Narration)' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, American, Deep)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, American, Soft)' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Male, American, Well-rounded)' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Male, American, Deep)' },
    { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Female, American, Strong)' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Female, American, Emotional)' },
];

export const TEXT_EFFECTS = [
    { id: 'neon-blue', name: 'Blue Neon', style: { color: '#00f3ff', shadowColor: '#00f3ff', shadowBlur: 20 } },
    { id: 'neon-pink', name: 'Pink Glow', style: { color: '#ff00ff', shadowColor: '#ff00ff', shadowBlur: 20 } },
    { id: 'fire', name: 'Fire', style: { color: '#ffaa00', shadowColor: '#ff0000', shadowBlur: 15 } },
    { id: 'clean', name: 'Clean White', style: { color: '#ffffff', shadowColor: 'transparent', shadowBlur: 0 } },
    { id: 'outline', name: 'Outline', style: { color: 'transparent', outlineColor: '#ffffff', outlineWidth: 1 } },
];

export const TEXT_TEMPLATES = [
    { id: 'title-simple', name: 'Simple Title' },
    { id: 'lower-third', name: 'Lower Third' },
    { id: 'social-sub', name: 'Subscribe' },
    { id: 'social-follow', name: 'Follow Us' },
];

export const RESOLUTIONS = ['480p', '720p', '1080p', '2k', '4k'];
export const FRAME_RATES = ['24fps', '25fps', '30fps', '50fps', '60fps'];
export const CODECS = ['H.264', 'HEVC', 'AV1'];
export const FORMATS = ['mp4', 'mov'];
