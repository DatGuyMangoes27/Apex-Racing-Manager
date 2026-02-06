import { useState } from 'react';
              onLoad={() => setIsLoaded(true)}
              style={{ pointerEvents: showControls ? 'auto' : 'none' }}
            />
            
            {/* Controls Overlay (only show on hover if muted toggling allowed) */}
            <div className="absolute bottom-4 right-4 z-20">
              <button 
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/50 hover:bg-accent-red/80 transition-colors backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
