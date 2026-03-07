/**
 * Gemini text generation client.
 * Uses gemini-2.0-flash with JSON mode for structured output.
 * No per-call throttling -- concurrency is managed by BatchProcessor.
 */

import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.0-flash'
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 10000 // 10 seconds base for rate limit retries

export async function generateTextBatch(
  apiKey: string,
  prompt: string,
  retries = MAX_RETRIES
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey })

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          maxOutputTokens: 8192,
        }
      })

      const text = response.text
      if (!text) throw new Error('Empty response from Gemini')

      // Clean up response - remove markdown code fences if present
      let cleaned = text.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      cleaned = cleaned.trim()

      return JSON.parse(cleaned)
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('429') ||
        err?.message?.includes('QUOTA') ||
        err?.message?.includes('rate') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')

      if (isRateLimit && attempt < retries - 1) {
        // Exponential backoff with jitter for rate limits
        const delay = RETRY_BASE_DELAY * (attempt + 1) + Math.random() * 5000
        console.log(`Rate limited, waiting ${(delay / 1000).toFixed(1)}s before retry ${attempt + 1}/${retries}...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      if (attempt < retries - 1) {
        console.log(`Error on attempt ${attempt + 1}, retrying: ${err.message}`)
        await new Promise(resolve => setTimeout(resolve, 3000))
        continue
      }

      throw err
    }
  }
}

export async function generateText(
  apiKey: string,
  prompt: string,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 4096,
    }
  })

  return response.text || ''
}
