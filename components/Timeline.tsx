
import React, { useRef, useState, useEffect } from 'react';
import { Track, Clip } from '../types';
import { Video, Music, Mic, Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, Magnet, Undo2, Redo2, Trash2, Scissors, ZoomIn, ZoomOut, Image as ImageIcon, Type } from 'lucide-react';

interface TimelineProps {
  tracks: Track[];
  clips: Clip[];
  onSelectClip: (clipId: string, isMulti: boolean) => void;
  selectedClipIds: Set<string>;
  onMoveClip: (clipId: string, newTrackId: string, newStartOffset: number) => void;
  currentTime: number;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onSeek: (time: number) => void;
  onTrimClip: (clipId: string, deltaStart: number, deltaDuration: number) => void;
  onToggleTrackProp: (trackId: string, prop: 'isMuted' | 'isHidden' | 'isLocked') => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  tracks, 
  clips, 
  onSelectClip, 
  selectedClipIds, 
  onMoveClip, 
  currentTime, 
  onSplitClip,
  onSeek,
  onTrimClip,
  onToggleTrackProp
}) => {
  
  // ZOOM STATE
  const MIN_ZOOM = 10;
  const MAX_ZOOM = 200;
  const [zoom, setZoom] = useState(40); // Default pixels per second

  const rulerRef = useRef<HTMLDivElement>(null);
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  
  // Resizing State
  const [resizingState, setResizingState] = useState<{
    clipId: string;
    edge: 'start' | 'end';
    startX: number;
  } | null>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev + 10));
  const handleZoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev - 10));
  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value));

  const handleDragStart = (e: React.DragEvent, clipId: string, isLocked: boolean) => {
    if (isLocked) {
        e.preventDefault();
        return;
    }
    if (resizingState) {
        e.preventDefault();
        return;
    }
    if (!selectedClipIds.has(clipId)) {
        onSelectClip(clipId, false);
    }
    // Calculate offset within the clip to maintain relative drag position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    e.dataTransfer.setData('clipId', clipId);
    e.dataTransfer.setData('clickOffset', offsetX.toString());
  };

  const handleDragOver = (e: React.DragEvent, isLocked: boolean) => {
    e.preventDefault();
    if (isLocked) {
        e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent, trackId: string, isLocked: boolean) => {
    e.preventDefault();
    if (isLocked) return;

    const clipId = e.dataTransfer.getData('clipId');
    if (!clipId) return;

    const clickOffset = parseFloat(e.dataTransfer.getData('clickOffset'));

    // Calculate the raw new start time based on drop position
    const trackRect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - trackRect.left - clickOffset; // Adjust for where user grabbed the clip
    let newStartTime = Math.max(0, relativeX / zoom);

    // SNAP LOGIC
    if (isSnappingEnabled) {
        const snapThresholdPixels = 10; 
        const snapThresholdTime = snapThresholdPixels / zoom; 
        
        let bestSnap = newStartTime;
        let minDistance = Infinity;

        // Gather all snap points (start and end of all OTHER clips)
        const snapPoints: number[] = [0]; // Always snap to 0
        clips.forEach(c => {
            if (c.id !== clipId) {
                snapPoints.push(c.startOffset);
                snapPoints.push(c.startOffset + c.duration);
            }
        });
        // Also snap to Playhead
        snapPoints.push(currentTime);

        snapPoints.forEach(point => {
            const dist = Math.abs(newStartTime - point);
            if (dist < snapThresholdTime && dist < minDistance) {
                minDistance = dist;
                bestSnap = point;
            }
        });

        if (minDistance < snapThresholdTime) {
            newStartTime = bestSnap;
        }
    }

    onMoveClip(clipId, trackId, newStartTime);
  };

  const handleClipClick = (e: React.MouseEvent, clipId: string) => {
      e.stopPropagation();
      const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
      onSelectClip(clipId, isMulti);
  };

  const handleRulerClick = (e: React.MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (rulerRef.current.scrollLeft || 0);
      const time = Math.max(0, x / zoom);
      onSeek(time);
  };

  const handleSplit = () => {
      const ids = Array.from(selectedClipIds);
      if (ids.length === 0) return;
      const targetId = ids[ids.length - 1];
      onSplitClip(targetId, currentTime);
  };

  // Resizing Logic Implementation
  const handleResizeMouseDown = (e: React.MouseEvent, clip: Clip, edge: 'start' | 'end', isLocked: boolean) => {
      e.stopPropagation();
      e.preventDefault();
      if (isLocked) return;

      setResizingState({
          clipId: clip.id,
          edge,
          startX: e.clientX,
      });
  };

  useEffect(() => {
      if (!resizingState) return;

      let lastX = resizingState.startX;

      const handleMouseMove = (e: MouseEvent) => {
          const currentX = e.clientX;
          const deltaX = currentX - lastX;
          
          if (deltaX !== 0) {
             const deltaTime = deltaX / zoom;
             if (resizingState.edge === 'start') {
                 onTrimClip(resizingState.clipId, deltaTime, -deltaTime);
             } else {
                 onTrimClip(resizingState.clipId, 0, deltaTime);
             }
             lastX = currentX;
          }
      };

      const handleMouseUp = () => {
          setResizingState(null);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [resizingState, onTrimClip, zoom]);


  return (
    <div className="flex flex-col w-full h-full bg-[#121212] select-none text-xs border-t border-[#2a2a2a]">
      
      {/* Toolbar Strip */}
      <div className="h-10 bg-[#171717] border-b border-[#2a2a2a] flex items-center px-4 justify-between shrink-0 z-20">
         <div className="flex items-center gap-4 text-gray-400">
            <div className="flex gap-1">
                <button className="p-1.5 hover:bg-[#333] rounded hover:text-white transition"><Undo2 size={14} /></button>
                <button className="p-1.5 hover:bg-[#333] rounded hover:text-white transition"><Redo2 size={14} /></button>
            </div>
            <div className="w-px h-4 bg-[#333]"></div>
            <div className="flex gap-1">
                <button onClick={handleSplit} className="p-1.5 hover:bg-[#333] rounded hover:text-white transition" title="Split Clip (K)">
                    <Scissors size={14} />
                </button>
                <button className="p-1.5 hover:bg-[#333] rounded hover:text-white transition"><Trash2 size={14} /></button>
            </div>
         </div>

         <div className="flex items-center gap-3 text-gray-400">
             <div className="flex items-center bg-[#252525] rounded-full px-2 py-1 gap-2 border border-[#333]">
                <ZoomOut size={12} className="cursor-pointer hover:text-white" onClick={handleZoomOut}/>
                <input 
                    type="range" 
                    min={MIN_ZOOM} 
                    max={MAX_ZOOM} 
                    value={zoom} 
                    onChange={handleZoomSlider}
                    className="w-16 h-1 bg-[#444] rounded-full appearance-none cursor-pointer accent-[#00E5E5]"
                />
                <ZoomIn size={12} className="cursor-pointer hover:text-white" onClick={handleZoomIn}/>
             </div>
            <button className="p-1.5 hover:bg-[#333] rounded hover:text-[#00E5E5]"><Mic size={14} /></button>
            <button 
                onClick={() => setIsSnappingEnabled(!isSnappingEnabled)}
                className={`p-1.5 hover:bg-[#333] rounded transition ${isSnappingEnabled ? 'text-[#00E5E5] bg-[#333]/50' : 'text-gray-500'}`}
                title="Toggle Snap"
            >
                <Magnet size={14} />
            </button>
         </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Track Headers */}
        <div className="w-[200px] bg-[#171717] border-r border-[#2a2a2a] flex flex-col shrink-0 z-20 shadow-xl">
            <div className="h-8 border-b border-[#2a2a2a] bg-[#171717] shrink-0 flex items-center px-4 text-gray-500 font-mono text-[10px]">
                TRACKS
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 pb-10">
                {tracks.map(track => (
                <div key={track.id} className={`h-24 border-b border-[#2a2a2a] flex flex-col justify-center px-3 text-gray-400 group transition-colors relative shrink-0 ${track.isLocked ? 'bg-[#1f1f1f]/50' : 'hover:bg-[#1f1f1f]'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-200">
                             <div className={`p-1.5 rounded ${track.type === 'video' ? 'bg-blue-900/30 text-blue-400' : track.type === 'audio' ? 'bg-teal-900/30 text-teal-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                 {track.type === 'video' ? <Video size={14} /> : track.type === 'audio' ? <Music size={14} /> : <Type size={14} />}
                             </div>
                             <span className="font-semibold truncate max-w-[70px] text-[11px]">{track.name}</span>
                        </div>
                    </div>
                    
                    {/* Track Controls */}
                    <div className="flex gap-1 justify-start pl-8">
                        <button 
                            onClick={() => onToggleTrackProp(track.id, 'isLocked')}
                            className={`p-1 rounded hover:bg-[#333] ${track.isLocked ? 'text-red-400' : 'text-gray-600'}`}
                        >
                            {track.isLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                        </button>
                        <button 
                            onClick={() => onToggleTrackProp(track.id, 'isHidden')}
                            className={`p-1 rounded hover:bg-[#333] ${track.isHidden ? 'text-gray-600' : 'text-gray-400'}`}
                        >
                             {track.isHidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                        </button>
                        <button 
                             onClick={() => onToggleTrackProp(track.id, 'isMuted')}
                             className={`p-1 rounded hover:bg-[#333] ${track.isMuted ? 'text-red-400' : 'text-gray-400'}`}
                        >
                             {track.isMuted ? <VolumeX size={12}/> : <Volume2 size={12}/>}
                        </button>
                    </div>
                </div>
                ))}
            </div>
        </div>

        {/* Timeline Area */}
        <div 
            className="flex-1 bg-[#0a0a0a] overflow-scroll relative custom-scrollbar"
            onClick={() => onSelectClip('', false)}
            ref={rulerRef}
        >
            {/* Time Ruler */}
            <div 
                className="h-8 bg-[#171717] border-b border-[#2a2a2a] sticky top-0 z-30 flex items-end min-w-full cursor-pointer group"
                style={{ width: `${Math.max(2000, (3600 * zoom))}px` }} // Ensure enough width
                onClick={handleRulerClick}
            >
                <div className="absolute top-0 bottom-0 left-0 w-full flex items-end pointer-events-none">
                     {/* Render ruler ticks dynamically based on zoom to avoid 10000 divs */}
                     {Array.from({length: Math.ceil(20000 / zoom)}).map((_, i) => {
                         const sec = i;
                         const left = sec * zoom;
                         // Optimization: Don't render if too dense
                         if (zoom < 20 && sec % 5 !== 0) return null; 

                         return (
                             <div key={i} className="absolute bottom-0 h-full border-l border-gray-700/30" style={{left: `${left}px`}}>
                                 <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-600 group-hover:bg-gray-400"></div>
                                 {sec % 5 === 0 && (
                                     <>
                                     <div className="absolute bottom-0 left-0 w-px h-3 bg-gray-500"></div>
                                     <span className="absolute top-1 left-1 text-[10px] text-gray-500 font-mono select-none opacity-70">
                                         {new Date(sec * 1000).toISOString().substr(14, 5)}
                                     </span>
                                     </>
                                 )}
                             </div>
                         );
                     })}
                </div>
            </div>

            {/* Playhead */}
            <div 
                className="absolute top-0 bottom-0 left-0 w-px bg-[#00E5E5] z-40 pointer-events-none h-full" 
                style={{ left: `${currentTime * zoom}px`, transition: 'left 0.1s linear' }}
            >
                <div className="absolute -top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#00E5E5]"></div>
                <div className="absolute top-0 left-0 w-px h-full bg-[#00E5E5] shadow-[0_0_8px_rgba(0,229,229,0.5)]"></div>
            </div>

            {/* Tracks Container */}
            <div className="relative w-full min-w-[2000px] pb-20">
                {tracks.map((track) => {
                    const trackClips = clips.filter(c => c.trackId === track.id);
                    return (
                        <div 
                            key={track.id} 
                            className={`h-24 border-b border-[#2a2a2a] relative w-full transition-colors ${track.isLocked ? 'bg-stripes opacity-80' : 'bg-[#0a0a0a] hover:bg-[#121212]'}`}
                            onDragOver={(e) => handleDragOver(e, track.isLocked)}
                            onDrop={(e) => handleDrop(e, track.id, track.isLocked)}
                        >
                            {!track.isLocked && <div className="absolute inset-0 w-full h-full border-t border-dashed border-white/5 pointer-events-none top-1/2"></div>}

                            {!track.isHidden && trackClips.map((clip) => {
                                const width = clip.duration * zoom;
                                const left = clip.startOffset * zoom;
                                const isSelected = selectedClipIds.has(clip.id);

                                return (
                                <div
                                    key={clip.id}
                                    draggable={!track.isLocked}
                                    onDragStart={(e) => handleDragStart(e, clip.id, track.isLocked)}
                                    onClick={(e) => handleClipClick(e, clip.id)}
                                    className={`
                                    absolute top-2 bottom-2 rounded-md overflow-hidden cursor-pointer transition-all group shadow-md
                                    ${isSelected ? 'ring-2 ring-white z-20' : 'border border-transparent hover:border-gray-500 opacity-90 hover:opacity-100'}
                                    ${clip.type === 'video' ? 'bg-[#1e40af]' : clip.type === 'audio' ? 'bg-[#0f766e]' : clip.type === 'text' ? 'bg-purple-700' : 'bg-[#be185d]'}
                                    ${track.isLocked ? 'cursor-not-allowed opacity-60 grayscale' : ''}
                                    `}
                                    style={{
                                        left: `${left}px`,
                                        width: `${width}px`
                                    }}
                                >
                                    {/* Thumbnail rendering for video */}
                                    {clip.type === 'video' && clip.thumbnail && (
                                        <div className="absolute inset-0 flex w-full overflow-hidden opacity-40 mix-blend-overlay grayscale hover:grayscale-0 transition-all pointer-events-none">
                                            {/* Render thumbnails horizontally to fill the bar */}
                                            {Array.from({ length: Math.ceil(width / 50) }).map((_, i) => (
                                                <img 
                                                    key={i} 
                                                    src={clip.thumbnail} 
                                                    className="h-full w-auto aspect-video object-cover flex-shrink-0 border-r border-black/20" 
                                                    alt=""
                                                />
                                            ))}
                                        </div>
                                    )}
                                    
                                    {clip.type === 'image' && (
                                         <div className="absolute inset-0 flex w-full overflow-hidden opacity-60 mix-blend-overlay transition-all pointer-events-none">
                                             <img src={clip.src} alt="" className="w-full h-full object-cover" />
                                         </div>
                                    )}
                                    
                                    <div className="relative p-2 h-full flex flex-col justify-between z-10 pointer-events-none">
                                        <div className="flex justify-between items-start w-full">
                                            {width > 40 && (
                                                <div className="text-[10px] font-bold text-white shadow-sm truncate drop-shadow-md flex items-center gap-1 max-w-[70%]">
                                                    {clip.type === 'audio' ? <Music size={10}/> : clip.type === 'image' ? <ImageIcon size={10} /> : clip.type === 'text' ? <Type size={10} /> : <Video size={10} />}
                                                    {clip.name}
                                                </div>
                                            )}
                                            {width > 60 && <div className="text-[9px] bg-black/50 px-1 rounded text-gray-200 font-mono">{clip.duration.toFixed(1)}s</div>}
                                        </div>
                                        
                                        {/* Fake Waveform for audio */}
                                        {clip.type === 'audio' && (
                                            <div className="h-8 w-full flex items-center gap-0.5 opacity-70">
                                                {Array.from({length: Math.floor(width / 4)}).map((_, i) => (
                                                    <div key={i} className="w-1 bg-white/50 rounded-full transition-all" style={{height: `${30 + Math.random() * 60}%`}}></div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Text Content Preview */}
                                        {clip.type === 'text' && clip.textData && (
                                            <div className="text-[9px] text-white/80 truncate italic">
                                                "{clip.textData.content}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Trim Handles (Visible only when selected & unlocked) */}
                                    {isSelected && !track.isLocked && (
                                        <>
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-4 bg-white flex items-center justify-center cursor-w-resize z-30 group/handle"
                                                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'start', track.isLocked)}
                                            >
                                                <div className="w-0.5 h-4 bg-black/50"></div>
                                            </div>
                                            <div 
                                                className="absolute right-0 top-0 bottom-0 w-4 bg-white flex items-center justify-center cursor-e-resize z-30 group/handle"
                                                onMouseDown={(e) => handleResizeMouseDown(e, clip, 'end', track.isLocked)}
                                            >
                                                 <div className="w-0.5 h-4 bg-black/50"></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
      <style>{`
        .bg-stripes {
            background-image: linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 50%, #1a1a1a 50%, #1a1a1a 75%, transparent 75%, transparent);
            background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};
