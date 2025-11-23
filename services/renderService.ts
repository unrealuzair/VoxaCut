
import { ProjectData, Clip } from '../types';

// Helper: Load Image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
};

// Helper: Load Video
// Note: We place videos in a hidden container with specific styles to trick the browser
// into decoding them smoothly even when "hidden".
const prepareVideo = (src: string, container: HTMLElement): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = "anonymous";
        video.src = src;
        video.muted = true; // Mute video element, we use WebAudio for sound
        video.preload = "auto";
        video.playsInline = true;
        
        // HIGH-PRIORITY VISIBILITY HACK
        // Position fixed at top left, on top of everything (Z-9999)
        // but ensure it has dimensions so layout engine processes it.
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '640px'; // Standard SD width to ensure decoding
        video.style.height = '360px';
        video.style.opacity = '1'; // Fully opaque to browser logic
        video.style.visibility = 'visible'; 
        video.style.pointerEvents = 'none';
        // Note: The container itself will be masked with a Z-Index overlay in the main function
        
        container.appendChild(video);

        video.onloadedmetadata = () => {
            resolve(video);
        };
        video.onerror = (err) => {
            console.error(`Failed to load video: ${src}`, err);
            reject(err);
        };
    });
};

// Helper: Load & Decode Audio
const loadAudioBuffer = async (ctx: AudioContext, src: string): Promise<AudioBuffer> => {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
};

export const renderProject = async (
    project: ProjectData,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    const { timeline, meta } = project;
    const settings = meta.exportSettings;
    const fps = parseInt(settings.frameRate) || 30;
    
    // 1. Calculate Resolution
    let width = 1920;
    let height = 1080;
    
    switch(settings.resolution) {
        case '4k': width = 3840; height = 2160; break;
        case '2k': width = 2560; height = 1440; break;
        case '1080p': width = 1920; height = 1080; break;
        case '720p': width = 1280; height = 720; break;
        case '480p': width = 854; height = 480; break;
    }

    // 2. Determine Bitrate based on Quality (Strict Cap)
    let targetBitrate = 5000000; // 5Mbps default (Standard)
    if (settings.quality === 'High') targetBitrate = 8000000;
    if (settings.quality === 'Web') targetBitrate = 2500000;

    // 3. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false }); // Alpha false optimized for video
    if (!ctx) throw new Error("Could not get canvas context");

    // 4. Setup DOM Container for "Hidden" Videos
    const renderContainer = document.createElement('div');
    renderContainer.style.position = 'fixed';
    renderContainer.style.top = '0';
    renderContainer.style.left = '0';
    renderContainer.style.width = '10px'; // Minimal footprint
    renderContainer.style.height = '10px';
    renderContainer.style.zIndex = '9999';
    renderContainer.style.background = '#000';
    document.body.appendChild(renderContainer);

    // Visual Mask (so user doesn't see flashing videos)
    const mask = document.createElement('div');
    mask.style.position = 'absolute';
    mask.style.inset = '0';
    mask.style.background = '#171717';
    mask.style.zIndex = '10000';
    mask.innerHTML = '<div style="color:white; padding: 4px; font-size: 10px;">Rendering...</div>';
    renderContainer.appendChild(mask);

    const videoContainer = document.createElement('div');
    renderContainer.appendChild(videoContainer);

    // 5. Setup Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();
    
    // 6. Load Assets
    const clips = timeline.clips;
    const duration = Math.max(...clips.map(c => c.startOffset + c.duration)) || 5;
    const loadedAssets = new Map<string, HTMLImageElement | HTMLVideoElement | AudioBuffer>();
    
    let loadedCount = 0;
    for (const clip of clips) {
        try {
            if (clip.type === 'image') {
                const img = await loadImage(clip.src);
                loadedAssets.set(clip.id, img);
            } else if (clip.type === 'video') {
                const vid = await prepareVideo(clip.src, videoContainer);
                loadedAssets.set(clip.id, vid);
                
                // Audio routing for video files
                const source = audioCtx.createMediaElementSource(vid);
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = clip.volume / 100;
                source.connect(gainNode);
                gainNode.connect(dest);
            } else if (clip.type === 'audio') {
                const buf = await loadAudioBuffer(audioCtx, clip.src);
                loadedAssets.set(clip.id, buf);
            }
        } catch (e) {
            console.warn(`Failed to load asset ${clip.id}`, e);
        }
        loadedCount++;
        onProgress(Math.round((loadedCount / clips.length) * 10)); 
    }

    // 7. Prepare Audio Buffer Source for TTS/Music clips
    // We schedule them all now on the WebAudio timeline
    clips.forEach(clip => {
        if (clip.type === 'audio') {
            const buffer = loadedAssets.get(clip.id);
            if (buffer instanceof AudioBuffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.start(audioCtx.currentTime + clip.startOffset, clip.mediaStartOffset, clip.duration);
                
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = clip.volume / 100;
                source.connect(gainNode);
                gainNode.connect(dest);
            }
        }
    });

    // 8. Setup MediaRecorder with Strict Profiles
    const stream = canvas.captureStream(fps);
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) stream.addTrack(audioTrack);

    // Codec Selection Strategy:
    // 1. Main Profile (avc1.4D401F) -> Best for compatibility/quality
    // 2. High Profile (avc1.64001F) -> High compression
    // 3. Baseline (avc1.42E01E) -> Max compatibility
    // 4. Default mp4/webm
    const supportedMimeTypes = [
        'video/mp4; codecs="avc1.4D401F"', // Main Profile Level 3.1
        'video/mp4; codecs="avc1.64001F"', // High Profile
        'video/mp4; codecs="avc1.42E01E"', // Baseline
        'video/mp4',
        'video/webm; codecs=vp9'
    ];

    const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    console.log(`Rendering with MimeType: ${mimeType} at ${targetBitrate} bps`);

    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
            document.body.removeChild(renderContainer);
            audioCtx.close();
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
        };
        recorder.onerror = (e) => {
             document.body.removeChild(renderContainer);
             audioCtx.close();
             reject(e);
        };
    });

    recorder.start(1000); // Timeslice 1s to manage memory

    // 9. Render Loop (Strict Sync)
    const startAudioTime = audioCtx.currentTime;
    let isRunning = true;

    // Force all videos to pause initially
    clips.forEach(c => {
        if(c.type === 'video') {
            const v = loadedAssets.get(c.id) as HTMLVideoElement;
            if(v && !v.paused) v.pause();
        }
    });

    const renderLoop = async () => {
        if (!isRunning) return;

        const elapsed = audioCtx.currentTime - startAudioTime;
        
        if (elapsed >= duration + 0.5) { // 0.5s buffer at end
            isRunning = false;
            recorder.requestData(); // Flush buffer
            recorder.stop();
            return;
        }

        // Clear Canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        let isBuffering = false;

        // Draw Loop
        for (const clip of clips) {
            if (elapsed >= clip.startOffset && elapsed < clip.startOffset + clip.duration) {
                const asset = loadedAssets.get(clip.id);
                if (!asset) continue;

                // Transform Context
                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.translate(clip.style.position.x, clip.style.position.y);
                ctx.rotate(clip.style.rotation * Math.PI / 180);
                ctx.scale(clip.style.scale / 100, clip.style.scale / 100);
                ctx.globalAlpha = clip.style.opacity;
                ctx.filter = `brightness(${clip.filter.brightness}%) contrast(${clip.filter.contrast}%) saturate(${clip.filter.saturation}%) grayscale(${clip.filter.grayscale}%)`;

                if (clip.type === 'image' && asset instanceof HTMLImageElement) {
                    const imgAspectRatio = asset.width / asset.height;
                    const drawH = height;
                    const drawW = height * imgAspectRatio;
                    ctx.drawImage(asset, -drawW/2, -drawH/2, drawW, drawH);

                } else if (clip.type === 'video' && asset instanceof HTMLVideoElement) {
                    // VIDEO SYNC LOGIC
                    const targetTime = clip.mediaStartOffset + (elapsed - clip.startOffset);
                    
                    // Check readiness
                    if (asset.readyState < 2) {
                        // Video not ready? PAUSE RECORDING and wait
                        isBuffering = true;
                        if (!asset.paused) asset.pause();
                    } else {
                        // Sync Check
                        const diff = Math.abs(asset.currentTime - targetTime);
                        
                        // If slight drift, adjust playback rate to catch up smoothly
                        if (diff > 0.05 && diff < 0.5) {
                            asset.playbackRate = asset.currentTime < targetTime ? 1.1 : 0.9;
                        } else {
                            asset.playbackRate = 1.0;
                        }

                        // If major drift, seek (but this causes buffering usually)
                        if (diff >= 0.5) {
                            asset.currentTime = targetTime;
                            isBuffering = true; // Wait for seek to complete
                        }

                        if (asset.paused && !isBuffering) {
                            asset.play().catch(() => {});
                        }
                        
                        // Draw current frame
                        const vidAspectRatio = asset.videoWidth / asset.videoHeight;
                        const drawH = height;
                        const drawW = height * vidAspectRatio;
                        ctx.drawImage(asset, -drawW/2, -drawH/2, drawW, drawH);
                    }
                }
                ctx.restore();
            } else {
                // Pause inactive videos
                if (clip.type === 'video') {
                    const v = loadedAssets.get(clip.id) as HTMLVideoElement;
                    if(v && !v.paused) v.pause();
                }
            }
        }

        // PAUSE LOGIC: If any video is buffering/seeking, pause the recorder and audio context
        if (isBuffering) {
            recorder.pause();
            audioCtx.suspend();
            // Wait 100ms and check again
            setTimeout(() => {
                audioCtx.resume();
                recorder.resume();
                requestAnimationFrame(renderLoop);
            }, 100);
            return; // Skip this frame loop
        }

        // Update Progress
        const percent = 10 + Math.round((elapsed / duration) * 90);
        onProgress(Math.min(99, percent));

        requestAnimationFrame(renderLoop);
    };

    // Start Render Loop
    renderLoop();

    return recordingPromise;
};
