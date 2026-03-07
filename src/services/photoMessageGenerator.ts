// ============================================
// PHOTO MESSAGE GENERATOR SERVICE
// ============================================
// AI-powered photo generation for NPC contact messages.
// Uses Gemini 3 Pro Image Preview with reference images
// so that selfies/kids photos maintain visual consistency
// with the contact's existing portrait.

import type { ContactInfo } from '@/types/personalLife'
import type { PhotoMessageCategory } from '@/data/messaging-config'
import { getContactPortrait } from '@/services/contactService'
import { getPartnerAsset, getChildPortrait } from '@/utils/generated-assets'
import { getPartnerById, getContactById, type PreGenPhysicalDescription } from '@/services/preGeneratedContentService'
import { PHOTO_SCENE_PROMPTS, PHOTO_CAPTIONS, pickRandomCaption } from '@/data/photo-messages-config'
import { getRandomImage } from '@/data/stock-images'
import { getNextGeminiApiKey } from '@/services/geminiKeyRotation'

// ============================================
// CONSTANTS
// ============================================

const GEMINI_IMAGE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent'

/** Categories that require a person reference image for likeness consistency */
const PERSON_CATEGORIES: PhotoMessageCategory[] = ['selfie', 'kids', 'couple_memory']

// ============================================
// API KEY (mirrors mediaAI.ts pattern)
// ============================================

async function getGeminiKey(): Promise<string | null> {
  return getNextGeminiApiKey()
}

// ============================================
// IMAGE LOADING HELPERS
// ============================================

/**
 * Fetch an image from a URL path and convert to base64 string.
 * Works with both relative paths (/images/generated/...) and full URLs.
 */
async function fetchImageAsBase64(imagePath: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    if (!imagePath) return null

    // Build full URL if relative path
    let url = imagePath
    if (imagePath.startsWith('/') || imagePath.startsWith('./')) {
      const base = (import.meta.env.BASE_URL || './').replace(/\/?$/, '/')
      url = `${base}${imagePath.replace(/^\//, '')}`
    }

    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[PhotoGen] Failed to fetch image:', url, response.status)
      return null
    }

    const blob = await response.blob()
    const mimeType = blob.type || 'image/png'

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        // Extract just the base64 data (remove the data:...;base64, prefix)
        const base64Data = dataUrl.split(',')[1]
        if (base64Data) {
          resolve({ data: base64Data, mimeType })
        } else {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.warn('[PhotoGen] Error loading image as base64:', e)
    return null
  }
}

// ============================================
// PHYSICAL DESCRIPTION HELPERS
// ============================================

/**
 * Get the physical description for a contact from pre-generated profiles or manifest assets.
 */
function getPhysicalDescription(contact: ContactInfo): PreGenPhysicalDescription | null {
  const pregenId = contact.pregenId || contact.portraitId
  if (!pregenId) return null

  // Try partner pool
  if (contact.type === 'partner' || contact.type === 'potential_date') {
    const partnerProfile = getPartnerById(pregenId)
    if (partnerProfile?.physical) return partnerProfile.physical

    // Try manifest partner asset
    const partnerAsset = getPartnerAsset(pregenId)
    if (partnerAsset?.physical) return partnerAsset.physical as PreGenPhysicalDescription
  }

  // Try contact pool
  const contactProfile = getContactById(pregenId)
  if (contactProfile?.physical) return contactProfile.physical

  return null
}

/**
 * Build a text description of a person's appearance for the AI prompt.
 */
function buildAppearanceText(physical: PreGenPhysicalDescription | null, contact: ContactInfo): string {
  if (!physical) {
    // Minimal fallback based on available contact info
    const parts: string[] = []
    if (contact.gender) parts.push(contact.gender === 'female' ? 'a woman' : 'a man')
    if (contact.nationality) parts.push(`of ${contact.nationality} appearance`)
    return parts.length > 0 ? parts.join(' ') : 'a person'
  }

  const parts: string[] = []

  // Gender
  const gender = contact.gender === 'female' ? 'woman' : 'man'
  parts.push(`a ${gender}`)

  // Skin tone
  if (physical.skinTone) parts.push(`with ${physical.skinTone} skin`)

  // Hair
  if (physical.hairColor && physical.hairStyle) {
    parts.push(`${physical.hairColor} ${physical.hairStyle} hair`)
  } else if (physical.hairColor) {
    parts.push(`${physical.hairColor} hair`)
  }

  // Eyes
  if (physical.eyeColor) parts.push(`${physical.eyeColor} eyes`)

  // Facial hair
  if (physical.facialHair) parts.push(`with ${physical.facialHair}`)

  return parts.join(', ')
}

// ============================================
// PROMPT BUILDING
// ============================================

/**
 * Build the full image generation prompt for a photo message.
 */
function buildPhotoPrompt(
  category: PhotoMessageCategory,
  physical: PreGenPhysicalDescription | null,
  contact: ContactInfo,
  context?: { childName?: string; trackName?: string; teamName?: string }
): string {
  // Get a random scene prompt from the pool
  const scenePool = PHOTO_SCENE_PROMPTS[category] || PHOTO_SCENE_PROMPTS.scenery
  const scenePrompt = scenePool[Math.floor(Math.random() * scenePool.length)]

  const isPerson = PERSON_CATEGORIES.includes(category)

  if (isPerson) {
    const appearance = buildAppearanceText(physical, contact)

    // For selfie/couple/kids - describe the person + scene
    const personRef = category === 'kids'
      ? `this child (${appearance})`
      : `this person (${appearance})`

    return `Generate a realistic casual phone photo of ${personRef}. ${scenePrompt}

CRITICAL RULES:
- The generated person must closely match the reference image provided (same face, features, and appearance)
- Photo should look like a real phone camera photo (slightly imperfect, natural lighting)
- No text, watermarks, or UI elements in the image
- The person should look natural and candid, not posed like a stock photo
- Maintain the same ethnicity, facial features, hair color/style as the reference image`
  }

  // Non-person photo (scenery, food, race, etc.)
  let enhancedPrompt = scenePrompt

  // Add contextual details
  if (context?.trackName && category === 'race_day') {
    enhancedPrompt = enhancedPrompt.replace('{trackName}', context.trackName)
  }

  return `${enhancedPrompt}

CRITICAL RULES:
- Photo should look like a real phone camera photo taken casually
- Natural lighting, slightly imperfect framing
- No text, watermarks, or UI elements
- Realistic and authentic feeling`
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export interface PhotoGenerationResult {
  photoUrl: string
  photoCaption: string
  photoCategory: PhotoMessageCategory
  photoContactPortrait: boolean
}

/**
 * Generate an AI photo for a contact message.
 *
 * For selfie/kids/couple categories: loads the contact's portrait as a reference image
 * and sends it to Gemini alongside the scene prompt so the generated person looks consistent.
 *
 * For other categories (scenery, food, race_day, etc.): generates a text-only image.
 *
 * Falls back to portrait reuse / stock images / empty string when AI is unavailable.
 */
export async function generateContactPhoto(
  contact: ContactInfo,
  category: PhotoMessageCategory,
  context?: {
    childPortraitPath?: string
    childName?: string
    trackName?: string
    teamName?: string
  }
): Promise<PhotoGenerationResult | null> {
  const isPerson = PERSON_CATEGORIES.includes(category)
  const caption = pickRandomCaption(category, context?.childName)

  // ── Try AI generation ──
  const apiKey = await getGeminiKey()

  if (apiKey) {
    try {
      const physical = getPhysicalDescription(contact)
      const prompt = buildPhotoPrompt(category, physical, contact, context)

      // Build request parts
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

      // For person categories, load the portrait as a reference image
      if (isPerson) {
        let portraitPath: string | null = null

        if (category === 'kids' && context?.childPortraitPath) {
          portraitPath = context.childPortraitPath
        } else {
          portraitPath = getContactPortrait(contact as ContactInfo & { portraitId?: string; gender?: any; pregenId?: string })
        }

        if (portraitPath) {
          const imageData = await fetchImageAsBase64(portraitPath)
          if (imageData) {
            parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } })
          }
        }
      }

      // Add the text prompt
      parts.push({ text: prompt })

      console.log(`[PhotoGen] Generating ${category} photo for ${contact.name}...`)

      const response = await fetch(GEMINI_IMAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '3:4',
              imageSize: '1K'
            }
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn('[PhotoGen] API error:', response.status, errorText)
        // Fall through to fallback
      } else {
        const data = await response.json()
        const responseParts = data.candidates?.[0]?.content?.parts

        if (responseParts && Array.isArray(responseParts)) {
          for (const part of responseParts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
              const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
              console.log(`[PhotoGen] ${category} photo generated for ${contact.name}, size: ${Math.round(part.inlineData.data.length / 1024)}KB`)

              return {
                photoUrl: dataUrl,
                photoCaption: caption,
                photoCategory: category,
                photoContactPortrait: isPerson
              }
            }
          }
        }

        console.warn('[PhotoGen] No image data in response')
      }
    } catch (e) {
      console.warn('[PhotoGen] AI generation failed:', e)
    }
  }

  // ── Fallback: no API key or generation failed ──
  return generateFallbackPhoto(contact, category, caption, context)
}

// ============================================
// FALLBACK GENERATION
// ============================================

/**
 * Fallback photo generation when AI is unavailable.
 * - Selfie: reuse the contact's portrait image
 * - Kids: reuse the child's portrait
 * - Scenery/race_day: use stock images
 * - Other: return empty URL (UI renders themed placeholder)
 */
function generateFallbackPhoto(
  contact: ContactInfo,
  category: PhotoMessageCategory,
  caption: string,
  context?: { childPortraitPath?: string; childName?: string }
): PhotoGenerationResult | null {
  let photoUrl = ''
  const isPerson = PERSON_CATEGORIES.includes(category)

  switch (category) {
    case 'selfie':
    case 'couple_memory':
      photoUrl = getContactPortrait(contact as ContactInfo & { portraitId?: string; gender?: any; pregenId?: string })
      break

    case 'kids':
      photoUrl = context?.childPortraitPath || ''
      break

    case 'scenery':
      photoUrl = getRandomImage('paddock')
      break

    case 'race_day':
      photoUrl = getRandomImage('victory')
      break

    case 'food':
    case 'activity':
    case 'pet':
    case 'work':
    case 'event':
      // No fallback image available — UI will render a themed placeholder
      photoUrl = ''
      break
  }

  // Only return a result if we have SOMETHING (image or the UI can handle empty)
  return {
    photoUrl,
    photoCaption: caption,
    photoCategory: category,
    photoContactPortrait: isPerson && !!photoUrl
  }
}

// ============================================
// UTILITY: Check if photo generation is possible
// ============================================

/**
 * Quick check whether AI photo generation is available (has API key).
 * Used to decide whether to attempt photo generation at all.
 */
export async function isPhotoGenerationAvailable(): Promise<boolean> {
  const key = await getGeminiKey()
  return !!key
}
