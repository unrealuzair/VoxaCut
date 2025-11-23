
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PreviewArea } from './components/PreviewArea';
import { Timeline } from './components/Timeline';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PexelsModal } from './components/PexelsModal';
import { TTSModal } from './components/TTSModal';
import { ImageGenModal } from './components/ImageGenModal';
import { ExportModal } from './components/ExportModal';
import { RenderingModal } from './components/RenderingModal';
import { Clip, PexelsVideo, Track, ExportSettings, ProjectData, TextData } from './types';
import { DEFAULT_TRACKS, TRACK_TYPES, APP_NAME, LOCAL_STORAGE_KEY } from './constants';
import { renderProject } from './services/renderService';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to convert blob url to base64
const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
        // If it's already a base64 string or http url, return as is
        if (!blobUrl.startsWith('blob:')) return blobUrl;

        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to convert blob to base64", e);
        return blobUrl;
    }
};

// Helper to parse HH:MM:SS,mmm to seconds
const parseTimestamp = (timeStr: string): number => {
    // Format: 00:00:05,000 or 00:00:05.000
    const parts = timeStr.replace(',', '.').split(':');
    if (parts.length !== 3) return 0;
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return (h * 3600) + (m * 60) + s;
};

// Default properties for new clips
const createDefaultClip = (props: Partial<Clip>): Clip => ({
  id: generateId(),
  trackId: 't1',
  type: 'video',
  src: '',
  name: 'Untitled',
  duration: 5,
  startOffset: 0,
  mediaStartOffset: 0,
  sourceDuration: 0,
  style: {
    scale: 100,
    position: { x: 0, y: 0 },
    rotation: 0,
    opacity: 1,
  },
  filter: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
  },
  volume: 100,
  speed: 1,
  ...props,
});

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [clips, setClips] = useState<Clip[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Multi-selection State
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  
  // Modal States
  const [isPexelsOpen, setIsPexelsOpen] = useState(false); // Kept for backward compat/future use but unused by sidebar now
  const [isTTSOpen, setIsTTSOpen] = useState(false);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  // Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
      const loadProject = () => {
          try {
              const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (savedData) {
                  const parsed = JSON.parse(savedData) as ProjectData;
                  if (parsed.timeline) {
                      setTracks(parsed.timeline.tracks.map(t => ({
                          ...t,
                          // Ensure new props exist if loading old data
                          isMuted: t.isMuted || false,
                          isHidden: t.isHidden || false,
                          isLocked: t.isLocked || false
                      })));
                      setClips(parsed.timeline.clips);
                      setLastSaved(new Date(parsed.meta.created)); 
                  }
              }
          } catch (e) {
              console.error("Failed to load project from local storage", e);
          }
      };
      loadProject();
  }, []);

  const handleSaveProject = useCallback(async () => {
      setIsSaving(true);
      try {
          // 1. Serialize Clips (Convert Blob URLs to Base64)
          const processedClips: Clip[] = [];
          for (const clip of clips) {
              let finalSrc = clip.src;
              if (clip.src.startsWith('blob:')) {
                  finalSrc = await blobUrlToBase64(clip.src);
              }
              processedClips.push({ ...clip, src: finalSrc });
          }

          // 2. Create Project Object
          const projectData: ProjectData = {
              version: "1.0.0",
              meta: {
                  created: new Date().toISOString(),
                  appName: APP_NAME,
                  exportSettings: { 
                      name: 'Project_Autosave', 
                      resolution: '1080p', 
                      quality: 'Standard',
                      bitrate: 'Rec', 
                      codec: 'h264', 
                      format: 'mp4', 
                      frameRate: '30' 
                  }
              },
              timeline: {
                  tracks: tracks,
                  clips: processedClips
              }
          };

          // 3. Save to LocalStorage
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectData));
            setLastSaved(new Date());
          } catch (storageError) {
              alert("Failed to save! Project is too large for browser storage. Try removing some imported files.");
              console.error("LocalStorage Quota Exceeded", storageError);
          }

      } catch (e) {
          console.error("Save failed", e);
      } finally {
          setIsSaving(false);
      }
  }, [clips, tracks]);

  // Keyboard listeners for delete and split
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipIds.size > 0) {
        setClips(prev => prev.filter(c => {
             // Don't delete if track locked
             const track = tracks.find(t => t.id === c.trackId);
             if (track?.isLocked) return true;
             return !selectedClipIds.has(c.id);
        }));
        setSelectedClipIds(new Set());
      }
      if (e.key.toLowerCase() === 's') {
          // Split logic invoked via key
          // We need to handle this carefully or just rely on the UI button
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipIds, tracks]);

  const handleClipSelect = (clipId: string, isMulti: boolean) => {
    setSelectedClipIds(prev => {
      const newSet = new Set(isMulti ? prev : []);
      if (newSet.has(clipId) && isMulti) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return newSet;
    });
  };

  // Track Logic
  const toggleTrackProperty = (trackId: string, prop: 'isMuted' | 'isHidden' | 'isLocked') => {
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, [prop]: !t[prop] } : t));
  };

  const handleAddVideos = (videos: PexelsVideo[]) => {
    const existingClipsOnTrack = clips.filter(c => c.trackId === 't1');
    let currentOffset = existingClipsOnTrack.length > 0 
        ? Math.max(...existingClipsOnTrack.map(c => c.startOffset + c.duration)) + 0.1
        : 0;

    const newClips = videos.map(video => {
        const videoFile = video.video_files.find(f => f.width >= 1280) || video.video_files[0];
        const clip = createDefaultClip({
            trackId: 't1',
            type: 'video',
            src: videoFile.link,
            thumbnail: video.image,
            name: `Stock_${video.id}`,
            duration: video.duration,
            startOffset: currentOffset,
            sourceDuration: video.duration
        });
        currentOffset += video.duration;
        return clip;
    });

    setClips(prev => [...prev, ...newClips]);
    if (newClips.length > 0) {
        setSelectedClipIds(new Set(newClips.map(c => c.id)));
    }
  };

  const handleAddPexelsVideo = (video: PexelsVideo) => {
    handleAddVideos([video]);
  };

  const handleAddAudio = (blob: Blob, text: string, voiceName: string) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.load();
    audio.onloadedmetadata = () => {
        const duration = (audio.duration === Infinity || isNaN(audio.duration)) ? 5 : audio.duration;
        const newClip = createDefaultClip({
            trackId: 't2',
            type: 'audio',
            src: url,
            name: `TTS_${voiceName}`,
            duration: duration, 
            voiceName: voiceName,
            startOffset: 0,
            sourceDuration: duration
        });
        setClips(prev => [...prev, newClip]);
        setSelectedClipIds(new Set([newClip.id]));
    };
  };

  const handleAddText = (textData: TextData) => {
      const newClip = createDefaultClip({
          trackId: 't4', // Text Track
          type: 'text',
          src: '', // No src for text
          name: textData.content.substring(0, 10) || 'Text',
          duration: 3,
          startOffset: currentTime,
          textData: textData
      });
      setClips(prev => [...prev, newClip]);
      setSelectedClipIds(new Set([newClip.id]));
  };

  const handleImportSRT = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          if (!content) return;

          // Parse SRT
          // Format: 
          // 1
          // 00:00:01,000 --> 00:00:04,000
          // Text content
          
          const blocks = content.trim().split(/\n\s*\n/);
          const newClips: Clip[] = [];
          
          blocks.forEach((block) => {
              const lines = block.split('\n');
              if (lines.length < 3) return;

              // Find the line with timestamps
              const timeLineIndex = lines.findIndex(l => l.includes('-->'));
              if (timeLineIndex === -1) return;

              const timeLine = lines[timeLineIndex];
              const textLines = lines.slice(timeLineIndex + 1);
              const textContent = textLines.join(' ');

              const [startStr, endStr] = timeLine.split('-->').map(s => s.trim());
              const start = parseTimestamp(startStr);
              const end = parseTimestamp(endStr);
              const duration = end - start;

              if (duration > 0) {
                  const clip = createDefaultClip({
                      trackId: 't4',
                      type: 'text',
                      name: 'Subtitle',
                      startOffset: start,
                      duration: duration,
                      textData: {
                          content: textContent,
                          fontSize: 24,
                          color: '#ffffff',
                          fontFamily: 'Arial',
                          isBold: false,
                          isItalic: false,
                          shadowColor: '#000000',
                          shadowBlur: 2
                      }
                  });
                  newClips.push(clip);
              }
          });

          if (newClips.length > 0) {
              setClips(prev => [...prev, ...newClips]);
              alert(`Imported ${newClips.length} captions from SRT.`);
          }
      };
      reader.readAsText(file);
  };

  const handleAddImage = (blob: Blob, prompt: string) => {
    const url = URL.createObjectURL(blob);
    const newClip = createDefaultClip({
        trackId: 't1',
        type: 'image',
        src: url,
        name: `AI_Gen_${prompt.substring(0, 10)}...`,
        duration: 5, // Default duration for images
        startOffset: 0,
        sourceDuration: 5
    });
    setClips(prev => [...prev, newClip]);
    setSelectedClipIds(new Set([newClip.id]));
  };

  const handleImportFiles = (files: FileList) => {
      const newClips: Clip[] = [];
      let offset = 0;

      Array.from(files).forEach((file) => {
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
          const trackId = type === 'audio' ? 't2' : 't1';
          
          const tempVideo = document.createElement('video');
          tempVideo.src = url;
          
          const clip = createDefaultClip({
              trackId,
              type: type as 'video' | 'audio' | 'image',
              src: url,
              name: file.name,
              duration: type === 'image' ? 5 : 10, 
              startOffset: offset,
              sourceDuration: 0 
          });
          
          if (type !== 'image') {
              tempVideo.onloadedmetadata = () => {
                  setClips(prev => prev.map(c => c.id === clip.id ? { ...c, duration: tempVideo.duration, sourceDuration: tempVideo.duration } : c));
              };
          }

          newClips.push(clip);
          offset += 5;
      });

      setClips(prev => [...prev, ...newClips]);
  };

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(prev => prev.map(c => {
      if (!selectedClipIds.has(c.id)) return c;
      
      // Check Lock status
      const track = tracks.find(t => t.id === c.trackId);
      if (track?.isLocked) return c;

      return {
        ...c,
        ...updates,
        style: { ...c.style, ...(updates.style || {}) },
        filter: { ...c.filter, ...(updates.filter || {}) },
        textData: { ...c.textData, ...(updates.textData || {}) }
      };
    }));
  };

  const moveClip = (primaryClipId: string, targetTrackId: string, newStartOffset: number) => {
      // Check if target track is locked
      const targetTrack = tracks.find(t => t.id === targetTrackId);
      if (targetTrack?.isLocked) return;

      setClips(prev => {
          const primaryClip = prev.find(c => c.id === primaryClipId);
          if (!primaryClip) return prev;
          
          // Check if source track is locked
          const sourceTrack = tracks.find(t => t.id === primaryClip.trackId);
          if (sourceTrack?.isLocked) return prev;

          const timeDelta = newStartOffset - primaryClip.startOffset;

          return prev.map(c => {
              if (selectedClipIds.has(c.id)) {
                  if (c.id === primaryClipId) {
                      return { ...c, trackId: targetTrackId, startOffset: Math.max(0, c.startOffset + timeDelta) };
                  } 
                  return { ...c, startOffset: Math.max(0, c.startOffset + timeDelta) };
              }
              return c;
          });
      });
  };

  const splitClip = (clipId: string, splitTime: number) => {
      setClips(prev => {
          const clipToSplit = prev.find(c => c.id === clipId);
          if (!clipToSplit) return prev;

          // Check lock
          const track = tracks.find(t => t.id === clipToSplit.trackId);
          if (track?.isLocked) return prev;

          const relativeSplitTime = splitTime - clipToSplit.startOffset;

          if (relativeSplitTime <= 0 || relativeSplitTime >= clipToSplit.duration) {
              console.warn("Split time is outside clip bounds");
              return prev;
          }

          const clipA = { 
              ...clipToSplit, 
              duration: relativeSplitTime 
          };

          const clipB = {
              ...clipToSplit,
              id: generateId(),
              startOffset: splitTime,
              mediaStartOffset: clipToSplit.mediaStartOffset + relativeSplitTime,
              duration: clipToSplit.duration - relativeSplitTime,
              name: `${clipToSplit.name} (Split)`
          };

          return prev.map(c => c.id === clipId ? clipA : c).concat(clipB);
      });
  };

  const trimClip = (clipId: string, deltaStart: number, deltaDuration: number) => {
      setClips(prev => prev.map(c => {
          if (c.id !== clipId) return c;
          
          // Check lock
          const track = tracks.find(t => t.id === c.trackId);
          if (track?.isLocked) return c;

          let newStartOffset = c.startOffset + deltaStart;
          let newMediaStartOffset = c.mediaStartOffset + deltaStart;
          let newDuration = c.duration + deltaDuration;

          if (newDuration < 0.5) return c; 
          if (newMediaStartOffset < 0) return c; 
          if (c.sourceDuration > 0 && (newMediaStartOffset + newDuration > c.sourceDuration)) {
               return c;
          }

          return {
              ...c,
              startOffset: newStartOffset,
              mediaStartOffset: newMediaStartOffset,
              duration: newDuration
          };
      }));
  };

  const handleExport = async (settings: ExportSettings) => {
    setIsExportOpen(false);
    setIsRendering(true);
    setRenderProgress(0);

    try {
        const projectData: ProjectData = {
            version: "1.0.0",
            meta: {
                created: new Date().toISOString(),
                appName: APP_NAME,
                exportSettings: settings
            },
            timeline: {
                tracks: tracks,
                clips: clips
            }
        };

        const videoBlob = await renderProject(projectData, (progress) => {
            setRenderProgress(progress);
        });

        setRenderProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.name.replace(/\s+/g, '_')}.${settings.format || 'mp4'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Export failed:", error);
        alert("Export failed. See console for details.");
    } finally {
        setIsRendering(false);
    }
  };

  const selectedIdsArray = Array.from(selectedClipIds);
  const primarySelectedId = selectedIdsArray.length > 0 ? selectedIdsArray[selectedIdsArray.length - 1] : null;
  const primarySelectedClip = clips.find(c => c.id === primarySelectedId) || null;

  const projectDuration = clips.length > 0 ? Math.max(...clips.map(c => c.startOffset + c.duration)) : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#171717] text-gray-300 overflow-hidden font-sans">
      
      <Header 
        onExport={() => setIsExportOpen(true)} 
        onSave={handleSaveProject}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      <div className="flex-1 flex min-h-0 border-b border-[#2a2a2a]">
        
        <div className="w-[340px] shrink-0 bg-[#171717] border-r border-[#2a2a2a]">
           <Sidebar 
              onOpenTTS={() => setIsTTSOpen(true)}
              onOpenImageGen={() => setIsImageGenOpen(true)}
              onImportFiles={handleImportFiles}
              onAddPexelsVideo={handleAddPexelsVideo}
              onAddText={handleAddText}
              onImportSRT={handleImportSRT}
           />
        </div>

        <PreviewArea 
            selectedClip={primarySelectedClip} 
            onTimeUpdate={setCurrentTime}
            currentTime={currentTime}
            tracks={tracks}
        />

        <PropertiesPanel 
          selectedClip={primarySelectedClip} 
          selectionCount={selectedClipIds.size}
          onUpdateClip={updateClip}
        />

      </div>

      <div className="h-[35%] shrink-0">
        <Timeline 
          tracks={tracks}
          clips={clips}
          onSelectClip={handleClipSelect}
          selectedClipIds={selectedClipIds}
          onMoveClip={moveClip}
          currentTime={currentTime}
          onSplitClip={splitClip}
          onSeek={setCurrentTime}
          onTrimClip={trimClip}
          onToggleTrackProp={toggleTrackProperty}
        />
      </div>

      {/* Kept Modal for potential future use, but not triggered by default sidebar UI anymore */}
      <PexelsModal 
        isOpen={isPexelsOpen} 
        onClose={() => setIsPexelsOpen(false)}
        onAddVideos={handleAddVideos}
      />

      <TTSModal
        isOpen={isTTSOpen}
        onClose={() => setIsTTSOpen(false)}
        onAddAudio={handleAddAudio}
      />

      <ImageGenModal
        isOpen={isImageGenOpen}
        onClose={() => setIsImageGenOpen(false)}
        onAddImage={handleAddImage}
      />

      <ExportModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        duration={projectDuration}
      />

      <RenderingModal
        isOpen={isRendering}
        progress={renderProgress}
      />
    </div>
  );
};

export default App;
