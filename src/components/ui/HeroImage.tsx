import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FALLBACK_IMAGE } from '../../data/stock-images'

// ============================================
// TYPES
// ============================================

export interface HeroImageProps {
  src: string
  alt?: string
  className?: string
  height?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  overlay?: 'none' | 'light' | 'medium' | 'dark' | 'gradient' | 'vignette' | 'dramatic'
  overlayDirection?: 'top' | 'bottom' | 'left' | 'right' | 'radial'
  children?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  priority?: boolean
  blur?: boolean
  parallax?: boolean
  fallbackSrc?: string
}

// ============================================
// OVERLAY STYLES
// ============================================

const OVERLAY_STYLES: Record<string, string> = {
  none: '',
  light: 'bg-black/20',
  medium: 'bg-black/40',
  dark: 'bg-black/60',
  gradient: '',
  vignette: '',
  dramatic: 'bg-gradient-to-t from-black via-black/50 to-transparent',
}

const GRADIENT_OVERLAYS: Record<string, string> = {
  top: 'bg-gradient-to-b from-black/70 via-black/30 to-transparent',
  bottom: 'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
  left: 'bg-gradient-to-r from-black/70 via-black/30 to-transparent',
  right: 'bg-gradient-to-l from-black/70 via-black/30 to-transparent',
  radial: 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]',
}

const HEIGHT_CLASSES: Record<string, string> = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64',
  xl: 'h-80',
  full: 'h-full min-h-[200px]',
}

// ============================================
// HERO IMAGE COMPONENT
// ============================================

export const HeroImage = memo(function HeroImage({
  src,
  alt = 'Hero image',
  className = '',
  height = 'md',
  overlay = 'gradient',
  overlayDirection = 'bottom',
  children,
  onLoad,
  onError,
  priority = false,
  blur = true,
  parallax = false,
  fallbackSrc = FALLBACK_IMAGE,
}: HeroImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc)
    } else {
      setHasError(true)
    }
    onError?.()
  }, [imageSrc, fallbackSrc, onError])

  // Determine overlay class
  const getOverlayClass = () => {
    if (overlay === 'gradient') {
      return GRADIENT_OVERLAYS[overlayDirection] || GRADIENT_OVERLAYS.bottom
    }
    if (overlay === 'vignette') {
      return GRADIENT_OVERLAYS.radial
    }
    return OVERLAY_STYLES[overlay] || ''
  }

  return (
    <div
      className={`relative overflow-hidden ${HEIGHT_CLASSES[height]} ${className}`}
    >
      {/* Blur placeholder background */}
      {blur && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black animate-pulse"
        />
      )}

      {/* Main image */}
      <AnimatePresence>
        {!hasError && (
          <motion.img
            key={imageSrc}
            src={imageSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0, scale: blur ? 1.1 : 1 }}
            animate={{ 
              opacity: isLoaded ? 1 : 0, 
              scale: isLoaded ? 1 : (blur ? 1.1 : 1)
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`
              absolute inset-0 w-full h-full object-cover
              ${parallax ? 'transform-gpu' : ''}
            `}
            style={parallax ? { 
              transform: 'translateZ(0)',
              willChange: 'transform'
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
          <div className="text-zinc-600 text-sm">Image unavailable</div>
        </div>
      )}

      {/* Overlay */}
      {overlay !== 'none' && (
        <div 
          className={`absolute inset-0 pointer-events-none ${getOverlayClass()}`}
        />
      )}

      {/* Content slot */}
      {children && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 z-10">
          {children}
        </div>
      )}
    </div>
  )
})

// ============================================
// HERO CARD - Image with card styling
// ============================================

export interface HeroCardProps extends HeroImageProps {
  title?: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  onClick?: () => void
  selected?: boolean
}

export const HeroCard = memo(function HeroCard({
  title,
  subtitle,
  badge,
  badgeColor = 'bg-amber-500',
  onClick,
  selected = false,
  ...heroProps
}: HeroCardProps) {
  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        ring-2 transition-all duration-200
        ${selected ? 'ring-amber-500' : 'ring-transparent hover:ring-amber-500/50'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <HeroImage {...heroProps} overlay="gradient" overlayDirection="bottom">
        <div className="space-y-1">
          {badge && (
            <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded ${badgeColor} text-black`}>
              {badge}
            </span>
          )}
          {title && (
            <h3 className="text-lg font-bold text-white drop-shadow-lg line-clamp-2">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-zinc-300 drop-shadow-md line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </HeroImage>

      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  )
})

// ============================================
// HERO BANNER - Full width header banner
// ============================================

export interface HeroBannerProps extends Omit<HeroImageProps, 'height'> {
  title?: string
  subtitle?: string
}

export const HeroBanner = memo(function HeroBanner({
  title,
  subtitle,
  ...heroProps
}: HeroBannerProps) {
  return (
    <div className="relative -mx-4 -mt-4 mb-6">
      <HeroImage 
        {...heroProps} 
        height="lg" 
        overlay="dramatic"
        className="rounded-b-xl"
      >
        <div className="text-center pb-4">
          {title && (
            <h1 className="text-3xl font-black text-white drop-shadow-xl tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-lg text-amber-400 drop-shadow-lg mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </HeroImage>
    </div>
  )
})

// ============================================
// COMPACT HERO - For cards and smaller areas
// ============================================

export interface CompactHeroProps {
  src: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait'
  fallbackSrc?: string
}

const ASPECT_CLASSES: Record<string, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
  portrait: 'aspect-[3/4]',
}

export const CompactHero = memo(function CompactHero({
  src,
  className = '',
  aspectRatio = 'video',
  fallbackSrc = FALLBACK_IMAGE,
}: CompactHeroProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden rounded-lg ${ASPECT_CLASSES[aspectRatio]} ${className}`}>
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse" />
      )}
      
      <img
        src={imageSrc}
        alt=""
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setImageSrc(fallbackSrc)}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
      
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </div>
  )
})

// ============================================
// BACKGROUND HERO - For full-page backgrounds
// ============================================

export interface BackgroundHeroProps {
  src: string
  opacity?: number
  blur?: boolean
  children: React.ReactNode
}

export const BackgroundHero = memo(function BackgroundHero({
  src,
  opacity = 0.3,
  blur = true,
  children,
}: BackgroundHeroProps) {
  const [imageSrc, setImageSrc] = useState(src)

  return (
    <div className="relative min-h-full">
      {/* Background image */}
      <div 
        className="fixed inset-0 -z-10"
        style={{ opacity }}
      >
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          onError={() => setImageSrc(FALLBACK_IMAGE)}
          className={`w-full h-full object-cover ${blur ? 'blur-sm' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-zinc-900/80 to-zinc-900" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
})

export default HeroImage





