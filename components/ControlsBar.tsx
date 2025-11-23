import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export const ControlsBar: React.FC = () => {
  return (
    <div className="w-full h-full bg-neutral-900 border-t border-b border-neutral-800 flex items-center px-4 justify-between">
      
      {/* Left: Timecode */}
      <div className="text-red-500 font-mono text-lg font-bold w-32">
        00:00:00:00
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center space-x-6 text-neutral-300">
        <button className="hover:text-white transition"><SkipBack size={20} /></button>
        <button className="bg-white text-black p-2 rounded-full hover:bg-neutral-200 transition shadow-lg shadow-red-900/20">
          <Play size={24} fill="currentColor" />
        </button>
        <button className="hover:text-white transition"><SkipForward size={20} /></button>
      </div>

      {/* Right: Tools / Zoom */}
      <div className="w-32 flex justify-end space-x-4 text-neutral-400">
        <Volume2 size={20} />
        <div className="w-24 bg-neutral-700 h-1.5 self-center rounded-full overflow-hidden">
          <div className="bg-neutral-400 w-2/3 h-full"></div>
        </div>
      </div>
    </div>
  );
};