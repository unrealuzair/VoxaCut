
import React, { useState } from 'react';
import { Clip, TextData } from '../types';
import { RefreshCcw, Volume2, Sun, Contrast, Eye, MonitorPlay, Layers, Type, Bold, Italic } from 'lucide-react';

interface PropertiesPanelProps {
    selectedClip: Clip | null;
    selectionCount: number;
    onUpdateClip: (id: string, updates: Partial<Clip>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedClip, selectionCount, onUpdateClip }) => {
    const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'adjust' | 'text'>('video');

    // Correct initial tab if text selected
    React.useEffect(() => {
        if (selectedClip?.type === 'text' && activeTab !== 'text') setActiveTab('text');
        else if (selectedClip?.type === 'video' && activeTab === 'text') setActiveTab('video');
    }, [selectedClip?.type]);

    if (!selectedClip) {
        return (
            <div className="w-[300px] shrink-0 bg-[#171717] border-l border-[#2a2a2a] flex flex-col items-center justify-center text-gray-600 gap-3 text-xs">
                <MonitorPlay size={32} className="opacity-20" />
                <span>Select a clip to edit properties</span>
            </div>
        );
    }

    const handleChangeStyle = (key: keyof Clip['style'], value: number | object) => {
        onUpdateClip(selectedClip.id, {
            style: { ...selectedClip.style, [key]: value }
        });
    };

    const handleChangeFilter = (key: keyof Clip['filter'], value: number) => {
        onUpdateClip(selectedClip.id, {
            filter: { ...selectedClip.filter, [key]: value }
        });
    };

    const handleChangeText = (key: keyof TextData, value: any) => {
        onUpdateClip(selectedClip.id, {
            textData: { ...selectedClip.textData!, [key]: value }
        });
    };

    const handlePositionChange = (axis: 'x' | 'y', val: string) => {
        const num = parseInt(val) || 0;
        onUpdateClip(selectedClip.id, {
            style: { 
                ...selectedClip.style, 
                position: { ...selectedClip.style.position, [axis]: num } 
            }
        });
    };

    const handleSpeedChange = (newSpeed: number) => {
        const oldSpeed = selectedClip.speed;
        if (newSpeed <= 0) return;
        
        const factor = oldSpeed / newSpeed;
        const newDuration = selectedClip.duration * factor;

        onUpdateClip(selectedClip.id, { 
            speed: newSpeed,
            duration: newDuration
        });
    };

    return (
        <div className="w-[320px] shrink-0 bg-[#171717] border-l border-[#2a2a2a] flex flex-col text-xs text-gray-300 select-none">
             
             {selectionCount > 1 && (
                 <div className="bg-[#00E5E5]/10 text-[#00E5E5] p-3 text-center border-b border-[#00E5E5]/20 flex items-center justify-center gap-2">
                     <Layers size={14} />
                     <span className="font-bold">{selectionCount} clips selected</span>
                 </div>
             )}

             {/* Tabs */}
             <div className="flex border-b border-[#2a2a2a]">
                 {selectedClip.type === 'video' && (
                    <>
                        <button 
                            onClick={() => setActiveTab('video')}
                            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'video' ? 'text-[#00E5E5] border-b-2 border-[#00E5E5]' : 'hover:bg-[#252525]'}`}
                        >
                            Video
                        </button>
                        <button 
                            onClick={() => setActiveTab('adjust')}
                            className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'adjust' ? 'text-[#00E5E5] border-b-2 border-[#00E5E5]' : 'hover:bg-[#252525]'}`}
                        >
                            Adjust
                        </button>
                    </>
                 )}
                 {selectedClip.type === 'text' && (
                     <button 
                        onClick={() => setActiveTab('text')}
                        className={`flex-1 py-3 font-medium transition-colors text-[#00E5E5] border-b-2 border-[#00E5E5]`}
                    >
                        Text
                    </button>
                 )}
                 {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
                     <button 
                        onClick={() => setActiveTab('audio')}
                        className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'audio' ? 'text-[#00E5E5] border-b-2 border-[#00E5E5]' : 'hover:bg-[#252525]'}`}
                     >
                        Audio
                     </button>
                 )}
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                
                {/* VIDEO TAB */}
                {activeTab === 'video' && selectedClip.type === 'video' && (
                    <div className="space-y-6">
                        {/* Transform Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                                <span>Transform</span>
                                <RefreshCcw 
                                    size={10} 
                                    className="cursor-pointer hover:text-white" 
                                    onClick={() => onUpdateClip(selectedClip.id, { style: { scale: 100, position: {x:0, y:0}, rotation: 0, opacity: 1 } })} 
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-400">Scale</label>
                                    <span className="text-[#00E5E5]">{selectedClip.style.scale}%</span>
                                </div>
                                <input 
                                    type="range" min="10" max="200" 
                                    value={selectedClip.style.scale}
                                    onChange={(e) => handleChangeStyle('scale', parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-gray-400">Position</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 flex items-center bg-[#252525] border border-[#333] rounded px-2 py-1 focus-within:border-[#00E5E5]">
                                        <span className="text-gray-500 mr-2 text-[10px]">X</span>
                                        <input 
                                            type="number" 
                                            value={selectedClip.style.position.x}
                                            onChange={(e) => handlePositionChange('x', e.target.value)}
                                            className="bg-transparent w-full focus:outline-none text-right" 
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center bg-[#252525] border border-[#333] rounded px-2 py-1 focus-within:border-[#00E5E5]">
                                        <span className="text-gray-500 mr-2 text-[10px]">Y</span>
                                        <input 
                                            type="number" 
                                            value={selectedClip.style.position.y}
                                            onChange={(e) => handlePositionChange('y', e.target.value)}
                                            className="bg-transparent w-full focus:outline-none text-right" 
                                        />
                                    </div>
                                </div>
                            </div>

                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-gray-400">Rotation</label>
                                    <span className="text-gray-500">{selectedClip.style.rotation}°</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center text-[8px]">R</div>
                                    <input 
                                        type="range" min="-180" max="180" 
                                        value={selectedClip.style.rotation}
                                        onChange={(e) => handleChangeStyle('rotation', parseInt(e.target.value))}
                                        className="flex-1 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Opacity Section */}
                        <div className="space-y-3 pt-6 border-t border-[#2a2a2a]">
                             <div className="flex items-center gap-2 mb-2">
                                <Eye size={14} className="text-[#00E5E5]" />
                                <span className="font-semibold text-gray-300">Opacity</span>
                            </div>
                             <input 
                                type="range" min="0" max="1" step="0.01"
                                value={selectedClip.style.opacity}
                                onChange={(e) => handleChangeStyle('opacity', parseFloat(e.target.value))}
                                className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                             />
                        </div>
                    </div>
                )}
                
                {/* TEXT TAB */}
                {activeTab === 'text' && selectedClip.type === 'text' && selectedClip.textData && (
                    <div className="space-y-6">
                         <div className="space-y-3">
                             <label className="text-gray-400 font-bold">Text Content</label>
                             <textarea 
                                value={selectedClip.textData.content}
                                onChange={(e) => handleChangeText('content', e.target.value)}
                                className="w-full bg-[#252525] border border-[#333] rounded p-3 text-white focus:border-[#00E5E5] focus:outline-none resize-none h-24"
                             />
                         </div>

                         <div className="space-y-3">
                            <label className="text-gray-400 font-bold">Style</label>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleChangeText('isBold', !selectedClip.textData?.isBold)}
                                    className={`p-2 rounded border ${selectedClip.textData.isBold ? 'bg-[#00E5E5] text-black border-[#00E5E5]' : 'bg-[#252525] border-[#333] hover:bg-[#333]'}`}
                                >
                                    <Bold size={14} />
                                </button>
                                <button 
                                    onClick={() => handleChangeText('isItalic', !selectedClip.textData?.isItalic)}
                                    className={`p-2 rounded border ${selectedClip.textData.isItalic ? 'bg-[#00E5E5] text-black border-[#00E5E5]' : 'bg-[#252525] border-[#333] hover:bg-[#333]'}`}
                                >
                                    <Italic size={14} />
                                </button>
                                <input 
                                    type="color" 
                                    value={selectedClip.textData.color}
                                    onChange={(e) => handleChangeText('color', e.target.value)}
                                    className="h-8 w-8 rounded bg-transparent cursor-pointer border-0"
                                />
                            </div>
                         </div>

                         <div className="space-y-3">
                             <div className="flex justify-between">
                                 <label className="text-gray-400">Font Size</label>
                                 <span className="text-[#00E5E5]">{selectedClip.textData.fontSize}</span>
                             </div>
                             <input 
                                type="range" min="12" max="200" 
                                value={selectedClip.textData.fontSize}
                                onChange={(e) => handleChangeText('fontSize', parseInt(e.target.value))}
                                className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                             />
                         </div>
                         
                         {/* Position Controls Reuse */}
                         <div className="space-y-3 pt-4 border-t border-[#2a2a2a]">
                            <label className="block text-gray-400">Position</label>
                            <div className="flex gap-3">
                                <div className="flex-1 flex items-center bg-[#252525] border border-[#333] rounded px-2 py-1 focus-within:border-[#00E5E5]">
                                    <span className="text-gray-500 mr-2 text-[10px]">X</span>
                                    <input 
                                        type="number" 
                                        value={selectedClip.style.position.x}
                                        onChange={(e) => handlePositionChange('x', e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-right" 
                                    />
                                </div>
                                <div className="flex-1 flex items-center bg-[#252525] border border-[#333] rounded px-2 py-1 focus-within:border-[#00E5E5]">
                                    <span className="text-gray-500 mr-2 text-[10px]">Y</span>
                                    <input 
                                        type="number" 
                                        value={selectedClip.style.position.y}
                                        onChange={(e) => handlePositionChange('y', e.target.value)}
                                        className="bg-transparent w-full focus:outline-none text-right" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ADJUST TAB */}
                {activeTab === 'adjust' && selectedClip.type === 'video' && (
                    <div className="space-y-6">
                         <div className="flex items-center justify-between text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                            <span>Basic Adjustments</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="flex items-center gap-2 text-gray-400"><Sun size={12}/> Brightness</span>
                                    <span>{selectedClip.filter.brightness - 100}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="200" 
                                    value={selectedClip.filter.brightness}
                                    onChange={(e) => handleChangeFilter('brightness', parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="flex items-center gap-2 text-gray-400"><Contrast size={12}/> Contrast</span>
                                    <span>{selectedClip.filter.contrast - 100}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="200" 
                                    value={selectedClip.filter.contrast}
                                    onChange={(e) => handleChangeFilter('contrast', parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="flex items-center gap-2 text-gray-400">Saturation</span>
                                    <span>{selectedClip.filter.saturation - 100}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="200" 
                                    value={selectedClip.filter.saturation}
                                    onChange={(e) => handleChangeFilter('saturation', parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                />
                            </div>
                             <div>
                                <div className="flex justify-between mb-2">
                                    <span className="flex items-center gap-2 text-gray-400">Grayscale</span>
                                    <span>{selectedClip.filter.grayscale}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={selectedClip.filter.grayscale}
                                    onChange={(e) => handleChangeFilter('grayscale', parseInt(e.target.value))}
                                    className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* AUDIO TAB */}
                {activeTab === 'audio' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                            <span>Volume Control</span>
                        </div>
                        
                        <div className="bg-[#252525] p-4 rounded-lg border border-[#333]">
                            <div className="flex items-center gap-3 mb-4">
                                <Volume2 size={16} className={selectedClip.volume === 0 ? "text-red-500" : "text-[#00E5E5]"} />
                                <span className="text-sm font-medium">{selectedClip.volume}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="100"
                                value={selectedClip.volume}
                                onChange={(e) => onUpdateClip(selectedClip.id, { volume: parseInt(e.target.value) })}
                                className="w-full h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#00E5E5]" 
                            />
                        </div>

                        {selectedClip.type === 'audio' && selectedClip.voiceName && (
                             <div className="bg-[#252525] p-4 rounded-lg border border-[#333] space-y-2">
                                <span className="text-xs text-gray-400">AI Voice</span>
                                <div className="text-[#00E5E5] font-semibold">{selectedClip.voiceName}</div>
                             </div>
                        )}

                        <div className="space-y-2">
                            <span className="text-gray-400">Speed</span>
                            <div className="flex items-center gap-2">
                                {[0.5, 1, 1.5, 2].map(speed => (
                                    <button 
                                        key={speed}
                                        onClick={() => handleSpeedChange(speed)}
                                        className={`flex-1 py-1 rounded border border-[#333] ${selectedClip.speed === speed ? 'bg-[#00E5E5] text-black border-[#00E5E5]' : 'hover:bg-[#333]'}`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Footer Info */}
             <div className="p-4 border-t border-[#2a2a2a] bg-[#171717]">
                <div className="text-[10px] text-gray-500 space-y-2">
                    <p className="flex justify-between"><span>ID:</span> <span className="font-mono text-gray-400">{selectedClip.id}</span></p>
                    <p className="flex justify-between"><span>File:</span> <span className="text-gray-300 truncate max-w-[150px]">{selectedClip.name}</span></p>
                    
                    <div className="flex justify-between items-center">
                        <span>Duration (s):</span>
                         <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={parseFloat(selectedClip.duration.toFixed(2))}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                    onUpdateClip(selectedClip.id, { duration: val });
                                }
                            }}
                            className="w-20 bg-[#252525] border border-[#333] rounded px-2 py-1 text-right focus:border-[#00E5E5] focus:outline-none text-gray-300 font-mono"
                        />
                    </div>
                </div>
             </div>
        </div>
    );
};
