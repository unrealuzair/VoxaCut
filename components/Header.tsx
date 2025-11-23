
import React from 'react';
import { MonitorUp, Save, CheckCircle2, Loader2 } from 'lucide-react';

interface HeaderProps {
  onExport: () => void;
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onSave, isSaving, lastSaved }) => {
  return (
    <div className="h-12 bg-[#171717] flex items-center justify-between px-4 border-b border-[#2a2a2a] select-none shrink-0">
      
      {/* Left: Branding */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-white font-bold">
          <div className="w-6 h-6 bg-gradient-to-br from-[#00E5E5] to-blue-600 rounded-md flex items-center justify-center text-[10px]">VC</div>
          <div className="flex flex-col leading-none justify-center">
             <span>VoxaCut</span>
             <span className="text-[9px] text-gray-500 font-normal tracking-wide">Built by Ujelo</span>
          </div>
        </div>
      </div>

      {/* Center: Project Name & Save Status */}
      <div className="flex items-center gap-4">
        <span className="text-gray-300 text-xs hover:bg-[#252525] px-2 py-1 rounded cursor-text">Project 1122</span>
        
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          title="Save Project to Browser Storage"
        >
          {isSaving ? (
             <>
               <Loader2 size={10} className="animate-spin" />
               <span>Saving...</span>
             </>
          ) : lastSaved ? (
             <>
                <CheckCircle2 size={10} className="text-green-500" />
                <span>Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             </>
          ) : (
             <>
                <Save size={10} />
                <span>Save</span>
             </>
          )}
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button 
            onClick={onExport}
            className="bg-[#00E5E5] text-black px-4 py-1 rounded text-xs font-bold hover:bg-[#00c4c4] transition-colors flex items-center gap-1"
        >
            <MonitorUp size={12} />
            Export
        </button>
        
        <div className="flex gap-2 ml-2">
            <div className="w-3 h-3 rounded-full bg-gray-600 hover:bg-gray-500"></div>
            <div className="w-3 h-3 rounded-full border border-gray-600 hover:border-gray-400"></div>
            <div className="w-3 h-3 rounded-full border border-gray-600 hover:border-gray-400"></div>
        </div>
      </div>
    </div>
  );
};
