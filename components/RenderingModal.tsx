
import React from 'react';
import { Loader2, FileJson } from 'lucide-react';

interface RenderingModalProps {
    isOpen: boolean;
    progress: number;
}

export const RenderingModal: React.FC<RenderingModalProps> = ({ isOpen, progress }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-80 bg-[#1a1a1a] p-8 rounded-xl border border-[#333] flex flex-col items-center text-center shadow-2xl">
                 <div className="w-16 h-16 bg-[#00E5E5]/10 rounded-full flex items-center justify-center mb-6 text-[#00E5E5]">
                    <FileJson size={32} />
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-2">Exporting Project</h3>
                 <p className="text-gray-400 text-sm mb-6">Packaging timeline assets and metadata...</p>
                 
                 <div className="w-full h-2 bg-[#333] rounded-full overflow-hidden mb-3">
                     <div 
                        className="h-full bg-gradient-to-r from-[#00E5E5] to-blue-500 transition-all duration-300 ease-out" 
                        style={{width: `${progress}%`}}
                     ></div>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                     {progress < 100 ? (
                         <>
                            <Loader2 className="animate-spin" size={12} />
                            PROCESSING... {progress}%
                         </>
                     ) : (
                         <span className="text-[#00E5E5]">COMPLETE</span>
                     )}
                 </div>
            </div>
        </div>
    );
};
