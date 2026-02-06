import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore, VideoContext } from '@/store/settingsStore'

// Video sources for different contexts
// In production, these would be actual video files in the assets folder
const _VIDEO_SOURCES: Record<VideoContext, string> = {
  home: '/videos/paddock-timelapse.mp4',
  calendar: '/videos/aerial-circuit.mp4',
  raceday: '/videos/onboard-loop.mp4',
  garage: '/videos/workshop.mp4',
  finances: '/videos/office.mp4',
  media: '/videos/press-room.mp4',
  training: '/videos/gym.mp4',
  contracts: '/videos/team-facility.mp4',
  stats: '/videos/data-room.mp4',
  personal: '/videos/lifestyle.mp4'
}

// Fallback animated gradients when videos aren't available
const GRADIENT_BACKGROUNDS: Record<VideoContext, string> = {
  home: 'from-background via-surface to-background',
  calendar: 'from-blue-950/30 via-background to-background',
  raceday: 'from-accent-red/10 via-background to-background',
  garage: 'from-amber-950/20 via-background to-background',
  finances: 'from-emerald-950/20 via-background to-background',
  media: 'from-purple-950/20 via-background to-background',
  training: 'from-orange-950/20 via-background to-background',
  contracts: 'from-cyan-950/20 via-background to-background',
  stats: 'from-indigo-950/20 via-background to-background',
  personal: 'from-rose-950/20 via-background to-background'
}

export function VideoBackground() {
  const { videoBackgroundsEnabled, currentVideoContext, reducedMotion } = useSettingsStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [useGradientFallback, setUseGradientFallback] = useState(true)

  useEffect(() => {
    // For now, use gradient fallback since we don't have actual videos yet
    setUseGradientFallback(true)
    
    // When videos are added, uncomment this:
    // const video = videoRef.current
    // if (video && videoBackgroundsEnabled && !reducedMotion) {
    //   video.src = VIDEO_SOURCES[currentVideoContext]
    //   video.load()
    //   video.play().catch(() => setUseGradientFallback(true))
    // }
  }, [currentVideoContext, videoBackgroundsEnabled, reducedMotion])

  if (!videoBackgroundsEnabled && !reducedMotion) {
    return <StaticBackground />
  }

  return (
    <div className="video-background">
      <AnimatePresence mode="wait">
        {useGradientFallback ? (
          <motion.div
            key={currentVideoContext}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <AnimatedGradientBackground context={currentVideoContext} />
          </motion.div>
        ) : (
          <motion.video
            key={currentVideoContext}
            ref={videoRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: videoLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background/95" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 grid-dots opacity-30" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/50" />
    </div>
  )
}

function StaticBackground() {
  return (
    <div className="video-background">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 grid-dots opacity-20" />
    </div>
  )
}

function AnimatedGradientBackground({ context }: { context: VideoContext }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_BACKGROUNDS[context]}`} />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
        style={{
          background: context === 'raceday' 
            ? 'radial-gradient(circle, rgba(225,6,0,0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,128,0,0.2) 0%, transparent 70%)'
        }}
        animate={{
          x: ['-20%', '10%', '-20%'],
          y: ['-20%', '20%', '-20%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      <motion.div
        className="absolute right-0 bottom-0 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0,122,255,0.3) 0%, transparent 70%)'
        }}
        animate={{
          x: ['20%', '-10%', '20%'],
          y: ['20%', '-10%', '20%'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {/* Racing lines effect for race day */}
      {context === 'raceday' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-accent-red/30 to-transparent"
              style={{
                top: `${20 + i * 15}%`,
                left: '-100%',
                right: '-100%',
              }}
              animate={{
                x: ['0%', '100%'],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* Data streams for stats screen */}
      {context === 'stats' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px bg-gradient-to-b from-transparent via-status-info/20 to-transparent"
              style={{
                left: `${10 + i * 10}%`,
                top: '-100%',
                bottom: '-100%',
              }}
              animate={{
                y: ['0%', '100%'],
              }}
              transition={{
                duration: 5 + i * 0.3,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
