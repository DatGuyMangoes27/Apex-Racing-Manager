/**
 * Gemini image generation client.
 * Uses gemini-2.0-flash-exp for native image generation.
 * No per-call throttling -- concurrency is managed by BatchProcessor.
 */

import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-2.5-flash-image'  // Standard image generation model
const PRO_MODEL = 'gemini-3-pro-image-preview'  // Higher quality, limited rate
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 12000

export interface ImageResult {
  success: boolean
  base64Data?: string
  mimeType?: string
  error?: string
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  retries = MAX_RETRIES,
  model?: string
): Promise<ImageResult> {
  const ai = new GoogleGenAI({ apiKey })
  const useModel = model || DEFAULT_MODEL

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: useModel,
        contents: prompt,
        config: {
          responseModalities: ['image', 'text'],
          temperature: 0.9,
        }
      })

      // Extract image data from response
      const parts = response.candidates?.[0]?.content?.parts
      if (!parts) throw new Error('No parts in response')

      for (const part of parts) {
        if (part.inlineData) {
          return {
            success: true,
            base64Data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
          }
        }
      }

      throw new Error('No image data in response')
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('429') ||
        err?.message?.includes('QUOTA') ||
        err?.message?.includes('rate') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')

      const isSafety = err?.message?.includes('SAFETY') ||
        err?.message?.includes('safety') ||
        err?.message?.includes('blocked')

      if (isSafety) {
        return {
          success: false,
          error: `Safety filter blocked: ${err.message}`,
        }
      }

      if (isRateLimit && attempt < retries - 1) {
        const delay = RETRY_BASE_DELAY * (attempt + 1) + Math.random() * 5000
        console.log(`Rate limited on image gen, waiting ${(delay / 1000).toFixed(1)}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      if (attempt < retries - 1) {
        console.log(`Image gen error attempt ${attempt + 1}: ${err.message}`)
        await new Promise(resolve => setTimeout(resolve, 3000))
        continue
      }

      return {
        success: false,
        error: err.message || 'Unknown error',
      }
    }
  }

  return { success: false, error: 'Max retries exceeded' }
}
