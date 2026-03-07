/**
 * PhoneFrame - Realistic phone device frame component
 * 
 * Renders children inside a phone-shaped container with:
 * - Rounded bezel with device styling
 * - Status bar (time, signal, battery)
 * - Optional notch
 * - Subtle shadow and reflections
 */

import { type ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
  /** Current game time to display in status bar */
  gameTime?: string
  /** Signal strength 0-4 */
  signal?: number
  /** Battery percentage 0-100 */
  battery?: number
  /** Unread notification count (shown as badge) */
  notificationCount?: number
  className?: string
}

export function PhoneFrame({
  children,
  gameTime = '9:41',
  signal = 3,
  battery = 78,
  notificationCount = 0,
  className = '',
}: PhoneFrameProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Phone device */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '390px',
          height: '780px',
          borderRadius: '40px',
          border: '3px solid #1a1a1a',
          background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 20px 60px rgba(0,0,0,0.5),
            0 8px 20px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.08)
          `,
        }}
      >
        {/* Notch area */}
        <div className="relative flex items-center justify-center bg-black" style={{ height: '36px' }}>
          {/* Notch pill */}
          <div
            className="absolute top-0 rounded-b-2xl bg-black"
            style={{ width: '120px', height: '28px' }}
          >
            {/* Camera dot */}
            <div
              className="absolute right-4 top-2 rounded-full"
              style={{
                width: '10px',
                height: '10px',
                background: 'radial-gradient(circle, #1a3a5c 0%, #0a1520 60%, #000 100%)',
                boxShadow: '0 0 2px rgba(30,80,130,0.3)',
              }}
            />
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 bg-black text-white"
          style={{ height: '20px', fontSize: '12px' }}
        >
          {/* Left: Time */}
          <span className="font-semibold tracking-tight" style={{ fontSize: '13px' }}>
            {gameTime}
          </span>

          {/* Right: Signal + Battery */}
          <div className="flex items-center gap-1.5">
            {/* Signal bars */}
            <div className="flex items-end gap-px">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: '3px',
                    height: `${4 + i * 2}px`,
                    backgroundColor: i < signal ? '#fff' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>

            {/* Battery */}
            <div className="flex items-center gap-0.5">
              <div
                className="rounded-sm border border-white/40 relative overflow-hidden"
                style={{ width: '22px', height: '10px' }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-sm"
                  style={{
                    width: `${battery}%`,
                    backgroundColor: battery > 20 ? '#34c759' : '#ff3b30',
                  }}
                />
              </div>
              <div
                className="rounded-r-sm bg-white/40"
                style={{ width: '1.5px', height: '4px' }}
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden bg-[#0b141a]">
          {children}
        </div>

        {/* Bottom bar (home indicator) */}
        <div className="flex items-center justify-center bg-black" style={{ height: '24px' }}>
          <div
            className="rounded-full bg-white/30"
            style={{ width: '134px', height: '4px' }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * WhatsApp-style header bar for inside the phone
 */
export function PhoneChatHeader({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  isOnline,
  onBack,
  onInfoClick,
}: {
  title: string
  subtitle?: string
  avatarUrl?: string
  avatarFallback?: string
  isOnline?: boolean
  onBack?: () => void
  onInfoClick?: () => void
}) {
  return (
    <div
      className="flex items-center gap-2 px-2 py-2"
      style={{
        background: 'linear-gradient(180deg, #1f2c34 0%, #1a262e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-[#00a884]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Avatar */}
      <div
        className="relative flex-shrink-0 rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center"
        style={{ width: '36px', height: '36px' }}
        onClick={onInfoClick}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-[#8696a0]">
            {avatarFallback || title.charAt(0).toUpperCase()}
          </span>
        )}
        {isOnline && (
          <div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a884] border-2 border-[#1f2c34]"
          />
        )}
      </div>

      {/* Name and status */}
      <div className="flex-1 min-w-0" onClick={onInfoClick}>
        <p className="text-sm font-medium text-[#e9edef] truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-[#8696a0] truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/**
 * WhatsApp-style message bubble
 */
export function MessageBubble({
  content,
  isOutgoing,
  time,
  isRead,
  showTail = true,
}: {
  content: string
  isOutgoing: boolean
  time: string
  isRead?: boolean
  showTail?: boolean
}) {
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} px-3 py-0.5`}>
      <div
        className={`relative max-w-[75%] rounded-lg px-2.5 py-1.5 ${
          isOutgoing
            ? 'bg-[#005c4b] text-[#e9edef]'
            : 'bg-[#202c33] text-[#e9edef]'
        }`}
        style={{
          borderTopRightRadius: isOutgoing && showTail ? '2px' : undefined,
          borderTopLeftRadius: !isOutgoing && showTail ? '2px' : undefined,
        }}
      >
        {/* Tail */}
        {showTail && (
          <div
            className={`absolute top-0 ${isOutgoing ? '-right-1.5' : '-left-1.5'}`}
            style={{
              width: 0,
              height: 0,
              borderTop: `6px solid ${isOutgoing ? '#005c4b' : '#202c33'}`,
              borderLeft: isOutgoing ? '6px solid transparent' : 'none',
              borderRight: !isOutgoing ? '6px solid transparent' : 'none',
            }}
          />
        )}

        <p className="text-[13px] leading-[18px] whitespace-pre-wrap break-words">
          {content}
        </p>

        {/* Time and read receipt */}
        <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
          <span className="text-[10px] text-[#8696a0]">{time}</span>
          {isOutgoing && (
            <svg
              width="16"
              height="10"
              viewBox="0 0 16 10"
              className={isRead ? 'text-[#53bdeb]' : 'text-[#8696a0]'}
            >
              <path
                d="M1 5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Typing indicator (three bouncing dots)
 */
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex justify-start px-3 py-0.5">
      <div className="bg-[#202c33] rounded-lg px-3 py-2 flex items-center gap-1">
        <div className="flex gap-0.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#8696a0]"
              style={{
                animation: `typing-bounce 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#8696a0] ml-1">{name} is typing</span>
      </div>
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/**
 * Chat list item (WhatsApp style)
 */
export function ChatListItem({
  name,
  lastMessage,
  time,
  unreadCount,
  avatarUrl,
  avatarFallback,
  isOnline,
  isPinned,
  contactType,
  onClick,
}: {
  name: string
  lastMessage: string
  time: string
  unreadCount: number
  avatarUrl?: string
  avatarFallback?: string
  isOnline?: boolean
  isPinned?: boolean
  contactType?: string
  onClick: () => void
}) {
  // Contact type badge color
  const typeColors: Record<string, string> = {
    partner: '#ff6b9d',
    family: '#ffa726',
    friend: '#66bb6a',
    business: '#42a5f5',
    team_staff: '#ab47bc',
    rival_driver: '#ef5350',
    sponsor_rep: '#26c6da',
    team_principal: '#8d6e63',
    rival: '#ef5350',
    potential_date: '#ec407a',
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#202c33] transition-colors text-left border-b border-[#222d35]"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center"
          style={{ width: '48px', height: '48px' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-medium text-[#8696a0]">
              {avatarFallback || name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] border-2 border-[#111b21]" />
        )}
        {/* Contact type indicator dot */}
        {contactType && typeColors[contactType] && (
          <div
            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full border border-[#111b21]"
            style={{ backgroundColor: typeColors[contactType] }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium text-[#e9edef] truncate">{name}</p>
          <span className={`text-[11px] flex-shrink-0 ml-2 ${unreadCount > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[13px] text-[#8696a0] truncate pr-2">{lastMessage}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isPinned && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#8696a0" className="rotate-45">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            {unreadCount > 0 && (
              <span
                className="flex items-center justify-center rounded-full bg-[#00a884] text-black font-medium"
                style={{ minWidth: '20px', height: '20px', fontSize: '11px', padding: '0 5px' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

/**
 * WhatsApp-style wallpaper background pattern
 */
export function ChatWallpaper({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#0b141a',
      }}
    >
      {children}
    </div>
  )
}
