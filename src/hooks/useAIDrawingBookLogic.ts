// Generate and download video with static layout and confetti animation
const generateAndDownloadVideo = useCallback(async () => {
  // Check if FFmpeg is still loading
  if (ffmpegLoading) {
    setError('Video processing is still loading. Please wait a moment and try again.');
    return;
  }

  // If FFmpeg failed to load, try loading it again
  if (!ffmpegLoaded) {
    setError('Video processing not ready. Initializing...');
    try {
      await loadFFmpeg();
      if (!ffmpegLoaded) {
        setError('Failed to initialize video processing. Please refresh the page and try again.');
        return;
      }
    } catch (error) {
      setError('Failed to initialize video processing. Please refresh the page and try again.');
      return;
    }
  }

  // Double-check that FFmpeg is actually loaded
  if (!ffmpegRef.current || !ffmpegLoaded) {
    setError('Video processing not available. Please refresh the page and try again.');
    return;
  }

  if (selectedHistoryIndex === null || !history[selectedHistoryIndex]) {
    setError('Please select a drawing from your gallery first.');
    return;
  }

  if (!generatedAudioBlob) {
    setError('Please generate and play the story audio first.');
    return;
  }

  const historyItem = history[selectedHistoryIndex];
  if (!historyItem.sketch || !historyItem.generated) {
    setError('Missing required images for video generation.');
    return;
  }

  setIsGeneratingVideo(true);
  setError(null);

  try {
    const ffmpeg = ffmpegRef.current;
    
    if (!ffmpeg || !window.FFmpeg) {
      throw new Error('FFmpeg not properly initialized');
    }

    const { fetchFile } = window.FFmpeg;
    
    // Get audio duration using Web Audio API
    let audioDuration = 10; // Default fallback
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await generatedAudioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioDuration = audioBuffer.duration;
      audioContext.close();
    } catch (error) {
      console.warn('Could not get audio duration, using default:', error);
      audioDuration = Math.max(10, generatedAudioBlob.size / 16000);
    }

    // --- Create the static layout image first ---
    const layoutCanvas = document.createElement('canvas');
    layoutCanvas.width = 1280;
    layoutCanvas.height = 720;
    const layoutCtx = layoutCanvas.getContext('2d');
    
    // Fill background
    layoutCtx.fillStyle = '#1f2937';
    layoutCtx.fillRect(0, 0, 1280, 720);
    
    const loadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };
    
    const [storyImageLoaded, sketchImageLoaded, genImageLoaded] = await Promise.all([
      historyItem.storyImageBase64 ? loadImage(`data:image/png;base64,${historyItem.storyImageBase64}`) : Promise.resolve(null),
      loadImage(`data:image/png;base64,${historyItem.sketch}`),
      loadImage(`data:image/png;base64,${historyItem.generated}`)
    ]);
    
    const drawImageWithBorder = (ctx, img, x, y, width, height, borderColor, placeholderText) => {
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 6;
        ctx.strokeRect(x, y, width, height);
        if (img) {
            const padding = 12;
            const imgX = x + padding;
            const imgY = y + padding;
            const imgW = width - padding * 2;
            const imgH = height - padding * 2;
            const containerRatio = imgW / imgH;
            const imgRatio = img.width / img.height;
            let drawW, drawH, drawX, drawY;
            if (imgRatio > containerRatio) {
                drawW = imgW;
                drawH = imgW / imgRatio;
                drawX = imgX;
                drawY = imgY + (imgH - drawH) / 2;
            } else {
                drawH = imgH;
                drawW = imgH * imgRatio;
                drawX = imgX + (imgW - drawW) / 2;
                drawY = imgY;
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(placeholderText, x + width / 2, y + height / 2);
        }
    };
    
    const PADDING = 20;
    const GAP = 20;
    const CONTAINER_COUNT = 3;
    const TOTAL_GAPS_WIDTH = GAP * (CONTAINER_COUNT - 1);
    const TOTAL_CONTENT_WIDTH = layoutCanvas.width - (PADDING * 2);
    const BOX_WIDTH = (TOTAL_CONTENT_WIDTH - TOTAL_GAPS_WIDTH) / CONTAINER_COUNT;
    const BOX_HEIGHT = layoutCanvas.height - (PADDING * 2);
    const BOX_Y = PADDING;
    
    const storyX = PADDING;
    drawImageWithBorder(layoutCtx, storyImageLoaded, storyX, BOX_Y, BOX_WIDTH, BOX_HEIGHT, '#3b82f6', 'Story Image');
    const sketchX = PADDING + BOX_WIDTH + GAP;
    drawImageWithBorder(layoutCtx, sketchImageLoaded, sketchX, BOX_Y, BOX_WIDTH, BOX_HEIGHT, '#10b981', 'Sketch');
    const generatedX = PADDING + (BOX_WIDTH * 2) + (GAP * 2);
    drawImageWithBorder(layoutCtx, genImageLoaded, generatedX, BOX_Y, BOX_WIDTH, BOX_HEIGHT, '#f59e0b', 'Generated Image');

    const layoutImage = await loadImage(layoutCanvas.toDataURL());

    // --- Simple Confetti Particle System ---
    let particles = [];
    const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    const createConfettiBurst = () => {
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * 1280,
                y: -20,
                vx: (Math.random() - 0.5) * 15,
                vy: Math.random() * 10 + 5,
                size: Math.random() * 10 + 5,
                color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
                life: 120 // frames
            });
        }
    };

    const updateAndDrawParticles = (ctx) => {
        particles = particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life--;
            return p.life > 0;
        });

        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    };

    // --- Generate all frames for the video ---
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 1280;
    frameCanvas.height = 720;
    const frameCtx = frameCanvas.getContext('2d');
    const FPS = 25;
    const totalFrames = Math.ceil(audioDuration * FPS);
    let burst1Fired = false, burst2Fired = false, burst3Fired = false;

    for (let i = 0; i < totalFrames; i++) {
        const currentTime = i / FPS;
        
        // Draw the static background layout
        frameCtx.drawImage(layoutImage, 0, 0);

        // Trigger confetti bursts in the last 3 seconds
        if (audioDuration > 3) {
            if (currentTime >= audioDuration - 3 && !burst1Fired) {
                createConfettiBurst();
                burst1Fired = true;
            }
            if (currentTime >= audioDuration - 2 && !burst2Fired) {
                createConfettiBurst();
                burst2Fired = true;
            }
            if (currentTime >= audioDuration - 1 && !burst3Fired) {
                createConfettiBurst();
                burst3Fired = true;
            }
        }
        
        // Update and draw the confetti particles for this frame
        updateAndDrawParticles(frameCtx);

        // Write the frame to FFmpeg's virtual file system
        const frameBlob = await new Promise(resolve => frameCanvas.toBlob(resolve, 'image/png'));
        const frameFileName = `frame_${i.toString().padStart(5, '0')}.png`;
        ffmpeg.FS('writeFile', frameFileName, await fetchFile(frameBlob));
    }
    
    // --- FFmpeg Command ---
    // Write audio files
    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(generatedAudioBlob));
    const bgMusicUrl = "https://cdn.pixabay.com/download/audio/2025/06/20/audio_f144ebba0c.mp3?filename=babies-piano-45-seconds-362933.mp3";
    const bgMusicResponse = await fetch(bgMusicUrl);
    const bgMusicBlob = await bgMusicResponse.blob();
    ffmpeg.FS('writeFile', 'bg_music.mp3', await fetchFile(bgMusicBlob));
    
    // Create video from the generated frame sequence
    await ffmpeg.run(
      '-framerate', FPS.toString(), '-i', 'frame_%05d.png',
      '-i', 'audio.mp3',
      '-stream_loop', '-1', '-i', 'bg_music.mp3',
      '-filter_complex', `[1:a]volume=1.0[story];[2:a]volume=0.1[bg];[story][bg]amix=inputs=2:duration=first:dropout_transition=3[mixed]`,
      '-map', '0:v', '-map', '[mixed]',
      '-c:v', 'libx264', '-c:a', 'aac',
      '-pix_fmt', 'yuv420p',
      '-shortest', '-y', 'final_video.mp4'
    );
    
    // Read the output video
    const videoData = ffmpeg.FS('readFile', 'final_video.mp4');
    const videoBlob = new Blob([videoData], { type: 'video/mp4' });
    
    // Download the video
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
a.href = url;
    a.download = `ai-story-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // No need to call celebrateWithConfetti() here anymore, it's in the video!
    playWinSound();
    
  } catch (err) {
    console.error('Error generating video:', err);
    setError(err.message || 'Failed to generate video. Please try again.');
  } finally {
    setIsGeneratingVideo(false);
  }
}, [ffmpegLoaded, ffmpegLoading, loadFFmpeg, selectedHistoryIndex, history, generatedAudioBlob, playWinSound]);
 