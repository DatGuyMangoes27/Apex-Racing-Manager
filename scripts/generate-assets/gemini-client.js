/**
 * Gemini API Client Wrapper
 * Handles image generation via Imagen and video generation via Veo
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';

export class GeminiClient {
  constructor(apiKey) {
    this.client = new GoogleGenAI({ apiKey });
    this.imageModel = 'imagen-3.0-generate-002';
    this.videoModel = 'veo-2.0-generate-001';
    this.retryDelay = 5000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES || '3');
  }

  /**
   * Generate images using Imagen
   */
  async generateImage(prompt, options = {}) {
    const {
      aspectRatio = '1:1',
      numberOfImages = 1,
      outputPath,
      filename
    } = options;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.models.generateImages({
          model: this.imageModel,
          prompt,
          config: {
            numberOfImages: Math.min(numberOfImages, 4),
            aspectRatio,
            outputMimeType: 'image/png'
          }
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
          throw new Error('No images generated');
        }

        const results = [];
        
        for (let i = 0; i < response.generatedImages.length; i++) {
          const image = response.generatedImages[i];
          const imageData = image.image.imageBytes;
          
          if (outputPath && filename) {
            const finalFilename = numberOfImages > 1 
              ? `${filename}_${i + 1}.png` 
              : `${filename}.png`;
            const fullPath = path.join(outputPath, finalFilename);
            
            await fs.mkdir(outputPath, { recursive: true });
            await fs.writeFile(fullPath, Buffer.from(imageData, 'base64'));
            
            results.push({
              path: fullPath,
              filename: finalFilename
            });
          } else {
            results.push({
              data: imageData
            });
          }
        }

        return results;
      } catch (error) {
        console.error(`Attempt ${attempt}/${this.maxRetries} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Rate limit or transient error - wait and retry
        if (error.message.includes('429') || error.message.includes('quota')) {
          console.log(`Rate limited. Waiting ${this.retryDelay * 2}ms...`);
          await this.sleep(this.retryDelay * 2);
        } else {
          await this.sleep(this.retryDelay);
        }
      }
    }
  }

  /**
   * Generate video using Veo
   */
  async generateVideo(prompt, options = {}) {
    const {
      duration = 8,
      resolution = '720p',
      outputPath,
      filename
    } = options;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Veo video generation - this is async and may take a while
        const response = await this.client.models.generateVideo({
          model: this.videoModel,
          prompt,
          config: {
            durationSeconds: duration,
            resolution
          }
        });

        // Poll for completion if needed
        let videoResult = response;
        while (videoResult.status === 'PROCESSING') {
          await this.sleep(5000);
          videoResult = await this.client.operations.get(videoResult.name);
        }

        if (videoResult.status === 'FAILED') {
          throw new Error(`Video generation failed: ${videoResult.error}`);
        }

        if (outputPath && filename) {
          const fullPath = path.join(outputPath, `${filename}.mp4`);
          await fs.mkdir(outputPath, { recursive: true });
          
          // Download and save video
          const videoData = await this.downloadVideo(videoResult.video.uri);
          await fs.writeFile(fullPath, videoData);
          
          return { path: fullPath, filename: `${filename}.mp4` };
        }

        return { uri: videoResult.video.uri };
      } catch (error) {
        console.error(`Video attempt ${attempt}/${this.maxRetries} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        await this.sleep(this.retryDelay * 2);
      }
    }
  }

  async downloadVideo(uri) {
    const response = await fetch(uri);
    return Buffer.from(await response.arrayBuffer());
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default GeminiClient;
