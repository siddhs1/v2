import React, { useRef, useState, useEffect } from "react";

const formatTime = (time) => {
  if (isNaN(time)) return "0:00";
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};

const VideoPlayer = ({ src, poster, title }) => {
  console.log("VideoPlayer src", src);
  // Refs for key elements
  const videoContainerRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const mainVideoRef = useRef(null);
  const progressAreaRef = useRef(null);
  const progressBarRef = useRef(null);
  const bufferedBarRef = useRef(null);
  const volumeRangeRef = useRef(null);
  const controlsRef = useRef(null);
  const captionTextRef = useRef(null);

  // State variables for player status
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualityLevel, setQualityLevel] = useState("auto");
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);
  const [timeTooltipPosition, setTimeTooltipPosition] = useState({ x: 0, time: 0 });
  const [controlsTimeout, setControlsTimeout] = useState(null);

  // Hide controls after inactivity
  const hideControlsTimeout = () => {
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      setControlsTimeout(timeout);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    hideControlsTimeout();
  };

  // --- Video event listeners using useEffect ---
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => setDuration(video.duration);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        const progressWidth = (video.currentTime / video.duration) * 100;
        setProgressWidth(`${progressWidth}%`);
        progressBarRef.current.style.width = `${progressWidth}%`;
      }
    };
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    const handlePipChange = () => {
      setIsPipActive(document.pictureInPictureElement === video);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    video.addEventListener("enterpictureinpicture", handlePipChange);
    video.addEventListener("leavepictureinpicture", handlePipChange);

    // // Container mouse events for controls
    // const container = videoContainerRef.current;
    // container.addEventListener("mousemove", handleMouseMove);
    
    // // Initial timeout for hiding controls
    // hideControlsTimeout();

    // return () => {
    //   video.removeEventListener("play", handlePlay);
    //   video.removeEventListener("pause", handlePause);
    //   video.removeEventListener("loadeddata", handleLoadedData);
    //   video.removeEventListener("timeupdate", handleTimeUpdate);
    //   document.removeEventListener("fullscreenchange", handleFullscreenChange);
    //   video.removeEventListener("enterpictureinpicture", handlePipChange);
    //   video.removeEventListener("leavepictureinpicture", handlePipChange);
    //   container.removeEventListener("mousemove", handleMouseMove);
      
    //   if (controlsTimeout) {
    //     clearTimeout(controlsTimeout);
    //   }
    // };
  }, [isPlaying, controlsTimeout]);

  // --- Draw the buffered bar on the canvas ---
  useEffect(() => {
    const video = mainVideoRef.current;
    const canvas = bufferedBarRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    // Set the canvas dimensions (adjust if needed)
    canvas.width = progressAreaRef.current?.clientWidth;
    canvas.height = progressAreaRef.current?.clientHeight;

    const drawBuffered = () => {
      if (!video.duration) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffffe6";
      for (let i = 0; i < video.buffered.length; i++) {
        const start = video.buffered.start(i);
        const end = video.buffered.end(i);
        const x = (start / video.duration) * canvas.width;
        const w = ((end - start) / video.duration) * canvas.width;
        context.fillRect(x, 0, w, canvas.height);
      }
    };

    video.addEventListener("progress", drawBuffered);
    window.addEventListener("resize", () => {
      canvas.width = progressAreaRef.current?.clientWidth;
      drawBuffered();
    });
    
    return () => {
      video.removeEventListener("progress", drawBuffered);
      window.removeEventListener("resize", () => {
        canvas.width = progressAreaRef.current?.clientWidth;
        drawBuffered();
      });
    };
  }, [duration, progressAreaRef, mainVideoRef]);

  // --- Player control handlers ---
  const handlePlayPause = () => {
    const video = mainVideoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleFastRewind = () => {
    mainVideoRef.current.currentTime = Math.max(
      0,
      mainVideoRef.current.currentTime - 10
    );
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleFastForward = () => {
    mainVideoRef.current.currentTime = Math.min(
      duration,
      mainVideoRef.current.currentTime + 10
    );
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    mainVideoRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (mainVideoRef.current.volume > 0) {
      mainVideoRef.current.volume = 0;
      volumeRangeRef.current.value = 0;
      setVolume(0);
    } else {
      mainVideoRef.current.volume = 0.8;
      volumeRangeRef.current.value = 80;
      setVolume(0.8);
    }
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleProgressHover = (e) => {
    const progressArea = progressAreaRef.current;
    const rect = progressArea.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const time = duration * percentage;
    
    setTimeTooltipPosition({
      x: offsetX,
      time: time
    });
    setShowTimeTooltip(true);
  };

  const handleProgressLeave = () => {
    setShowTimeTooltip(false);
  };

  const handleProgressClick = (e) => {
    const progressArea = progressAreaRef.current;
    const rect = progressArea.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newTime = (offsetX / rect.width) * duration;
    mainVideoRef.current.currentTime = newTime;
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleFullScreen = () => {
    const container = videoContainerRef.current;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
    
    setShowControls(true);
    hideControlsTimeout();
  };

  const handlePictureInPicture = async () => {
    const video = mainVideoRef.current;
    
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (video.requestPictureInPicture) {
      try {
        await video.requestPictureInPicture();
      } catch (error) {
        console.error("Picture-in-Picture error:", error);
      }
    }
    
    setShowControls(true);
    hideControlsTimeout();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      // Clear any existing timeout if needed.
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 2000); // 2 seconds delay
      setControlsTimeout(timeout);
    }
  };
  
  
  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setShowControls(true);
    if (!isSettingsOpen) {
      clearTimeout(controlsTimeout);
    } else {
      hideControlsTimeout();
    }
  };
  
  const handleSpeedChange = (speed) => {
    const video = mainVideoRef.current;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSettingsOpen(false);
    hideControlsTimeout();
  };
  
  const handleQualityChange = (quality) => {
    // This would normally switch video quality
    // For this example we'll just update the state
    setQualityLevel(quality);
    setIsSettingsOpen(false);
    hideControlsTimeout();
  };

  return (
         <div 
       className="video-container relative bg-black w-full max-w-5xl mx-auto rounded-lg overflow-hidden shadow-xl" 
       ref={videoContainerRef}
       onMouseMove={handleMouseMove}
       onMouseLeave={handleMouseLeave}
     >
      {/* Loader (hidden by default) */}
      <div className="loader absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      {/* Video element without native controls */}
      <video 
        className="main-video w-full h-full cursor-pointer outline-none"
        ref={mainVideoRef}
        controls={false}
        poster={poster}
        onClick={handlePlayPause}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Caption text */}
      <p className={`caption-text absolute left-1/2 transform -translate-x-1/2 text-center bottom-16 transition-all duration-300 user-select-none pointer-events-none max-w-[90%] ${showControls ? 'opacity-100' : 'opacity-0'}`} ref={captionTextRef}></p>

      {/* Progress time tooltip */}
      {showTimeTooltip && (
        <div 
          className="progress-tooltip absolute bottom-[60px] bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm transform -translate-x-1/2 pointer-events-none"
          style={{ left: `${timeTooltipPosition.x}px` }}
        >
          {formatTime(timeTooltipPosition.time)}
        </div>
      )}

      {/* Player Controls */}
      <div 
        className={`controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent bg-opacity-70 transition-all duration-300 pt-10 px-4 pb-2 z-10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        ref={controlsRef}
      >
        <div
          className="progress-area relative h-1.5 bg-gray-500 bg-opacity-50 cursor-pointer mb-2 rounded-full"
          ref={progressAreaRef}
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          <canvas className="buffered-bar absolute top-0 left-0 h-full w-full" ref={bufferedBarRef}></canvas>
          <div className="progress-bar relative h-full bg-purple-600 rounded-full group" ref={progressBarRef} style={{ width: progressWidth }}>
            <span className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full transition-opacity"></span>
          </div>
        </div>

        <div className="controls-list flex justify-between items-center">
          <div className="controls-left flex items-center">
            <button
              className="icon p-1.5 text-white hover:text-purple-400 transition-colors"
              onClick={handleFastRewind}
              title="Rewind 10 seconds"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              className="icon p-1.5 text-white hover:text-purple-400 transition-colors"
              onClick={handlePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            <button
              className="icon p-1.5 text-white hover:text-purple-400 transition-colors"
              onClick={handleFastForward}
              title="Forward 10 seconds"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            <div className="volume-container flex items-center group">
              <button
                className="icon p-1.5 text-white hover:text-purple-400 transition-colors"
                onClick={toggleMute}
                title="Volume"
              >
                {volume === 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                className="volume-range w-0 group-hover:w-16 transition-all duration-300 bg-gray-400 rounded-full outline-none appearance-none h-1 mx-2"
                ref={volumeRangeRef}
                onChange={handleVolumeChange}
                defaultValue={80}
                style={{
                  background: `linear-gradient(to right, #9333ea ${volume * 100}%, #9ca3af ${volume * 100}%)`
                }}
              />
            </div>

            <div className="timer text-sm text-white ml-2">
              <span className="current">{formatTime(currentTime)}</span> / 
              <span className="duration ml-1">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right flex items-center">
            {/* Settings Button */}
            <div className="relative">
              <button
                className={`icon p-1.5 text-white hover:text-purple-400 transition-colors ${isSettingsOpen ? 'text-purple-400' : ''}`}
                onClick={toggleSettings}
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-300 ${isSettingsOpen ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {/* Settings Panel */}
              {isSettingsOpen && (
                <div className="settings absolute right-0 bottom-12 bg-black bg-opacity-90 rounded-md shadow-lg min-w-[180px] z-20">
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-white text-sm font-medium">Playback Speed</p>
                    <div className="mt-2 space-y-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button 
                          key={speed} 
                          className={`block w-full text-left px-3 py-1.5 text-sm rounded ${playbackSpeed === speed ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                          onClick={() => handleSpeedChange(speed)}
                        >
                          {speed === 1 ? 'Normal' : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-white text-sm font-medium">Quality</p>
                    <div className="mt-2 space-y-1">
                      {['auto', '1080p', '720p', '480p', '360p'].map((quality) => (
                        <button 
                          key={quality} 
                          className={`block w-full text-left px-3 py-1.5 text-sm rounded ${qualityLevel === quality ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                          onClick={() => handleQualityChange(quality)}
                        >
                          {quality === 'auto' ? 'Auto' : quality}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className={`icon p-1.5 text-white hover:text-purple-400 transition-colors ${isPipActive ? 'text-purple-400' : ''}`}
              onClick={handlePictureInPicture}
              title="Picture-in-Picture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </button>

            <button
              className={`icon p-1.5 text-white hover:text-purple-400 transition-colors ${isFullscreen ? 'text-purple-400' : ''}`}
              onClick={handleFullScreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4H4v5h5zm0 6H4v5h5v-5zm6 0v5h5v-5h-5zm0-6h5V4h-5v5z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Play button overlay in the center (visible when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="w-20 h-20 rounded-full bg-black bg-opacity-60 flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
            onClick={handlePlayPause}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Video title (shown briefly on load or hover) */}
      {title && (
        <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent text-white transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;