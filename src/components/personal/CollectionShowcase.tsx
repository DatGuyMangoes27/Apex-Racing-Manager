import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Watch,
  Palette,
  Wine,
  Trophy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Eye,
  Star,
  Calendar,
  MapPin,
  Award,
  Sparkles,
  Plus,
  Filter
} from 'lucide-react'
import { Card, CardHeader, Button, Badge, Modal, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import type {
  Collection,
  CollectionItem,
  CollectionEvent,
  _ArtCollectionDetails
} from '@/data/collections-config';