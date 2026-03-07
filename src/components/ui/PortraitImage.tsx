import { useState } from 'react'
import clsx from 'clsx'

export type PortraitSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
export type PortraitVariant = 'circle' | 'card'

interface PortraitImageProps {
  /** Path to the portrait image */
  src?: string
  /** Name for generating initials fallback */
  name: string
  /** Optional country code for color generation */
  country?: string
  /** Size of the portrait */
  size?: PortraitSize
  /** Shape variant: 'circle' (default) or 'card' (rectangular, fills container) */
  variant?: PortraitVariant
  /** Additional CSS classes */
  className?: string
  /** Whether to show a border */
  bordered?: boolean
  /** Border color variant */
  borderColor?: 'default' | 'gold' | 'silver' | 'bronze' | 'team'
  /** Custom border color (CSS color) */
  customBorderColor?: string
  /** Whether the image is clickable */
  onClick?: () => void
}

const sizeStyles: Record<PortraitSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-xl',
  '3xl': 'w-40 h-40 text-2xl'
}

const borderColorStyles: Record<string, string> = {
  default: 'ring-surface-border',
  gold: 'ring-accent-gold',
  silver: 'ring-gray-400',
  bronze: 'ring-amber-600',
  team: 'ring-accent-primary'
}

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  if (!name) return '?'
  
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  // First and last name initials
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Generate a consistent color based on name/country
 */
function getBackgroundColor(name: string, country?: string): string {
  const seed = `${name}${country || ''}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Use a set of visually pleasing colors
  const colors = [
    'bg-red-600',
    'bg-orange-600',
    'bg-amber-600',
    'bg-yellow-600',
    'bg-lime-600',
    'bg-green-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-sky-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-600',
    'bg-fuchsia-600',
    'bg-pink-600',
    'bg-rose-600'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Portrait image component with circular crop and fallback to initials
 */
export function PortraitImage({
  src,
  name,
  country,
  size = 'md',
  variant = 'circle',
  className,
  bordered = false,
  borderColor = 'default',
  customBorderColor,
  onClick
}: PortraitImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const showImage = src && !imageError
  const initials = getInitials(name)
  const bgColor = getBackgroundColor(name, country)
  const isCard = variant === 'card'
  
  const handleImageError = () => {
    setImageError(true)
  }
  
  const handleImageLoad = () => {
    setImageLoaded(true)
  }
  
  const containerClasses = clsx(
    'relative overflow-hidden flex items-center justify-center flex-shrink-0',
    isCard ? 'w-full h-full rounded-xl' : 'rounded-full',
    !isCard && sizeStyles[size],
    bordered && 'ring-2',
    bordered && !customBorderColor && borderColorStyles[borderColor],
    onClick && 'cursor-pointer hover:ring-accent-primary transition-all',
    className
  )
  
  const containerStyle = customBorderColor ? { 
    '--tw-ring-color': customBorderColor 
  } as React.CSSProperties : undefined
  
  return (
    <div 
      className={containerClasses} 
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Fallback initials (always rendered, hidden when image loads) */}
      <div 
        className={clsx(
          'absolute inset-0 flex items-center justify-center font-semibold text-white',
          bgColor,
          isCard && 'text-3xl',
          showImage && imageLoaded && 'opacity-0'
        )}
      >
        {initials}
      </div>
      
      {/* Actual image */}
      {showImage && (
        <img
          src={src}
          alt={name}
          className={clsx(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-200',
            !imageLoaded && 'opacity-0'
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}
    </div>
  )
}

/**
 * Simple avatar variant for list views
 */
interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <PortraitImage
      src={src}
      name={name}
      size={size}
      className={className}
    />
  )
}

/**
 * Driver portrait with optional team color border
 */
interface DriverPortraitProps {
  src?: string
  name: string
  country?: string
  teamColor?: string
  size?: PortraitSize
  className?: string
  onClick?: () => void
}

export function DriverPortrait({
  src,
  name,
  country,
  teamColor,
  size = 'lg',
  className,
  onClick
}: DriverPortraitProps) {
  return (
    <PortraitImage
      src={src}
      name={name}
      country={country}
      size={size}
      bordered
      customBorderColor={teamColor}
      borderColor={teamColor ? undefined : 'team'}
      className={className}
      onClick={onClick}
    />
  )
}

/**
 * Staff portrait with role indicator
 */
interface StaffPortraitProps {
  src?: string
  name: string
  role?: string
  size?: PortraitSize
  className?: string
  onClick?: () => void
}

export function StaffPortrait({
  src,
  name,
  role,
  size = 'md',
  className,
  onClick
}: StaffPortraitProps) {
  return (
    <div className="relative">
      <PortraitImage
        src={src}
        name={name}
        size={size}
        bordered
        className={className}
        onClick={onClick}
      />
      {role && (
        <div className="absolute -bottom-1 -right-1 bg-surface-secondary text-[8px] text-text-secondary px-1 rounded border border-surface-border">
          {role.substring(0, 3).toUpperCase()}
        </div>
      )}
    </div>
  )
}
