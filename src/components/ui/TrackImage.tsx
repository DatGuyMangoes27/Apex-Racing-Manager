import { useState } from 'react'
import clsx from 'clsx'
import { getTrackImage, type TrackImageType } from '@/utils/generated-assets'

export type TrackImageSize = 'sm' | 'md' | 'lg' | 'full' | 'banner'

interface TrackImageProps {
  /** Track ID or name */
  trackId: string
  /** Type of track image */
  imageType?: TrackImageType
  /** Custom image source (overrides trackId lookup) */
  src?: string
  /** Size/aspect ratio preset */
  size?: TrackImageSize
  /** Additional CSS classes */
  className?: string
  /** Whether to show track name overlay */
  showName?: boolean
  /** Custom track name (for overlay) */
  trackName?: string
  /** Whether the image is clickable */
  onClick?: () => void
  /** Custom fallback content */
  fallback?: React.ReactNode
}

const sizeStyles: Record<TrackImageSize, string> = {
  sm: 'h-24 w-full',
  md: 'h-32 w-full',
  lg: 'h-48 w-full',
  full: 'h-64 w-full',
  banner: 'h-40 w-full'
}

/**
 * Generate a gradient based on track name for fallback
 */
function getGradientClass(trackId: string): string {
  let hash = 0
  for (let i = 0; i < trackId.length; i++) {
    hash = trackId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const gradients = [
    'bg-gradient-to-br from-slate-800 to-slate-900',
    'bg-gradient-to-br from-zinc-800 to-zinc-900',
    'bg-gradient-to-br from-stone-800 to-stone-900',
    'bg-gradient-to-br from-neutral-800 to-neutral-900',
    'bg-gradient-to-br from-gray-800 to-gray-900',
    'bg-gradient-to-br from-slate-700 to-slate-900',
    'bg-gradient-to-br from-zinc-700 to-zinc-900'
  ]
  
  return gradients[Math.abs(hash) % gradients.length]
}

/**
 * Track image component with fallback
 */
export function TrackImage({
  trackId,
  imageType = 'aerial',
  src: customSrc,
  size = 'md',
  className,
  showName = false,
  trackName,
  onClick,
  fallback
}: TrackImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Get image path from manifest or use custom src
  const imageSrc = customSrc || getTrackImage(trackId, imageType)
  const showImage = imageSrc && !imageError
  const gradientClass = getGradientClass(trackId)
  const displayName = trackName || trackId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  const containerClasses = clsx(
    'relative overflow-hidden rounded-lg',
    sizeStyles[size],
    onClick && 'cursor-pointer hover:ring-2 hover:ring-accent-primary transition-all',
    className
  )
  
  return (
    <div 
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Fallback gradient background */}
      <div className={clsx(
        'absolute inset-0 flex items-center justify-center',
        gradientClass,
        showImage && imageLoaded && 'opacity-0',
        'transition-opacity duration-300'
      )}>
        {fallback || (
          <div className="flex flex-col items-center justify-center text-text-muted">
            <svg 
              className="w-12 h-12 mb-2 opacity-30" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm opacity-50">{displayName}</span>
          </div>
        )}
      </div>
      
      {/* Actual image */}
      {showImage && (
        <img
          src={imageSrc}
          alt={displayName}
          className={clsx(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            !imageLoaded && 'opacity-0'
          )}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      )}
      
      {/* Name overlay */}
      {showName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="text-white font-medium text-sm">{displayName}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Track hero banner for race day screens
 */
interface TrackHeroProps {
  trackId: string
  trackName: string
  layoutName?: string
  countryFlag?: string
  className?: string
}

export function TrackHero({
  trackId,
  trackName,
  layoutName,
  countryFlag,
  className
}: TrackHeroProps) {
  return (
    <TrackImage
      trackId={trackId}
      imageType="grandstand"
      size="banner"
      className={className}
      fallback={
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-surface-secondary to-surface-primary">
          <div className="text-4xl mb-2">{countryFlag || '🏁'}</div>
          <div className="text-lg font-bold text-text-primary">{trackName}</div>
          {layoutName && (
            <div className="text-sm text-text-secondary">{layoutName}</div>
          )}
        </div>
      }
    />
  )
}

/**
 * Track thumbnail for lists
 */
interface TrackThumbnailProps {
  trackId: string
  trackName?: string
  size?: 'sm' | 'md'
  className?: string
  onClick?: () => void
}

export function TrackThumbnail({
  trackId,
  trackName,
  size = 'sm',
  className,
  onClick
}: TrackThumbnailProps) {
  return (
    <TrackImage
      trackId={trackId}
      imageType="aerial"
      size={size}
      trackName={trackName}
      className={clsx('aspect-video', className)}
      onClick={onClick}
    />
  )
}
