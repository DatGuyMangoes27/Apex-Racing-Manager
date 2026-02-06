/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Racing Theme
        background: {
          DEFAULT: '#0D0D0F',
          secondary: '#121214',
          elevated: '#1A1A1E',
          hover: '#242428'
        },
        surface: {
          DEFAULT: '#1A1A1E',
          secondary: '#242428',
          border: '#2A2A2E'
        },
        accent: {
          red: '#E10600',
          redHover: '#FF1A14',
          orange: '#FF8000',
          orangeHover: '#FF9A2E',
          silver: '#A0A0A0',
          gold: '#FFD700'
        },
        status: {
          success: '#00D26A',
          warning: '#FFB800',
          danger: '#FF3B30',
          info: '#007AFF'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#6B6B6B',
          disabled: '#4A4A4A'
        }
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundImage: {
        'carbon-fiber': "url('/textures/carbon-fiber.png')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-racing': 'linear-gradient(135deg, #E10600 0%, #0D0D0F 50%, #0D0D0F 100%)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(225, 6, 0, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(225, 6, 0, 0.6)' }
        }
      },
      boxShadow: {
        'racing': '0 0 20px rgba(225, 6, 0, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [],
}


