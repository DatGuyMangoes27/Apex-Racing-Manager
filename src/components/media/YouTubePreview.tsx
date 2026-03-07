import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VolumeX, Volume2 } from 'lucide-react';

interface YouTubePreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  autoPlay?: boolean;
}

export function YouTubePreview({ videoUrl, thumbnailUrl, title, autoPlay = false }: YouTubePreviewProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const toggleMute = () => setIsMuted(!isMuted)

  return (
    <div 
      className="relative w-full aspect-video rounded-lg overflow-hidden bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <AnimatePresence>
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted={isMuted}
              autoPlay={autoPlay}
              loop
              playsInline
              onLoad={() => setIsLoaded(true)}
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            />
            
            {/* Controls Overlay */}
            <div className="absolute bottom-4 right-4 z-20">
              <button 
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 hover:bg-accent-red/80 transition-colors backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
