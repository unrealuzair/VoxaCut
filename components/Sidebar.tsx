
import React, { useRef, useState, useEffect } from 'react';
import { Search, Type, Music, ArrowDownToLine, Image as ImageIcon, ArrowLeft, Loader2, Plus, Settings, KeyRound, Bot, Send, Mic2, Zap, MessageSquare, ChevronDown, ChevronRight, FileText, Languages, Upload } from 'lucide-react';
import { searchPexelsVideos } from '../services/pexelsService';
import { sendChatMessage } from '../services/chatService';
import { PexelsVideo, ChatMessage, TextData } from '../types';
import { 
    PEXELS_API_KEY_STORAGE, 
    GEMINI_API_KEY_STORAGE, 
    CHAT_PROVIDERS,
    TEXT_EFFECTS,
    TEXT_TEMPLATES
} from '../constants';

interface SidebarProps {
  onOpenTTS: () => void;
  onOpenImageGen: () => void;
  onImportFiles: (files: FileList) => void;
  onAddPexelsVideo: (video: PexelsVideo) => void;
  onAddText: (textData: TextData) => void;
  onImportSRT: (file: File) => void;
}

// Helper Component for Accordion Sections
const AccordionSection = ({ title, children, isOpen, onToggle, icon }: any) => (
    <div className="border-b border-[#2a2a2a]">
        <button 
            onClick={onToggle}
            className="w-full flex items-center justify-between p-3 text-xs font-medium text-gray-300 hover:bg-[#222] transition-colors"
        >
            <div className="flex items-center gap-2">
                {icon && <span className="text-gray-500">{icon}</span>}
                {title}
            </div>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen && <div className="p-3 animate-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ onOpenTTS, onOpenImageGen, onImportFiles, onAddPexelsVideo, onAddText, onImportSRT }) => {
  const [activeTab, setActiveTab] = useState('Media');
  
  // Stock State
  const [activeProvider, setActiveProvider] = useState<'none' | 'pexels'>('none');
  
  // Pexels State
  const [pexelsKey, setPexelsKey] = useState('');
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<PexelsVideo[]>([]);
  const [loadingPexels, setLoadingPexels] = useState(false);
  const [showPexelsSettings, setShowPexelsSettings] = useState(false);

  // Text Tab State
  const [openTextSections, setOpenTextSections] = useState<Record<string, boolean>>({
      'add': true,
      'effects': false,
      'templates': false,
      'captions': false,
      'local': false
  });

  // Chatbot State
  const [activeChatProviderId, setActiveChatProviderId] = useState('gemini');
  const [chatApiKeys, setChatApiKeys] = useState<Record<string, string>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);

  // Load keys on mount
  useEffect(() => {
      const pKey = localStorage.getItem(PEXELS_API_KEY_STORAGE);
      if (pKey) setPexelsKey(pKey);

      // Load all chat keys
      const keys: Record<string, string> = {};
      CHAT_PROVIDERS.forEach(p => {
          const k = localStorage.getItem(p.storageKey);
          if (k) keys[p.id] = k;
      });
      setChatApiKeys(keys);
  }, []);

  const saveKey = (key: string) => {
      setPexelsKey(key);
      localStorage.setItem(PEXELS_API_KEY_STORAGE, key);
  };

  const saveChatKey = (key: string, providerId: string) => {
      const provider = CHAT_PROVIDERS.find(p => p.id === providerId);
      if (provider) {
          setChatApiKeys(prev => ({ ...prev, [providerId]: key }));
          localStorage.setItem(provider.storageKey, key);
      }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onImportFiles(e.target.files);
    }
  };

  const handleSRTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          onImportSRT(e.target.files[0]);
      }
  };

  const handlePexelsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pexelsQuery.trim()) return;
    if (!pexelsKey.trim()) {
        setShowPexelsSettings(true);
        return;
    }
    
    setLoadingPexels(true);
    try {
        const data = await searchPexelsVideos(pexelsQuery, pexelsKey);
        setPexelsResults(data.videos);
    } catch (error) {
        console.error("Pexels search failed", error);
        alert("Pexels search failed. Check your API Key.");
    } finally {
        setLoadingPexels(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      const currentKey = chatApiKeys[activeChatProviderId];
      if (!chatInput.trim() || !currentKey) return;

      const userMsg: ChatMessage = { role: 'user', text: chatInput };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatLoading(true);

      try {
          const responseText = await sendChatMessage(activeChatProviderId, chatHistory, userMsg.text, currentKey);
          const botMsg: ChatMessage = { role: 'model', text: responseText };
          setChatHistory(prev => [...prev, botMsg]);
      } catch (error: any) {
          const errorMsg: ChatMessage = { role: 'model', text: `Error: ${error.message}` };
          setChatHistory(prev => [...prev, errorMsg]);
      } finally {
          setIsChatLoading(false);
      }
  };

  useEffect(() => {
      if (activeTab === 'Chatbot') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatHistory, activeTab]);

  const toggleTextSection = (section: string) => {
      setOpenTextSections(prev => ({
          ...prev,
          [section]: !prev[section]
      }));
  };

  const navItems = [
    { id: 'Media', icon: <ArrowDownToLine size={20} />, label: 'Import' },
    { id: 'Audio', icon: <Music size={20} />, label: 'Audio' },
    { id: 'Text', icon: <Type size={20} />, label: 'Text' },
    { id: 'Chatbot', icon: <MessageSquare size={20} />, label: 'AI Chat' },
  ];

  const currentChatProvider = CHAT_PROVIDERS.find(p => p.id === activeChatProviderId);

  return (
    <div className="flex h-full border-r border-[#2a2a2a]">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="video/*,audio/*,image/*" 
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={srtInputRef}
        className="hidden"
        accept=".srt,.vtt,.ass,.lrc"
        onChange={handleSRTChange}
      />

      {/* 1. Navigation Strip (Far Left) */}
      <div className="w-16 bg-[#171717] flex flex-col items-center py-2 space-y-1 z-20 shrink-0">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'Media') setActiveProvider('none');
            }}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors ${
                activeTab === item.id ? 'text-[#00E5E5] bg-[#252525]' : 'text-gray-400 hover:text-white hover:bg-[#252525]'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 2. Drawer Panel (Inner Left) */}
      <div className="w-64 bg-[#171717] flex flex-col border-l border-[#2a2a2a]">
        
        {/* Header inside drawer */}
        <div className="h-10 flex items-center px-4 border-b border-[#2a2a2a] justify-between">
             <span className="text-white font-semibold text-sm truncate">
                 {activeTab === 'Media' && activeProvider === 'pexels' ? 'Pexels Stock' : 
                  activeTab === 'Chatbot' ? 'AI Assistant' : activeTab}
             </span>
             {activeTab === 'Media' && activeProvider !== 'none' && (
                 <button onClick={() => setActiveProvider('none')} className="text-gray-400 hover:text-white">
                     <ArrowLeft size={16} />
                 </button>
             )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
             {activeTab === 'Media' && (
                 <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                    {activeProvider === 'none' ? (
                        <div className="space-y-4">
                            {/* Import Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-gray-400 text-xs">
                                    <span>Local</span>
                                </div>
                                <button onClick={handleImportClick} className="w-full py-6 border border-dashed border-[#333] rounded hover:bg-[#252525] transition flex flex-col items-center justify-center text-gray-500 gap-2">
                                    <span className="text-2xl font-light">+</span>
                                    <span className="text-xs">Import</span>
                                </button>
                            </div>

                            {/* AI Generation Section */}
                            <div className="space-y-2 pt-4 border-t border-[#2a2a2a]">
                                <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                                    <span>AI Generation</span>
                                </div>
                                <button onClick={onOpenImageGen} className="w-full bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/20 p-3 rounded-lg text-left hover:border-pink-500 transition group">
                                <div className="flex items-center gap-2 text-pink-400 mb-1">
                                    <ImageIcon size={14} />
                                    <span className="text-xs font-bold">AI Image Generator</span>
                                </div>
                                <p className="text-[10px] text-gray-400 group-hover:text-gray-200">
                                    Create visual assets using Gemini.
                                </p>
                                </button>
                            </div>

                            {/* Stock Section */}
                            <div className="space-y-2 pt-4 border-t border-[#2a2a2a]">
                                <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                                    <span>Stock Materials</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {/* PEXELS BUTTON */}
                                    <button onClick={() => setActiveProvider('pexels')} className="bg-[#252525] aspect-square rounded flex flex-col items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] transition gap-2 border border-transparent hover:border-green-500/50">
                                        <Search size={20} className="text-green-500" />
                                        <span className="text-xs font-semibold">Pexels</span>
                                        <span className="text-[9px] text-gray-600">Video & Photo</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // PEXELS VIEW
                        <div className="h-full flex flex-col">
                            <div className="flex gap-2 mb-4 relative">
                                <input 
                                    type="text" 
                                    value={pexelsQuery}
                                    onChange={(e) => setPexelsQuery(e.target.value)}
                                    placeholder="Search Pexels..."
                                    className="flex-1 bg-[#222] border border-[#333] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5E5]"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPexelsSettings(!showPexelsSettings)}
                                    className={`p-2 rounded hover:bg-[#333] ${!pexelsKey ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}
                                >
                                    <Settings size={14} />
                                </button>
                                <button onClick={handlePexelsSearch} className="bg-[#252525] p-2 rounded hover:bg-[#333] text-gray-400 hover:text-white">
                                    <Search size={14} />
                                </button>
                            </div>

                            {showPexelsSettings && (
                                <div className="mb-4 bg-[#252525] p-3 rounded border border-[#333]">
                                    <label className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mb-2">
                                        <KeyRound size={10} /> Pexels API Key
                                    </label>
                                    <input 
                                        type="password" 
                                        value={pexelsKey}
                                        onChange={(e) => saveKey(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs mb-1"
                                        placeholder="Paste key..."
                                    />
                                    <div className="text-[9px] text-gray-500 text-right">Auto-saved</div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                                {loadingPexels ? (
                                    <div className="flex items-center justify-center h-20 text-[#00E5E5]">
                                        <Loader2 className="animate-spin" size={20} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {pexelsResults.map(video => (
                                            <div 
                                                key={video.id} 
                                                className="group relative aspect-[9/16] bg-black rounded overflow-hidden cursor-pointer border border-[#333] hover:border-[#00E5E5]"
                                                onClick={() => onAddPexelsVideo(video)}
                                            >
                                                <img src={video.image} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute bottom-1 right-1 text-[9px] bg-black/60 px-1 rounded text-white">
                                                    {video.duration}s
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                    <Plus size={24} className="text-white drop-shadow-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                 </div>
             )}

             {activeTab === 'Audio' && (
                <div className="p-3 space-y-4">
                    <div className="text-xs text-gray-400 mb-2">Voiceover</div>
                    <button onClick={onOpenTTS} className="w-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 p-3 rounded-lg text-left hover:border-[#00E5E5] transition group">
                       <div className="flex items-center gap-2 text-[#00E5E5] mb-1">
                           <Mic2 size={14} />
                           <span className="text-xs font-bold">AI Text-to-Speech</span>
                       </div>
                       <p className="text-[10px] text-gray-400 group-hover:text-gray-200">
                           ElevenLabs, Murf, and Gemini.
                       </p>
                    </button>
                    
                    <div className="pt-4 border-t border-[#2a2a2a]">
                       <div className="text-xs text-gray-400 mb-2">Music</div>
                        <div className="text-center text-gray-600 text-xs py-4">
                           Stock music coming soon.
                        </div>
                    </div>
                </div>
             )}

             {activeTab === 'Chatbot' && (
                 <div className="flex flex-col h-full">
                     {/* Model Selector */}
                     <div className="p-3 bg-[#222] border-b border-[#333] space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-gray-400 font-bold block">AI Model</label>
                            <div className="relative">
                                <select 
                                    value={activeChatProviderId} 
                                    onChange={(e) => setActiveChatProviderId(e.target.value)}
                                    className="w-full bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5E5] appearance-none cursor-pointer"
                                >
                                    {CHAT_PROVIDERS.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.providerName})</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                    <Zap size={10} />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Key Input */}
                        <div className="space-y-1 animate-in fade-in duration-300">
                             <label className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                <KeyRound size={10} /> {currentChatProvider?.providerName} API Key
                            </label>
                            <input 
                                type="password" 
                                value={chatApiKeys[activeChatProviderId] || ''}
                                onChange={(e) => saveChatKey(e.target.value, activeChatProviderId)}
                                className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-xs text-gray-300 focus:border-[#00E5E5] focus:outline-none font-mono"
                                placeholder={`Enter ${currentChatProvider?.providerName} Key...`}
                            />
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-[#171717]">
                         {chatHistory.length === 0 && (
                             <div className="text-center text-gray-600 text-xs mt-10 px-4">
                                 <Bot size={32} className="mx-auto mb-2 opacity-20" />
                                 <p>Chatting with <span className="text-[#00E5E5]">{currentChatProvider?.name}</span></p>
                                 <p className="mt-1">Ask about video editing, script ideas, or technical help.</p>
                             </div>
                         )}
                         {chatHistory.map((msg, idx) => (
                             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] p-2 rounded-lg text-xs ${msg.role === 'user' ? 'bg-[#00E5E5]/20 text-[#00E5E5] border border-[#00E5E5]/30' : 'bg-[#252525] text-gray-300 border border-[#333]'}`}>
                                     {msg.text}
                                 </div>
                             </div>
                         ))}
                         {isChatLoading && (
                             <div className="flex justify-start">
                                 <div className="bg-[#252525] p-2 rounded-lg border border-[#333]">
                                    <Loader2 size={14} className="animate-spin text-gray-500" />
                                 </div>
                             </div>
                         )}
                         <div ref={chatEndRef}></div>
                     </div>

                     <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2a2a2a] bg-[#222] flex gap-2">
                         <input 
                             type="text" 
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             placeholder={`Ask ${currentChatProvider?.name}...`}
                             className="flex-1 bg-[#111] border border-[#333] rounded px-3 py-1.5 text-xs text-white focus:border-[#00E5E5] focus:outline-none"
                         />
                         <button 
                            type="submit" 
                            disabled={isChatLoading || !chatInput.trim()}
                            className="bg-[#00E5E5] text-black p-1.5 rounded hover:bg-[#00c4c4] disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             <Send size={14} />
                         </button>
                     </form>
                 </div>
             )}

             {activeTab === 'Text' && (
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                     {/* 1. Add Text Section */}
                     <AccordionSection 
                         title="Add text" 
                         isOpen={openTextSections['add']} 
                         onToggle={() => toggleTextSection('add')}
                         icon={<Plus size={14}/>}
                     >
                         <button 
                            onClick={() => onAddText({ content: "Default text", fontSize: 60, color: '#ffffff', fontFamily: 'sans-serif', isBold: true, isItalic: false })}
                            className="w-full bg-[#252525] hover:bg-[#333] p-4 rounded-lg border border-[#333] flex flex-col items-center gap-2 transition-all"
                         >
                             <div className="text-lg font-bold text-white">Default text</div>
                             <Plus size={16} className="text-[#00E5E5]" />
                         </button>
                     </AccordionSection>

                     {/* 2. AI Packaging (Placeholder) */}
                     <AccordionSection 
                         title="AI packaging" 
                         isOpen={openTextSections['packaging']} 
                         onToggle={() => toggleTextSection('packaging')}
                         // Placeholder icon
                         icon={<div className="w-3.5 h-3.5 rounded-full bg-pink-500/20 border border-pink-500 flex items-center justify-center"><span className="text-[8px] text-pink-500 font-bold">AI</span></div>}
                     >
                         <div className="text-[10px] text-gray-500 text-center p-4 bg-[#252525]/50 rounded border border-dashed border-[#333]">
                             Auto-generate titles & descriptions from video content (Coming Soon).
                         </div>
                     </AccordionSection>

                     {/* 3. Effects */}
                     <AccordionSection 
                         title="Effects" 
                         isOpen={openTextSections['effects']} 
                         onToggle={() => toggleTextSection('effects')}
                         // Placeholder icon
                         icon={<div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center"><span className="text-[8px] text-purple-500 font-bold">Fx</span></div>}
                     >
                         <div className="grid grid-cols-2 gap-2">
                             {TEXT_EFFECTS.map(effect => (
                                 <button 
                                    key={effect.id}
                                    onClick={() => onAddText({ 
                                        content: "Art", 
                                        fontSize: 80, 
                                        color: effect.style.color, 
                                        fontFamily: 'Impact, sans-serif', 
                                        isBold: true, 
                                        isItalic: false,
                                        shadowColor: effect.style.shadowColor,
                                        shadowBlur: effect.style.shadowBlur,
                                        outlineColor: effect.style.outlineColor,
                                        outlineWidth: effect.style.outlineWidth,
                                        effectId: effect.id
                                    })}
                                    className="aspect-square bg-[#1a1a1a] border border-[#333] rounded hover:border-[#00E5E5] flex flex-col items-center justify-center gap-1 transition-colors group"
                                 >
                                     <span 
                                        className="text-xl font-bold" 
                                        style={{ 
                                            color: effect.style.color,
                                            textShadow: effect.style.shadowBlur ? `0 0 ${effect.style.shadowBlur}px ${effect.style.shadowColor}` : 'none',
                                            WebkitTextStroke: effect.style.outlineWidth ? `${effect.style.outlineWidth}px ${effect.style.outlineColor}` : '0px'
                                        }}
                                     >
                                        Art
                                     </span>
                                     <span className="text-[9px] text-gray-500 group-hover:text-white">{effect.name}</span>
                                 </button>
                             ))}
                         </div>
                     </AccordionSection>

                     {/* 4. Templates */}
                     <AccordionSection 
                         title="Text template" 
                         isOpen={openTextSections['templates']} 
                         onToggle={() => toggleTextSection('templates')}
                         icon={<FileText size={14} className="text-blue-500"/>}
                     >
                        <div className="grid grid-cols-2 gap-2">
                            {TEXT_TEMPLATES.map(tmpl => (
                                <button 
                                    key={tmpl.id}
                                    className="aspect-video bg-[#1a1a1a] border border-[#333] rounded hover:border-[#00E5E5] flex flex-col items-center justify-center text-gray-500 hover:text-white transition-all"
                                >
                                    <span className="text-[10px] font-bold">{tmpl.name}</span>
                                </button>
                            ))}
                        </div>
                     </AccordionSection>

                     {/* 5. Auto Captions */}
                     <AccordionSection 
                         title="Auto captions" 
                         isOpen={openTextSections['captions']} 
                         onToggle={() => toggleTextSection('captions')}
                         icon={<Bot size={14} className="text-green-500"/>}
                     >
                         <div className="space-y-3">
                             <div>
                                 <label className="text-[10px] text-gray-400 mb-1 block">Spoken language</label>
                                 <select className="w-full bg-[#111] border border-[#333] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00E5E5]">
                                     <option>English</option>
                                     <option>Spanish</option>
                                     <option>French</option>
                                     <option>Japanese</option>
                                 </select>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <input type="checkbox" className="accent-[#00E5E5]" />
                                <span className="text-xs text-gray-300">Bilingual captions <span className="text-[9px] bg-[#00E5E5] text-black px-1 rounded font-bold">PRO</span></span>
                             </div>

                             <div className="flex items-center gap-2">
                                <input type="checkbox" className="accent-[#00E5E5]" />
                                <span className="text-xs text-gray-300">Identify filler words</span>
                             </div>

                             <button className="w-full bg-[#00E5E5] text-black font-bold py-2 rounded hover:bg-[#00c4c4] transition text-xs mt-2">
                                 Generate
                             </button>
                         </div>
                     </AccordionSection>

                     {/* 6. Local Captions */}
                     <AccordionSection 
                         title="Local captions" 
                         isOpen={openTextSections['local']} 
                         onToggle={() => toggleTextSection('local')}
                         icon={<Languages size={14} />}
                     >
                         <div className="space-y-3">
                             <button 
                                onClick={() => srtInputRef.current?.click()}
                                className="w-full border border-dashed border-[#333] bg-[#252525]/50 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:text-[#00E5E5] hover:border-[#00E5E5] hover:bg-[#252525] transition group"
                             >
                                 <Upload size={24} className="mb-2" />
                                 <span className="text-xs font-bold text-white group-hover:text-[#00E5E5]">+ Import file</span>
                                 <span className="text-[9px] mt-1">Supported: SRT, LRC, ASS</span>
                             </button>
                         </div>
                     </AccordionSection>

                 </div>
             )}
        </div>
      </div>
    </div>
  );
};
