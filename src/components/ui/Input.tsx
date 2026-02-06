import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import clsx from 'clsx'

// Text Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-background border rounded-lg text-white placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:border-accent-red',
            'transition-all duration-200',
            error 
              ? 'border-status-danger focus:ring-status-danger/50 focus:border-status-danger'
              : 'border-surface-border hover:border-text-muted',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-status-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-text-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-background border rounded-lg text-white placeholder:text-text-muted resize-none',
            'focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:border-accent-red',
            'transition-all duration-200',
            error 
              ? 'border-status-danger focus:ring-status-danger/50 focus:border-status-danger'
              : 'border-surface-border hover:border-text-muted',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-status-danger">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select
interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 bg-background border rounded-lg text-white',
            'focus:outline-none focus:ring-2 focus:ring-accent-red/50 focus:border-accent-red',
            'transition-all duration-200 cursor-pointer',
            error 
              ? 'border-status-danger focus:ring-status-danger/50 focus:border-status-danger'
              : 'border-surface-border hover:border-text-muted',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-status-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

// Slider/Range Input
interface SliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  formatValue?: (value: number) => string
}

export function Slider({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  showValue = true,
  formatValue = (v) => String(v)
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
          {showValue && <span className="text-sm font-mono text-white">{formatValue(value)}</span>}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full h-2 bg-surface-secondary rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-red 
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #E10600 0%, #E10600 ${percentage}%, #242428 ${percentage}%, #242428 100%)`
          }}
        />
      </div>
    </div>
  )
}












