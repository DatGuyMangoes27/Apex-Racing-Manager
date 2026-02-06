// ============================================
// CAREER JOURNEY WIDGET
// ============================================
// Visualizes the player's progression through the series
// tier ladder, showing where they started, where they are,
// and what's ahead. This is the "north star" for long-term goals.

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type {
  Trophy,
  Flag,
  Star,
  TrendingUp,
  Zap,
  Crown
} from 'lucide-react';