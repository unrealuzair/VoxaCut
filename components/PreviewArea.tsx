
import React, { useRef, useEffect, useState } from 'react';
import { Clip, Track } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Settings2, MousePointer2 } from 'lucide-react';

interface PreviewAreaProps {
  selectedClip: Clip | null;
  onTimeUpdate: (time: number) => void;
  currentTime: number; // Global time from App/Timeline
  tracks?: Track[]; // Added to check for hidden/muted status
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ selectedClip, onTimeUpdate, currentTime: globalTime, tracks }) => {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const isDraggingSlider = useRef(false);

  // Use key to force re-mount if the source or start offset changes heavily
  const mediaKey = selectedClip ? `${selectedClip.id}-${selectedClip.src}-${selectedClip.mediaStartOffset}` : 'empty';

  // Check Track Status
  const parentTrack = tracks?.find(t => t.id === selectedClip?.trackId);
  const isTrackHidden = parentTrack?.isHidden || false;
  const isTrackMuted = parentTrack?.isMuted || false;

  useEffect(() => {
    if (mediaRef.current && selectedClip) {
      mediaRef.current.playbackRate = selectedClip.speed;
      // Mute logic: If track is muted, volume is 0, otherwise use clip volume
      mediaRef.current.volume = isTrackMuted ? 0 : (selectedClip.volume / 100);
    }
  }, [selectedClip?.speed, selectedClip?.volume, isTrackMuted]);

  // SYNC: When globalTime changes (e.g. timeline seek), update player
  useEffect(() => {
      if (!selectedClip || !mediaRef.current || isPlaying) return;
      
      // Calculate where the global playhead is relative to this specific clip
      const relativeTime = globalTime - selectedClip.startOffset;

      // Only seek if within clip bounds and significant difference
      if (relativeTime >= 0 && relativeTime <= selectedClip.duration) {
          const targetMediaTime = selectedClip.mediaStartOffset + relativeTime;
          if (Math.abs(mediaRef.current.currentTime - targetMediaTime) > 0.1) {
              mediaRef.current.currentTime = targetMediaTime;
              setLocalTime(globalTime);
          }
      }
  }, [globalTime, selectedClip, isPlaying]);

  // Initial clip setup
  useEffect(() => {
      if (mediaRef.current && selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'audio')) {
          const setStart = () => {
              if(mediaRef.current) {
                   // Reset to start of clip logic
                   mediaRef.current.currentTime = selectedClip.mediaStartOffset;
                   setLocalTime(selectedClip.startOffset);
              }
          };
          setStart();
          mediaRef.current.onloadedmetadata = setStart;
      }
  }, [selectedClip?.id, selectedClip?.mediaStartOffset]);

  const togglePlay = async () => {
      if (!mediaRef.current && selectedClip?.type !== 'text') return;
      // Simulate text play for now or handle video
      if (mediaRef.current) {
        try {
            if (mediaRef.current.paused) {
                await mediaRef.current.play();
            } else {
                mediaRef.current.pause();
            }
        } catch (e) {
            console.error("Playback failed:", e);
            setIsPlaying(false);
        }
      }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  
  const handleTimeUpdate = () => {
      if (mediaRef.current && selectedClip) {
          const rawTime = mediaRef.current.currentTime;
          const timeIntoClip = rawTime - selectedClip.mediaStartOffset;
          
          if (timeIntoClip >= selectedClip.duration) {
              mediaRef.current.pause();
              setIsPlaying(false);
              return;
          }

          const timelineTime = selectedClip.startOffset + timeIntoClip;
          setLocalTime(timelineTime);
          
          if (!isDraggingSlider.current) {
            onTimeUpdate(timelineTime);
          }
      }
  };

  const onEnded = () => setIsPlaying(false);

  const formatTime = (time: number) => {
      if (isNaN(time) || time < 0) return "00:00:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const frames = Math.floor((time % 1) * 30);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const getClipStyle = () => {
    if (!selectedClip) return {};
    const { style, filter } = selectedClip;
    
    return {
      transform: `
        translate(${style.position.x}px, ${style.position.y}px) 
        rotate(${style.rotation}deg) 
        scale(${style.scale / 100})
      `,
      opacity: isTrackHidden ? 0 : style.opacity,
      filter: `
        brightness(${filter.brightness}%) 
        contrast(${filter.contrast}%) 
        grayscale(${filter.grayscale}%)
        saturate(${filter.saturation}%)
      `,
      transition: 'transform 0.1s ease-out, filter 0.1s ease-out'
    };
  };

  // Progress calculation (0 to 100)
  const currentProgress = selectedClip && selectedClip.duration > 0 
      ? ((localTime - selectedClip.startOffset) / selectedClip.duration) * 100 
      : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#000000] relative min-w-0 z-0">
      
      <div className="h-10 flex items-center justify-between px-4 bg-[#171717] border-b border-[#2a2a2a] text-gray-400 select-none z-10 shrink-0">
        <span className="text-xs font-medium flex items-center gap-2">
           <MousePointer2 size={12} className="text-[#00E5E5]" />
           Player
        </span>
        <div className="flex items-center gap-3">
            <span className="text-xs bg-[#252525] px-2 py-1 rounded cursor-pointer">Ratio: 16:9</span>
            <Settings2 size={14} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#101010] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{
                 backgroundImage: `linear-gradient(45deg, #333 25%, transparent 25%), 
                                   linear-gradient(-45deg, #333 25%, transparent 25%), 
                                   linear-gradient(45deg, transparent 75%, #333 75%), 
                                   linear-gradient(-45deg, transparent 75%, #333 75%)`,
                 backgroundSize: '20px 20px',
                 backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
             }}>
        </div>

        {!selectedClip || (isTrackHidden && selectedClip) ? (
            <div className="text-[#444] flex flex-col items-center select-none z-10">
                <div className="w-32 h-20 border-2 border-dashed border-[#333] rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#222]"></div>
                </div>
                <span className="text-sm font-medium">{isTrackHidden ? 'Track is hidden' : 'Select a clip to preview'}</span>
            </div>
        ) : (
             <div className="relative shadow-2xl bg-black flex items-center justify-center" style={{ aspectRatio: '16/9', height: '80%' }}>
                 {selectedClip.type === 'video' ? (
                   <video 
                     key={mediaKey}
                     ref={mediaRef as React.RefObject<HTMLVideoElement>}
                     src={selectedClip.src} 
                     onPlay={onPlay}
                     onPause={onPause}
                     onTimeUpdate={handleTimeUpdate}
                     onEnded={onEnded}
                     className="w-full h-full object-cover pointer-events-none"
                     style={getClipStyle()}
                     loop={false}
                   />
                 ) : selectedClip.type === 'image' ? (
                    <img 
                        src={selectedClip.src}
                        className="w-full h-full object-cover pointer-events-none"
                        style={getClipStyle()}
                        alt={selectedClip.name}
                    />
                 ) : selectedClip.type === 'text' ? (
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black/50">
                        <div
                            style={{
                                ...getClipStyle(),
                                fontSize: `${selectedClip.textData?.fontSize || 60}px`,
                                fontFamily: selectedClip.textData?.fontFamily,
                                color: selectedClip.textData?.color,
                                fontWeight: selectedClip.textData?.isBold ? 'bold' : 'normal',
                                fontStyle: selectedClip.textData?.isItalic ? 'italic' : 'normal',
                                textShadow: selectedClip.textData?.shadowBlur ? `0 0 ${selectedClip.textData.shadowBlur}px ${selectedClip.textData.shadowColor}` : 'none',
                                WebkitTextStroke: selectedClip.textData?.outlineWidth ? `${selectedClip.textData.outlineWidth}px ${selectedClip.textData.outlineColor}` : '0px',
                                whiteSpace: 'pre-wrap',
                                textAlign: 'center',
                                pointerEvents: 'none',
                                userSelect: 'none'
                            }}
                        >
                            {selectedClip.textData?.content || "Text"}
                        </div>
                    </div>
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-[#1f1f1f] to-[#0a0a0a] flex flex-col items-center justify-center border border-[#333] relative overflow-hidden">
                      <audio 
                          key={mediaKey}
                          ref={mediaRef as React.RefObject<HTMLAudioElement>}
                          src={selectedClip.src}
                          onPlay={onPlay}
                          onPause={onPause}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={onEnded}
                      />
                      
                      <div className={`w-32 h-32 rounded-full bg-[#252525] flex items-center justify-center mb-6 relative z-10 ${isPlaying ? 'animate-pulse' : ''}`}>
                         <span className="text-5xl text-[#00E5E5]">🎵</span>
                         {isPlaying && (
                             <div className="absolute inset-0 rounded-full border-4 border-[#00E5E5] opacity-20 animate-ping"></div>
                         )}
                      </div>
                      <span className="text-lg text-[#00E5E5] font-mono font-bold relative z-10 truncate max-w-[80%] text-center">{selectedClip.name}</span>
                      <span className="text-xs text-gray-500 mt-2 relative z-10">Audio Preview</span>
                   </div>
                 )}
                 
                 <div className="absolute inset-0 border border-[#00E5E5] opacity-30 pointer-events-none"></div>
             </div>
        )}
      </div>

      {/* Seek Bar */}
      <div className="h-1 bg-[#2a2a2a] w-full relative group cursor-pointer z-20 shrink-0">
            <div className="absolute inset-0 bg-[#333]"></div>
            <div 
                className="absolute top-0 left-0 bottom-0 bg-[#00E5E5]"
                style={{ width: `${Math.max(0, Math.min(100, currentProgress))}%` }}
            ></div>
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${Math.max(0, Math.min(100, currentProgress))}%` }}
            ></div>
            <input 
                type="range"
                min="0"
                max={selectedClip?.duration || 1}
                step="0.01"
                value={selectedClip ? localTime - selectedClip.startOffset : 0}
                disabled={!selectedClip || isTrackHidden || selectedClip.type === 'text'}
                onMouseDown={() => { isDraggingSlider.current = true; }}
                onMouseUp={() => { isDraggingSlider.current = false; }}
                onChange={(e) => {
                    if (mediaRef.current && selectedClip) {
                        const val = parseFloat(e.target.value);
                        const newTime = selectedClip.mediaStartOffset + val;
                        mediaRef.current.currentTime = newTime;
                        const newGlobalTime = selectedClip.startOffset + val;
                        setLocalTime(newGlobalTime);
                        onTimeUpdate(newGlobalTime); // Sync back to global
                    }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
      </div>

      <div className="h-12 flex items-center justify-between px-4 bg-[#171717] border-t border-[#2a2a2a] select-none z-10 shrink-0">
        <div className="text-[#00E5E5] font-mono text-xs w-1/3">
            {formatTime(localTime)} <span className="text-gray-600">/</span> {formatTime(selectedClip?.duration || 0)}
        </div>
        
        <div className="flex items-center gap-6 text-gray-200 w-1/3 justify-center">
            {selectedClip?.type !== 'image' && selectedClip?.type !== 'text' && !isTrackHidden && (
                <>
                    <button 
                        disabled={!selectedClip}
                        onClick={() => {
                            if (mediaRef.current && selectedClip) {
                                mediaRef.current.currentTime = selectedClip.mediaStartOffset;
                                setLocalTime(selectedClip.startOffset);
                                onTimeUpdate(selectedClip.startOffset);
                            }
                        }}
                        className="hover:text-[#00E5E5] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <SkipBack size={18} />
                    </button>
                    
                    <button 
                        disabled={!selectedClip}
                        onClick={togglePlay}
                        className="hover:text-[#00E5E5] transition transform active:scale-95 flex items-center justify-center w-8 h-8 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    
                    <button 
                        disabled={!selectedClip}
                        onClick={() => {
                            if (mediaRef.current && selectedClip) {
                                mediaRef.current.currentTime = selectedClip.mediaStartOffset + selectedClip.duration;
                                onTimeUpdate(selectedClip.startOffset + selectedClip.duration);
                            }
                        }}
                        className="hover:text-[#00E5E5] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <SkipForward size={18} />
                    </button>
                </>
            )}
        </div>

        <div className="flex items-center gap-3 text-gray-400 w-1/3 justify-end">
            <span className="text-xs">Fit</span>
            <Maximize2 size={16} className="hover:text-white cursor-pointer" />
        </div>
      </div>

    </div>
  );
};
