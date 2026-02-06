/**
 * Gemini API Client
 * Wraps the Gemini API for image and video generation
 * 
 * Uses Nano Banana (gemini-2.5-flash-image) for native image generation
 * https://ai.google.dev/gemini-api/docs/image-generation
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';

export class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
    // Nano Banana - Gemini's native image generation model
    this.imageModel = 'gemini-2.5-flash-image';
    this.videoModel = 'veo-2.0-generate-001';
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.minRequestInterval = 3000; // 3 seconds between requests
    this.retryDelay = 10000; // 10 seconds retry delay on rate limit
  }

  async rateLimitDelay() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Generate an image using Nano Banana (gemini-2.5-flash-image)
   * Uses generateContent which returns images natively
   * @param {string} prompt - Text prompt for image generation
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Image data object with inlineData
   */
  async generateImage(prompt, options = {}) {
    const { 
      aspectRatio = '1:1',
      maxRetries = 3
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await this.rateLimitDelay();

      try {
        // Use generateContent with Nano Banana model
        const response = await this.ai.models.generateContent({
          model: this.imageModel,
          contents: prompt,
          config: {
            // Optional: configure aspect ratio
            imageConfig: aspectRatio !== '1:1' ? { aspectRatio } : undefined
          }
        });

        // Check for image in response parts
        if (!response.candidates?.[0]?.content?.parts) {
          throw new Error('No content in response');
        }

        const parts = response.candidates[0].content.parts;
        
        // Find the image part
        for (const part of parts) {
          if (part.inlineData) {
            // Return in format compatible with saveImage
            return {
              inlineData: part.inlineData
            };
          }
        }

        throw new Error('No image in response - only text returned');

      } catch (error) {
        lastError = error;
        const msg = error.message || String(error);
        
        // Check if retryable
        const isRateLimited = msg.includes('QUOTA') || msg.includes('429') || msg.includes('rate') || msg.includes('Resource') || msg.includes('too many');
        
        if (isRateLimited && attempt < maxRetries) {
          const waitTime = this.retryDelay * attempt;
          console.log(`    Rate limited, waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        
        // Non-retryable errors
        if (msg.includes('SAFETY') || msg.includes('blocked') || msg.includes('policy') || msg.includes('Responsible AI')) {
          throw new Error(`Safety filter - modify prompt`);
        }
        if (msg.includes('not found') || msg.includes('404')) {
          throw new Error('Model not available - check API access');
        }
        if (msg.includes('PERMISSION') || msg.includes('403')) {
          throw new Error('Permission denied - check API key');
        }
        
        // If rate limited on last attempt
        if (isRateLimited) {
          throw new Error('Rate limited - try again later');
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Generate a video using Veo
   * @param {string} prompt - Text prompt for video generation
   * @param {Object} options - Generation options
   * @returns {Promise<Buffer>} - Video data as buffer
   */
  async generateVideo(prompt, options = {}) {
    await this.rateLimitDelay();

    try {
      // Veo API - may require separate access/waitlist
      const response = await this.genai.models.generateContent({
        model: this.videoModel,
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'video/mp4'
        }
      });

      return response;

    } catch (error) {
      if (error.message?.includes('not found') || error.message?.includes('404') || error.message?.includes('not available')) {
        throw new Error('Veo not available - may require waitlist access. Try Google AI Studio directly.');
      }
      throw error;
    }
  }

  /**
   * Save image buffer to file
   * @param {Object} imageData - Image data from Gemini API
   * @param {string} filePath - Output file path
   */
  async saveImage(imageData, filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let buffer;
    
    // Handle Nano Banana (Gemini native) format: { inlineData: { mimeType, data } }
    if (imageData.inlineData?.data) {
      buffer = Buffer.from(imageData.inlineData.data, 'base64');
    }
    // Handle Imagen 3 response format: generatedImages[0].image.imageBytes
    else if (imageData.image?.imageBytes) {
      buffer = Buffer.from(imageData.image.imageBytes, 'base64');
    } 
    // Alternative formats
    else if (imageData.imageBytes) {
      buffer = Buffer.from(imageData.imageBytes, 'base64');
    } 
    else if (imageData.data) {
      buffer = Buffer.from(imageData.data, 'base64');
    } 
    else if (imageData.b64_json) {
      buffer = Buffer.from(imageData.b64_json, 'base64');
    } 
    else if (Buffer.isBuffer(imageData)) {
      buffer = imageData;
    } 
    else if (typeof imageData === 'string') {
      buffer = Buffer.from(imageData, 'base64');
    } 
    else {
      // Debug output to understand structure
      console.log('  [DEBUG] Image data keys:', Object.keys(imageData));
      if (imageData.inlineData) {
        console.log('  [DEBUG] inlineData keys:', Object.keys(imageData.inlineData));
      }
      throw new Error('Unknown image data format');
    }

    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Save video buffer to file
   * @param {Buffer} videoData - Video data
   * @param {string} filePath - Output file path
   */
  async saveVideo(videoData, filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, videoData);
    return filePath;
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      estimatedCost: this.requestCount * 0.03 // Rough estimate per image
    };
  }
}
