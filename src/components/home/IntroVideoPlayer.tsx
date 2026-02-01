import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const IntroVideoPlayer = () => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start playback from a user gesture (mobile browsers require this)
  const handlePlayClick = async () => {
    const video = videoRef.current;

    setShowVideo(true);
    setIsLoaded(false);

    if (!video) return;

    try {
      // Keep muted by default so playback is allowed everywhere
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.log("Play blocked:", error);
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await video.play();
      setIsPlaying(true);
    } catch (error) {
      console.log("Play blocked:", error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    // Try video element fullscreen first (better mobile support)
    if ((video as any).webkitEnterFullscreen) {
      // iOS Safari
      (video as any).webkitEnterFullscreen();
    } else if ((video as any).requestFullscreen) {
      (video as any).requestFullscreen();
    } else if (containerRef.current?.requestFullscreen) {
      // Fallback to container
      containerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const nextProgress = (video.currentTime / video.duration) * 100;
    setProgress(Number.isFinite(nextProgress) ? nextProgress : 0);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const closeVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
    setIsPlaying(false);
    setProgress(0);
    setIsLoaded(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4 text-primary" />
        <h2 className="font-display font-semibold">{t("discoverIcore") || "Scopri iCore"}</h2>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-lg"
        style={{
          aspectRatio: "16/9",
          boxShadow: "0 10px 40px -10px rgba(34, 211, 238, 0.15)",
        }}
      >
        {/* Keep the <video> in the DOM so play() happens within the click gesture */}
        <video
          ref={videoRef}
          src="/videos/icore-intro.mp4"
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          preload="none"
          onLoadedData={() => setIsLoaded(true)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          poster="/videos/icore-intro-poster.webp"
        />

        {!showVideo ? (
          // Thumbnail with play button
          <div
            onClick={handlePlayClick}
            className="absolute inset-0 cursor-pointer group"
          >
            <img
              src="/videos/icore-intro-poster.webp"
              alt="iCore Intro Video"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

            {/* Play button */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
              </div>
            </motion.div>

            {/* Label */}
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-medium text-foreground">
                {t("watchVideo") || "Guarda il video"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("tapToPlay") || "Tocca per riprodurre"}
              </p>
            </div>
          </div>
        ) : (
          // Video player overlays
          <>
            {/* Loading spinner */}
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={closeVideo}
              className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all z-10"
              aria-label="Chiudi video"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background/90 to-transparent">
              {/* Progress bar */}
              <div className="w-full h-1 bg-muted/50 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                    aria-label={isPlaying ? "Pausa" : "Riproduci"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary" fill="currentColor" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                    aria-label={isMuted ? "Attiva audio" : "Disattiva audio"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-foreground" />
                    )}
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                  aria-label="Schermo intero"
                >
                  <Maximize className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {isMuted && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Audio disattivato: tocca l'icona per attivarlo
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default IntroVideoPlayer;
