import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCareerStore } from '@/store/careerStore'

export function SponsorOfferCard() {
  const navigate = useNavigate()
  const { careerState } = useCareerStore()

  const pendingOffers = careerState?.pendingSponsorOffers ?? []
  const offerCount = pendingOffers.length

  if (offerCount === 0) return null

  return (
    <div className="rounded overflow-hidden" style={{ background: 'linear-gradient(135deg, #3a4556 0%, #2c3644 50%, #3a4556 100%)' }}>
      {/* Header strip */}
      <div className="px-4 py-2.5 text-center" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <h3 className="text-sm font-bold tracking-wider uppercase" style={{ color: '#d4dae3', fontFamily: 'Rajdhani, sans-serif' }}>
          Sponsor Offer
        </h3>
      </div>

      {/* Body */}
      <div className="flex items-center gap-4 px-4 py-4">
        {/* Sponsor logo placeholder — angled card with branding */}
        <div
          className="w-28 h-20 rounded flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f5f5f5)',
            transform: 'perspective(300px) rotateY(-5deg)',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div className="text-center px-2">
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#666' }}>
              SPONSOR
            </div>
            <div className="text-lg font-black italic" style={{ color: '#333', fontFamily: 'Rajdhani, sans-serif' }}>
              OFFER
            </div>
          </div>
        </div>

        {/* Text + CTA */}
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-3" style={{ color: '#b0bcc9' }}>
            You have available sponsor offers
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: '#7a8a9a' }}>
              Offers Available
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/sponsor-market')}
              className="px-5 py-2 rounded text-xs font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(to bottom, #4fa8d6, #3a8db8)',
                color: '#fff',
                fontFamily: 'Rajdhani, sans-serif',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              Check Offers
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
