
import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Wand2, Upload, Trash2, CheckCircle2, Plus, KeyRound } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import { ReferenceImage } from '../types';
import { GEMINI_API_KEY_STORAGE } from '../constants';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (blob: Blob, prompt: string) => void;
}

export const ImageGenModal: React.FC<ImageGenModalProps> = ({ isOpen, onClose, onAddImage }) => {
  // Batch State
  const [promptsInput, setPromptsInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  // Settings State
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("16:9");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadType, setActiveUploadType] = useState<'subject' | 'scene' | 'style'>('subject');

  // Load API Key
  useEffect(() => {
    const savedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem(GEMINI_API_KEY_STORAGE, val);
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          
          const newRef: ReferenceImage = {
              id: Math.random().toString(36).substr(2, 9),
              type: activeUploadType,
              data: base64,
              mimeType: file.type,
              preview: result
          };

          setReferenceImages(prev => [...prev, newRef]);
      };
      reader.readAsDataURL(file);
  };

  const triggerUpload = (type: 'subject' | 'scene' | 'style') => {
      setActiveUploadType(type);
      fileInputRef.current?.click();
  };

  const removeReference = (id: string) => {
      setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const handleBatchGenerate = async () => {
    if (!apiKey.trim()) {
        setLogs(prev => [`❌ Error: API Key is missing`, ...prev]);
        return;
    }
    
    const prompts = promptsInput.split('\n').filter(p => p.trim().length > 0);
    if (prompts.length === 0) return;

    setIsProcessing(true);
    setTotalPrompts(prompts.length);
    setLogs([]);
    setCurrentPromptIndex(0);

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        setCurrentPromptIndex(i + 1);
        
        try {
            setLogs(prev => [`Generating: "${prompt.substring(0, 20)}..."`, ...prev]);
            
            const blob = await generateImage(prompt, apiKey, {
                aspectRatio,
                referenceImages
            });
            
            onAddImage(blob, prompt);
            setLogs(prev => [`✅ Success: "${prompt.substring(0, 20)}..." added to timeline`, ...prev]);

        } catch (err) {
            console.error(err);
            setLogs(prev => [`❌ Failed: "${prompt.substring(0, 20)}..."`, ...prev]);
        }
        
        // Small delay to prevent immediate rate limiting/race conditions
        await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessing(false);
    setLogs(prev => [`🏁 Batch processing complete.`, ...prev]);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] w-full max-w-5xl h-[85vh] rounded-xl border border-[#333] shadow-2xl flex overflow-hidden">
        
        {/* LEFT: Settings Sidebar */}
        <div className="w-80 bg-[#171717] border-r border-[#333] flex flex-col p-5 overflow-y-auto custom-scrollbar shrink-0">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Wand2 className="text-pink-500" size={20} />
                Config
            </h3>

            {/* API Key */}
            <div className="mb-8">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <KeyRound size={12} /> Gemini API Key
                </label>
                <input
                    type="password"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    placeholder="Paste Gemini API Key"
                    className="w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-gray-600 mt-1">Saved locally.</p>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-8">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 block">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                    {["1:1", "16:9", "9:16", "4:3", "3:4"].map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio as any)}
                            className={`px-2 py-2 rounded text-xs font-medium border transition-colors ${
                                aspectRatio === ratio 
                                ? 'bg-pink-900/30 border-pink-500 text-white' 
                                : 'bg-[#252525] border-[#333] text-gray-400 hover:bg-[#333]'
                            }`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reference Images */}
            <div className="mb-6">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 block">Reference Images</label>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                
                <div className="space-y-3">
                    {['subject', 'scene', 'style'].map((type) => (
                        <div key={type} className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500 capitalize">
                                <span>{type} Ref</span>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                                {referenceImages.filter(img => img.type === type).map(img => (
                                    <div key={img.id} className="w-16 h-16 relative group rounded overflow-hidden border border-gray-600">
                                        <img src={img.preview} className="w-full h-full object-cover" alt="ref" />
                                        <button 
                                            onClick={() => removeReference(img.id)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => triggerUpload(type as any)}
                                    className="w-16 h-16 rounded border border-dashed border-gray-600 hover:border-pink-500 hover:bg-pink-900/10 flex flex-col items-center justify-center text-gray-500 hover:text-pink-500 transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: Prompts & processing */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a]">
            <div className="flex justify-between items-center p-5 border-b border-[#333]">
                <h2 className="text-lg font-bold text-white">Prompt Queue</h2>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded-full transition">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-4 min-h-0">
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-sm text-gray-400 font-medium mb-2 block">
                        Enter Prompts (One per line)
                    </label>
                    <textarea 
                        value={promptsInput}
                        onChange={(e) => setPromptsInput(e.target.value)}
                        disabled={isProcessing}
                        placeholder="A cyberpunk city at night&#10;A dragon flying over a volcano&#10;A futuristic car race"
                        className="flex-1 bg-[#111] border border-[#333] rounded-xl p-4 text-gray-200 focus:outline-none focus:border-pink-500 resize-none font-sans text-sm leading-6 custom-scrollbar disabled:opacity-50"
                    />
                </div>

                {/* Processing Status Area */}
                {isProcessing && (
                    <div className="bg-[#252525] border border-[#333] rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <Loader2 className="animate-spin text-pink-500" size={16} />
                                Processing Batch
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                                {currentPromptIndex} / {totalPrompts}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#333] rounded-full overflow-hidden mb-3">
                            <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                                style={{width: `${(currentPromptIndex / totalPrompts) * 100}%`}}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400 font-mono h-20 overflow-y-auto custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 border-t border-[#333] bg-[#222] flex justify-end items-center gap-4">
                 <div className="text-xs text-gray-500">
                    The generator will automatically add results to the timeline.
                 </div>
                 <button
                    onClick={handleBatchGenerate}
                    disabled={isProcessing || !promptsInput.trim() || !apiKey.trim()}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-pink-900/20"
                 >
                    {isProcessing ? 'Processing...' : `Generate Batch`}
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};
