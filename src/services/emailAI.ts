/**
 * Email AI Service
 * 
 * Uses Gemini Flash to dynamically generate unique email content for
 * sponsor communications, board messages, invitations, and more.
 * Falls back to templates if AI is unavailable.
 */

import { EmailCategory } from '@/store/careerStore';