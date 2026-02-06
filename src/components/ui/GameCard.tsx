import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import clsx from 'clsx'
import { YouTubePreview } from '@/components/media/YouTubePreview'

interface GameCardProps extends Omit<HTMLMotionProps<'div'>, 'title'> {
  // Content
  title: React.ReactNode
  subtitle?: React.ReactNode
  badges?: React.ReactNode
  footer?: React.ReactNode
  
  // Media
  image?: string
  videoId?: string
  
  // State
  selected?: boolean
  disabled?: boolean
  
  // Styling
  variant?: 'default' | 'hero' | 'compact' | 'poster'
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide'
  
  // Actions
  action?: React.ReactNode
}

const aspectRatioClasses = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]'
}

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    badges, 
    footer,
    image,
    videoId,
    selected = false,
    disabled = false,
    variant = 'default',
    aspectRatio = 'video',
    action,
    children,
    onClick,
    ...props 
  }, ref) => {
    
    // Slanted border effect using clip-path could be added here, 
    // but standard rounded corners with a "tech" border often looks cleaner in motion.
    // We'll stick to the "racing" aesthetic defined in Tailwind config.

    return (
      <motion.div
        ref={ref}
        whileHover={!disabled ? { y: -4, scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        onClick={!disabled ? onClick : undefined}
        className={clsx(
          'relative overflow-hidden rounded-lg group transition-all duration-300',
          // Base background
          'bg-surface-elevated',
          // Border states
          selected 
            ? 'ring-2 ring-accent-red shadow-racing z-10' 
            : 'border border-surface-border hover:border-accent-red/50 hover:shadow-card-hover',
          disabled && 'opacity-50 cursor-not-allowed grayscale',
          onClick && !disabled && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Media Background */}
        <div className={clsx('relative w-full overflow-hidden bg-black', aspectRatioClasses[aspectRatio])}>
          {videoId ? (
            <YouTubePreview 
              videoId={videoId} 
              thumbnailUrl={image} 
              className="w-full h-full"
              autoPlayOnHover={!disabled}
            />
          ) : image ? (
            <div className="w-full h-full relative">
              <img 
                src={image} 
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
            </div>
          ) : (
            <div className="w-full h-full bg-surface-secondary flex items-center justify-center bg-carbon-fiber bg-repeat opacity-50" />
          )}
          
          {/* Overlay Content (Top) */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="flex flex-wrap gap-2">
              {badges}
            </div>
            {action && (
              <div className="pointer-events-auto">
                {action}
              </div>
            )}
          </div>
          
          {/* Overlay Content (Bottom - Hero Text) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-background to-transparent">
            <h3 className={clsx(
              'font-display font-bold uppercase tracking-wider text-white drop-shadow-md',
              variant === 'hero' ? 'text-3xl' : 'text-xl'
            )}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-text-secondary text-sm font-medium mt-1 uppercase tracking-wide">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Content Body (if children or footer exists) */}
        {(children || footer) && (
          <div className="p-4 bg-surface border-t border-surface-border relative">
            {/* Tech line decoration */}
            {selected && (
              <motion.div 
                layoutId="active-line"
                className="absolute top-0 left-0 right-0 h-0.5 bg-accent-red" 
              />
            )}
            
            {children && (
              <div className="mb-4 text-sm text-text-muted">
                {children as React.ReactNode}
              </div>
            )}
            
            {footer && (
              <div className="pt-3 mt-auto border-t border-surface-border/50 flex items-center justify-between text-xs font-mono text-text-secondary">
                {footer}
              </div>
            )}
          </div>
        )}
        
        {/* Hover Glow Effect */}
        {!disabled && !selected && (
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-accent-red/5 via-transparent to-accent-blue/5" />
        )}
      </motion.div>
    )
  }
)

GameCard.displayName = 'GameCard'
