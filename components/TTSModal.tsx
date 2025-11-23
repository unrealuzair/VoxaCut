
import React, { useState, useEffect } from 'react';
import { X, Loader2, PlayCircle, Sparkles, KeyRound, Bot, Mic2, Zap } from 'lucide-react';
import { generateMurfSpeech } from '../services/murfService';
import { generateSpeech as generateGeminiSpeech } from '../services/geminiService';
import { generateElevenLabsSpeech } from '../services/elevenLabsService';
import { MURF_VOICES, GEMINI_VOICES, ELEVENLABS_VOICES, MURF_API_KEY_STORAGE, GEMINI_API_KEY_STORAGE, ELEVENLABS_API_KEY_STORAGE } from '../constants';

interface TTSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAudio: (blob: Blob, text: string, voiceName: string) => void;
}

type Provider = 'gemini' | 'murf' | 'elevenlabs';

export const TTSModal: React.FC<TTSModalProps> = ({ isOpen, onClose, onAddAudio }) => {
  const [activeProvider, setActiveProvider] = useState<Provider>('gemini');
  
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keys
  const [geminiKey, setGeminiKey] = useState('');
  const [murfKey, setMurfKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');

  // Selection
  const [selectedVoice, setSelectedVoice] = useState('');

  // Load Keys on Mount
  useEffect(() => {
    setGeminiKey(localStorage.getItem(GEMINI_API_KEY_STORAGE) || '');
    setMurfKey(localStorage.getItem(MURF_API_KEY_STORAGE) || '');
    setElevenKey(localStorage.getItem(ELEVENLABS_API_KEY_STORAGE) || '');
  }, []);

  // Reset voice selection when provider changes
  useEffect(() => {
      if (activeProvider === 'gemini') setSelectedVoice(GEMINI_VOICES[0].id);
      if (activeProvider === 'murf') setSelectedVoice(MURF_VOICES[0].id);
      if (activeProvider === 'elevenlabs') setSelectedVoice(ELEVENLABS_VOICES[0].id);
      setError('');
  }, [activeProvider]);

  const saveKey = (key: string, type: Provider) => {
      if (type === 'gemini') {
          setGeminiKey(key);
          localStorage.setItem(GEMINI_API_KEY_STORAGE, key);
      } else if (type === 'murf') {
          setMurfKey(key);
          localStorage.setItem(MURF_API_KEY_STORAGE, key);
      } else if (type === 'elevenlabs') {
          setElevenKey(key);
          localStorage.setItem(ELEVENLABS_API_KEY_STORAGE, key);
      }
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    let currentKey = '';
    if (activeProvider === 'gemini') currentKey = geminiKey;
    if (activeProvider === 'murf') currentKey = murfKey;
    if (activeProvider === 'elevenlabs') currentKey = elevenKey;

    if (!currentKey.trim()) {
      setError(`Please enter your ${activeProvider === 'elevenlabs' ? 'ElevenLabs' : activeProvider === 'murf' ? 'Murf' : 'Gemini'} API Key.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let blob: Blob;
      let voiceNameDisplay = selectedVoice;

      if (activeProvider === 'gemini') {
           blob = await generateGeminiSpeech(text, currentKey, selectedVoice);
           const vObj = GEMINI_VOICES.find(v => v.id === selectedVoice);
           voiceNameDisplay = vObj ? `Gemini - ${vObj.name}` : `Gemini - ${selectedVoice}`;
      } else if (activeProvider === 'murf') {
           blob = await generateMurfSpeech(text, selectedVoice, currentKey);
           const vObj = MURF_VOICES.find(v => v.id === selectedVoice);
           voiceNameDisplay = vObj ? `Murf - ${vObj.name}` : `Murf - ${selectedVoice}`;
      } else {
           blob = await generateElevenLabsSpeech(text, selectedVoice, currentKey);
           const vObj = ELEVENLABS_VOICES.find(v => v.id === selectedVoice);
           voiceNameDisplay = vObj ? `11Labs - ${vObj.name}` : `11Labs - ${selectedVoice}`;
      }

      onAddAudio(blob, text, voiceNameDisplay);
      onClose();
      setText(''); 
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentVoices = () => {
      if (activeProvider === 'gemini') return GEMINI_VOICES;
      if (activeProvider === 'murf') return MURF_VOICES;
      return ELEVENLABS_VOICES;
  };

  const getCurrentKey = () => {
    if (activeProvider === 'gemini') return geminiKey;
    if (activeProvider === 'murf') return murfKey;
    return elevenKey;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] w-full max-w-4xl rounded-xl border border-[#333] shadow-2xl flex h-[85vh] overflow-hidden">
        
        {/* LEFT SIDEBAR: Providers */}
        <div className="w-64 bg-[#171717] border-r border-[#333] flex flex-col p-4">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Mic2 className="text-[#00E5E5]" size={20} />
                Voiceover AI
            </h2>
            
            <div className="space-y-2">
                <button 
                    onClick={() => setActiveProvider('gemini')}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${activeProvider === 'gemini' ? 'bg-[#252525] border border-[#00E5E5] text-white' : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'}`}
                >
                    <Sparkles size={16} className={activeProvider === 'gemini' ? 'text-blue-400' : ''} />
                    <div>
                        <div className="font-semibold text-sm">Gemini Flash</div>
                        <div className="text-[10px] opacity-60">Google DeepMind</div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveProvider('elevenlabs')}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${activeProvider === 'elevenlabs' ? 'bg-[#252525] border border-[#00E5E5] text-white' : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'}`}
                >
                    <Zap size={16} className={activeProvider === 'elevenlabs' ? 'text-yellow-400' : ''} />
                    <div>
                        <div className="font-semibold text-sm">ElevenLabs</div>
                        <div className="text-[10px] opacity-60">High Quality Audio</div>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveProvider('murf')}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${activeProvider === 'murf' ? 'bg-[#252525] border border-[#00E5E5] text-white' : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'}`}
                >
                    <Bot size={16} className={activeProvider === 'murf' ? 'text-purple-400' : ''} />
                    <div>
                        <div className="font-semibold text-sm">Murf.ai</div>
                        <div className="text-[10px] opacity-60">Studio Voices</div>
                    </div>
                </button>
            </div>
        </div>

        {/* RIGHT CONTENT: Config */}
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#333] bg-[#1a1a1a]">
                <div className="text-sm text-gray-400">
                    Configure <span className="text-white font-bold uppercase">{activeProvider}</span> Parameters
                </div>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* API Key Input */}
                <div className="bg-[#252525] p-4 rounded-lg border border-[#333] space-y-2">
                    <label className="text-sm text-gray-300 font-medium flex items-center gap-2">
                    <KeyRound size={14} className="text-[#00E5E5]" />
                    {activeProvider === 'gemini' ? 'Gemini' : activeProvider === 'murf' ? 'Murf' : 'ElevenLabs'} API Key
                    </label>
                    <input
                        type="password"
                        value={getCurrentKey()}
                        onChange={(e) => saveKey(e.target.value, activeProvider)}
                        placeholder={`Paste your ${activeProvider} API Key here...`}
                        className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-[#00E5E5] text-sm font-mono"
                    />
                    <p className="text-[10px] text-gray-500">
                    This key is required to authenticate with the {activeProvider} service.
                    </p>
                </div>

                {/* Voice Selection */}
                <div>
                    <label className="text-sm text-gray-400 font-medium mb-3 block">Select Voice Artist</label>
                    <div className="grid grid-cols-2 gap-3">
                        {getCurrentVoices().map((voice) => (
                            <button
                                key={voice.id}
                                onClick={() => setSelectedVoice(voice.id)}
                                className={`p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                                    selectedVoice === voice.id 
                                    ? 'bg-[#00E5E5]/10 border-[#00E5E5] text-white' 
                                    : 'bg-[#252525] border-[#333] text-gray-400 hover:bg-[#333]'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedVoice === voice.id ? 'bg-[#00E5E5] text-black' : 'bg-[#444]'}`}>
                                    {voice.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-xs font-bold truncate">{voice.name.split('(')[0]}</div>
                                    <div className="text-[10px] text-gray-500 truncate">{voice.name.split('(')[1]?.replace(')', '')}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Script Input */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-400 font-medium">Script</label>
                        <span className={`text-xs ${text.length > 30000 ? 'text-red-500' : 'text-gray-500'}`}>
                            {text.length} / 30000 chars
                        </span>
                    </div>
                    <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type or paste your script here..."
                    className="w-full h-40 bg-[#111] border border-[#333] rounded-lg p-4 text-gray-300 focus:outline-none focus:border-[#00E5E5] transition-colors resize-none font-sans text-sm custom-scrollbar leading-relaxed"
                    spellCheck={false}
                    />
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded text-sm flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#333] bg-[#222] flex justify-between items-center">
                <div className="text-xs text-gray-500">
                    Generating using <span className="text-[#00E5E5] uppercase font-bold">{activeProvider}</span> API
                </div>
                <button
                onClick={handleGenerate}
                disabled={loading || !text.trim() || !getCurrentKey().trim()}
                className="bg-gradient-to-r from-[#00E5E5] to-blue-600 hover:from-[#00c4c4] hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-black px-8 py-2.5 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                Generate Audio
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
