/**
 * Quick API test script to verify Gemini/Imagen access
 */

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testAPI() {
  console.log('Testing Gemini API access...\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ No API key found in .env');
    return;
  }
  
  console.log('✓ API key loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Test 1: Basic text generation (should always work)
  console.log('\n--- Test 1: Text Generation ---');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: 'Say "Hello from Gemini!" in one sentence.'
    });
    console.log('✓ Text generation works!');
    console.log('  Response:', response.text?.substring(0, 100));
  } catch (error) {
    console.log('❌ Text generation failed:', error.message);
  }
  
  // Test 2: Nano Banana (gemini-2.5-flash-image) - Gemini's native image generation
  console.log('\n--- Test 2: Nano Banana (gemini-2.5-flash-image) ---');
  try {
    console.log('  Using gemini-2.5-flash-image for native image generation...');
    
    const imgResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A simple icon of a red race car, white background, minimalist style'
    });
    
    console.log('✓ Nano Banana image generation works!');
    
    // Check response structure
    if (imgResponse.candidates?.[0]?.content?.parts) {
      const parts = imgResponse.candidates[0].content.parts;
      console.log('  Parts count:', parts.length);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.text) {
          console.log(`  Part ${i}: text (${part.text.substring(0, 50)}...)`);
        }
        if (part.inlineData) {
          console.log(`  Part ${i}: IMAGE (${part.inlineData.mimeType})`);
          // Save the test image
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          const fs = await import('node:fs');
          fs.writeFileSync('test-image.png', buffer);
          console.log('  ✓ Image saved as test-image.png!');
        }
      }
    } else {
      console.log('  Response structure:', JSON.stringify(imgResponse, null, 2).substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Nano Banana test failed');
    console.log('  Error type:', error.constructor.name);
    console.log('  Error message:', error.message);
    
    console.log('\n  Full error:', JSON.stringify(error, null, 2).substring(0, 500));
  }
  
  console.log('\n--- Test Complete ---');
}

testAPI();
