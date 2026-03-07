import { useState } from 'react'
import { 
  BookOpen, Car, Trophy, DollarSign, Users, Building2, 
  Calendar, Wrench, Handshake, Newspaper, Target, 
  ChevronRight, ChevronDown, Search, RefreshCw, Play
} from 'lucide-react'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }
const CARD = 'bg-white border-[0.8px] border-black/20 rounded-[24px] overflow-hidden'

export default function HowToPlay() {
  return (
    <div className="bg-white w-full h-full overflow-y-auto">
      <div className="p-[24px] flex flex-col gap-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <BookOpen className="w-[28px] h-[28px] text-[#0a0a0a]" />
          <h1 className="text-[30px] text-[#0a0a0a] tracking-[-1.5px] leading-tight" style={FB}>How to Play</h1>
        </div>

        {/* Content Card */}
        <div className={`${CARD} p-[24px]`}>
          <p className="text-[15px] text-[#4a5565]" style={FR}>How to Play</p>
        </div>
      </div>
    </div>
  )
}
