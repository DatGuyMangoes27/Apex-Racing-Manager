/**
 * Calendar Conflict Resolution Modal
 * 
 * Displayed when the player has races in multiple championships on the same weekend.
 * Player must choose which race to attend - others will be marked as DNS (Did Not Start).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Trophy,
  AlertTriangle,
  Check,
  X,
  Flag,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';