
import React, { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { RESOLUTIONS, FRAME_RATES, CODECS, FORMATS, EXPORT_SETTINGS_KEY } from '../constants';
import { ExportSettings } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  duration: number; // Duration in seconds
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, duration }) => {
  // Initialize state with values from localStorage or defaults
  const [name, setName] = useState("Project_01");
  const [resolution, setResolution] = useState(RESOLUTIONS[2]); // 1080p default
  const [quality, setQuality] = useState<'High' | 'Standard' | 'Web'>('Standard');
  const [codec, setCodec] = useState(CODECS[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [frameRate, setFrameRate] = useState(FRAME_RATES[2]); // 30fps default
  
  // Load settings when modal opens
  useEffect(() => {
      if (isOpen) {
          try {
              const saved = localStorage.getItem(EXPORT_SETTINGS_KEY);
              if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed.name) setName(parsed.name);
                  if (parsed.resolution) setResolution(parsed.resolution);
                  if (parsed.quality) setQuality(parsed.quality);
                  if (parsed.codec) setCodec(parsed.codec);
                  if (parsed.format) setFormat(parsed.format);
                  if (parsed.frameRate) setFrameRate(parsed.frameRate);
              }
          } catch (e) {
              console.error("Failed to load export settings", e);
          }
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportClick = () => {
    const settings: ExportSettings = {
      name,
      resolution,
      quality,
      bitrate: quality === 'High' ? '8000k' : quality === 'Standard' ? '5000k' : '2500k',
      codec,
      format,
      frameRate
    };
    
    // Save settings to localStorage
    try {
        localStorage.setItem(EXPORT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save export settings", e);
    }

    onExport(settings);
    onClose();
  };

  // Helper: Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper: Estimate file size based on resolution and quality
  const estimateSize = () => {
      if (duration <= 0) return "0 MB";

      // Bitrate mappings (kbps)
      let bitrateKbps = 5000; // Standard default

      if (quality === 'High') bitrateKbps = 8000;
      else if (quality === 'Standard') bitrateKbps = 5000;
      else if (quality === 'Web') bitrateKbps = 2500;

      // Adjust for Resolution Scaling (Rough approximation)
      if (resolution === '4k') bitrateKbps *= 2.5;
      if (resolution === '2k') bitrateKbps *= 1.5;
      if (resolution === '720p') bitrateKbps *= 0.75;
      if (resolution === '480p') bitrateKbps *= 0.5;

      // Size (MB) = (Bitrate(kbps) * Duration(s)) / 8 / 1024
      const sizeMB = (bitrateKbps * duration) / 8 / 1024;
      
      if (sizeMB < 1) return "< 1 MB";
      return `~ ${sizeMB.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#1f1f1f] w-[600px] rounded-lg shadow-2xl border border-[#333] flex flex-col text-xs">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#333]">
          <span className="text-white font-semibold text-sm">Export</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex gap-6">
          {/* Left: Preview Placeholder */}
          <div className="w-1/3 flex flex-col gap-2">
            <div className="bg-black aspect-[9/16] rounded border border-[#333] flex items-center justify-center text-gray-600 flex-col gap-2">
              <div className="text-2xl text-[#333] font-bold">VIDEO</div>
              <span className="text-gray-700 text-[10px]">Preview</span>
            </div>
            <button className="text-gray-400 hover:text-white flex items-center gap-1 justify-center">
               Edit cover
            </button>
          </div>

          {/* Right: Settings */}
          <div className="flex-1 space-y-5">
            
            {/* Name & Path */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 w-20">Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1.5 flex-1 text-white focus:border-[#00E5E5] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-400 w-20">Export to</label>
                <div className="flex-1 flex gap-2">
                   <input 
                    disabled 
                    value="C:/Users/Public/Videos/VoxaCut" 
                    className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1.5 flex-1 text-gray-500 cursor-not-allowed"
                   />
                   <button className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-white">
                     <Folder size={14} />
                   </button>
                </div>
              </div>
            </div>

            {/* Video Settings Section */}
            <div>
              <div className="flex items-center gap-2 mb-3 border-t border-[#333] pt-4">
                <input type="checkbox" defaultChecked className="accent-[#00E5E5]" />
                <span className="font-semibold text-white">Video</span>
              </div>

              <div className="space-y-3 pl-5">
                <Dropdown label="Resolution" options={RESOLUTIONS} value={resolution} onChange={setResolution} />
                
                {/* Quality Preset Dropdown */}
                <div className="flex items-center justify-between">
                    <label className="text-gray-400 w-20">Quality</label>
                    <select 
                        value={quality} 
                        onChange={(e) => setQuality(e.target.value as any)}
                        className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1.5 flex-1 text-white focus:outline-none focus:border-[#333] cursor-pointer"
                    >
                        <option value="High">High Quality (Large)</option>
                        <option value="Standard">Standard (Recommended)</option>
                        <option value="Web">Web Optimized (Small)</option>
                    </select>
                </div>

                <Dropdown label="Codec" options={CODECS} value={codec} onChange={setCodec} />
                <Dropdown label="Format" options={FORMATS} value={format} onChange={setFormat} />
                <Dropdown label="Frame rate" options={FRAME_RATES} value={frameRate} onChange={setFrameRate} />
              </div>
              
               <div className="mt-4 pl-5 text-gray-500">
                  Color space: Rec. 709 SDR (yuv420p)
               </div>
            </div>

            {/* Audio Section (Collapsed) */}
            <div className="pt-2 border-t border-[#333]">
               <div className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#00E5E5]" />
                <span className="text-gray-400">Audio</span>
               </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] flex justify-between items-center bg-[#1f1f1f] rounded-b-lg">
          <div className="text-gray-400 flex items-center gap-2">
            <span>Duration: <span className="text-gray-200 font-mono">{formatTime(duration)}</span></span>
            <span className="text-gray-600">|</span>
            <span>Est. Size: <span className="text-gray-200">{estimateSize()}</span></span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-1.5 rounded bg-[#333] text-white hover:bg-[#444] transition-colors font-medium">
              Cancel
            </button>
            <button onClick={handleExportClick} className="px-4 py-1.5 rounded bg-[#00E5E5] text-black hover:bg-[#00c4c4] transition-colors font-bold">
              Export
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const Dropdown = ({ 
    label, 
    options, 
    value, 
    onChange 
}: { 
    label: string, 
    options: readonly string[], 
    value: string, 
    onChange: (val: string) => void 
}) => (
  <div className="flex items-center justify-between">
    <label className="text-gray-400 w-20">{label}</label>
    <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#2a2a2a] border border-[#333] rounded px-2 py-1.5 flex-1 text-white focus:outline-none focus:border-[#333] cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
