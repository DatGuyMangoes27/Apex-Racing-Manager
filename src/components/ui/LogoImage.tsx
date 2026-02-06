import { useState } from 'react'
import clsx from 'clsx'

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type LogoShape = 'square' | 'rounded' | 'circle' | 'badge'

interface LogoImageProps {
  /** Path to the logo image */
  src?: string
  /** Name for generating fallback text */
  name: string
  /** Alt text (defaults to name) */
  alt?: string
  /** Size of the logo */
  size?: LogoSize
  /** Shape of the container */
  shape?: LogoShape
  /** Additional CSS classes */
  className?: string
  /** Whether to show a background */
  showBackground?: boolean
  /** Background color for fallback (CSS color or Tailwind class) */
  backgroundColor?: string
  /** Text color for fallback */
  textColor?: string
  /** Whether the logo is clickable */
  onClick?: () => void
}

const sizeStyles: Record<LogoSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[8px]' },
  sm: { container: 'w-8 h-8', text: 'text-[10px]' },
  md: { container: 'w-10 h-10', text: 'text-xs' },
  lg: { container: 'w-12 h-12', text: 'text-sm' },
  xl: { container: 'w-16 h-16', text: 'text-base' },
  '2xl': { container: 'w-24 h-24', text: 'text-lg' }
}

const shapeStyles: Record<LogoShape, string> = {
  square: 'rounded-none',
  rounded: 'rounded-lg',
  circle: 'rounded-full',
  badge: 'rounded-md'
}

/**
 * Generate abbreviated text from a name
 */
function getAbbreviation(name: string, maxChars: number = 3): string {
  if (!name) return '?'
  
  const parts = name.split(/[\s-]+/).filter(Boolean)
  
  // If single word, take first 2-3 chars
  if (parts.length === 1) {
    return parts[0].substring(0, maxChars).toUpperCase()
  }
  
  // Take first letter of each word (up to maxChars)
  return parts
    .slice(0, maxChars)
    .map(p => p[0])
    .join('')
    .toUpperCase()
}

/**
 * Generate a consistent color based on name
 */
function getBackgroundColorClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    'bg-red-700',
    'bg-orange-700',
    'bg-amber-700',
    'bg-yellow-700',
    'bg-lime-700',
    'bg-green-700',
    'bg-emerald-700',
    'bg-teal-700',
    'bg-cyan-700',
    'bg-sky-700',
    'bg-blue-700',
    'bg-indigo-700',
    'bg-violet-700',
    'bg-purple-700',
    'bg-fuchsia-700',
    'bg-pink-700'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Logo image component with fallback to text badge
 */
export function LogoImage({
  src,
  name,
  alt,
  size = 'md',
  shape = 'rounded',
  className,
  showBackground = true,
  backgroundColor,
  textColor = 'text-white',
  onClick
}: LogoImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const showImage = src && !imageError
  const abbreviation = getAbbreviation(name)
  const bgClass = backgroundColor?.startsWith('bg-') 
    ? backgroundColor 
    : getBackgroundColorClass(name)
  
  const handleImageError = () => {
    setImageError(true)
  }
  
  const handleImageLoad = () => {
    setImageLoaded(true)
  }
  
  const containerClasses = clsx(
    'relative overflow-hidden flex items-center justify-center flex-shrink-0',
    sizeStyles[size].container,
    shapeStyles[shape],
    showBackground && 'bg-surface-secondary',
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  )
  
  const customBgStyle = backgroundColor && !backgroundColor.startsWith('bg-') 
    ? { backgroundColor } 
    : undefined
  
  return (
    <div 
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Fallback badge */}
      <div 
        className={clsx(
          'absolute inset-0 flex items-center justify-center font-bold',
          sizeStyles[size].text,
          bgClass,
          textColor,
          showImage && imageLoaded && 'opacity-0'
        )}
        style={customBgStyle}
      >
        {abbreviation}
      </div>
      
      {/* Actual image */}
      {showImage && (
        <img
          src={src}
          alt={alt || name}
          className={clsx(
            'absolute inset-0 w-full h-full object-contain p-1 transition-opacity duration-200',
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
 * Team logo variant
 */
interface TeamLogoProps {
  src?: string
  name: string
  primaryColor?: string
  size?: LogoSize
  className?: string
  onClick?: () => void
}

export function TeamLogo({
  src,
  name,
  primaryColor,
  size = 'md',
  className,
  onClick
}: TeamLogoProps) {
  return (
    <LogoImage
      src={src}
      name={name}
      size={size}
      shape="rounded"
      backgroundColor={primaryColor}
      className={className}
      onClick={onClick}
    />
  )
}

/**
 * Manufacturer badge variant
 */
interface ManufacturerBadgeProps {
  src?: string
  name: string
  size?: LogoSize
  className?: string
}

export function ManufacturerBadge({
  src,
  name,
  size = 'md',
  className
}: ManufacturerBadgeProps) {
  return (
    <LogoImage
      src={src}
      name={name}
      size={size}
      shape="badge"
      className={className}
    />
  )
}

/**
 * Sponsor logo variant (typically wider)
 */
interface SponsorLogoProps {
  src?: string
  name: string
  className?: string
  height?: 'sm' | 'md' | 'lg'
}

const sponsorHeights: Record<string, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12'
}

export function SponsorLogo({
  src,
  name,
  className,
  height = 'md'
}: SponsorLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const showImage = src && !imageError
  
  if (!showImage) {
    // Show text fallback
    return (
      <span className={clsx(
        'inline-flex items-center px-2 py-1 bg-surface-secondary rounded text-xs font-medium text-text-secondary',
        className
      )}>
        {name}
      </span>
    )
  }
  
  return (
    <img
      src={src}
      alt={name}
      className={clsx(
        sponsorHeights[height],
        'w-auto object-contain transition-opacity duration-200',
        !imageLoaded && 'opacity-0',
        className
      )}
      onError={() => setImageError(true)}
      onLoad={() => setImageLoaded(true)}
      loading="lazy"
    />
  )
}

/**
 * Championship badge variant
 */
interface ChampionshipBadgeProps {
  src?: string
  name: string
  tier?: string
  size?: LogoSize
  className?: string
}

export function ChampionshipBadge({
  src,
  name,
  tier,
  size = 'lg',
  className
}: ChampionshipBadgeProps) {
  // Tier-based colors
  const tierColors: Record<string, string> = {
    f1: 'bg-red-600',
    premier: 'bg-amber-600',
    top: 'bg-blue-600',
    mid: 'bg-emerald-600',
    entry: 'bg-gray-600'
  }
  
  const bgColor = tier ? tierColors[tier.toLowerCase()] || 'bg-gray-600' : undefined
  
  return (
    <LogoImage
      src={src}
      name={name}
      size={size}
      shape="circle"
      backgroundColor={bgColor}
      className={className}
    />
  )
}

/**
 * Bank/Investment logo variant
 */
interface BankLogoProps {
  src?: string
  name: string
  size?: LogoSize
  className?: string
}

export function BankLogo({
  src,
  name,
  size = 'md',
  className
}: BankLogoProps) {
  return (
    <LogoImage
      src={src}
      name={name}
      size={size}
      shape="rounded"
      backgroundColor="bg-slate-700"
      className={className}
    />
  )
}
