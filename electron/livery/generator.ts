import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveryGenerationRequest {
  carClassId: string
  teamName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  sponsors: string[]
  designStyle: string
  racingNumber: string
  liverySlot: number        // which base livery ID to override (51-61 typically)
  baseLivery: string        // Default | Matte | Chrome | GreenMetallic | RedMetallic | BlueMetallic
  gamePath: string          // AMS2 install path
  apiKey: string            // Gemini API key
  additionalInstructions?: string
}

export interface LiveryGenerationResult {
  success: boolean
  error?: string
  ddsPath?: string
  previewBase64?: string    // data:image/png;base64,... for UI preview
  overrideName?: string
}

// ---------------------------------------------------------------------------
// Car class -> override folder mapping
// ---------------------------------------------------------------------------

const CAR_CLASS_OVERRIDE_MAP: Record<string, {
  overrideFolder: string
  bffName: string
  liveryPrefix: string
  displayName: string
}> = {
  'super-trofeo': {
    overrideFolder: 'lamborghini_huracan_supertrofeo_evo2',
    bffName: 'Lamborghini_Huracan_Supertrofeo_Evo2_Livery.bff',
    liveryPrefix: 'huracan_st_evo2',
    displayName: 'Lamborghini Huracán Super Trofeo EVO2',
  },
}

// ---------------------------------------------------------------------------
// Design styles (ported from PMR AI)
// ---------------------------------------------------------------------------

const DESIGN_STYLES: Record<string, string> = {
  racing_stripes:
    'Bold racing stripes running front-to-back along the body centerline, like classic Le Mans GT cars. Stripes should have clean parallel edges with the primary color as the body and secondary color as the stripes.',
  gradient:
    'Smooth, dramatic gradient transition from the primary color at the front fading into the secondary color toward the rear. The gradient should flow naturally across body panels like a professional factory GT3 livery.',
  geometric:
    'Sharp angular geometric shapes, triangles, and hard-edged graphic panels. Think of Red Bull or Aston Martin racing liveries with aggressive angular cutlines separating color blocks. Bold and modern with precise edges.',
  livery_split:
    'Clean two-tone livery split with a sharp diagonal or curved dividing line. Primary color dominates the upper/front portion, secondary takes the lower/rear. Like a classic LMGT3 or DTM team livery with a defined split.',
  full_wrap:
    'Full body wrap with the primary color covering the entire body. The secondary and accent colors appear as subtle accent graphics, pinstripes, and sponsor panel highlights. Clean factory team look.',
  classic:
    'Traditional solid body color with thin accent racing stripes and chrome/metallic trim. Elegant, understated motorsport look reminiscent of classic Gulf, Rothmans, or 1970s endurance racing liveries.',
  carbon_fiber:
    'Primary color body with carbon fiber weave texture pattern on aero elements — splitter, diffuser, side skirts, hood louvers, and rear wing. Carbon fiber areas should have a visible weave pattern in dark grey/black.',
  camo:
    'Digital camouflage pattern using pixelated rectangular blocks of the primary, secondary, and accent colors. Like the BMW Art Car digital camo or Lamborghini Super Trofeo testing liveries. Bold and eye-catching.',
  triple_stripe:
    'Three bold parallel racing stripes (like Martini Racing) running from nose to tail. Primary color body, with all three stripes in a sequence of the secondary and accent colors separated by thin gaps.',
  arrow:
    'Dynamic arrow or chevron pattern pointing forward from the nose. Interlocking V-shapes in the primary and secondary colors create an aggressive forward-motion look. Like IMSA or WEC prototype liveries.',
  asymmetric:
    'Asymmetric design where the left and right sides have different but complementary color layouts. One side predominantly primary, the other secondary, with the accent color tying them together. Bold and distinctive.',
  swoosh:
    'Flowing curved lines and organic swooshes sweeping from front to rear. Smooth S-curves and wave patterns in the secondary color over a primary base. Fluid and aerodynamic look, like modern WEC or ELMS liveries.',
  pinstripe:
    'Clean primary body color with elegant thin pinstripes in the accent color running along body lines, wheel arches, and panel edges. Minimal but sophisticated, similar to classic Porsche or Aston Martin factory racing schemes.',
  diagonal_slash:
    'Bold diagonal slash cutting across the bodywork at an angle, with the primary color on one side and secondary on the other. A sharp, aggressive dividing line with the accent color as a thin border along the slash edge.',
  heritage:
    'Retro-inspired heritage livery with period-correct styling: large roundel numbers, wide color bands, simple logo placement, and a nostalgic 1960s-1970s racing aesthetic. Think classic Porsche 917 or Ford GT40 liveries.',
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PREFIX =
  'You are painting a racing car livery onto a UV-unwrapped texture map. ' +
  'The reference image shows an EXISTING livery on the UV layout — use the panel shapes ' +
  'and UV seam boundaries to understand where each body panel, door, hood, fender, roof, ' +
  'and bumper sits on the flat texture. You MUST maintain the exact same UV region shapes ' +
  'and proportions — do NOT restructure or move any UV islands. ' +
  'IGNORE the existing colors, logos, numbers, and sponsors — paint a completely NEW design ' +
  'from scratch using ONLY the instructions below. ' +
  'Fill every panel with color — leave NO areas from the original visible. ' +
  'Keep paint edges clean along UV seam boundaries. The output must be ' +
  'a flat 2D texture at the same resolution and aspect ratio as the input (4096x4096).'

function buildLiveryPrompt(req: LiveryGenerationRequest): string {
  const parts = [
    'Paint this UV-unwrapped car texture with a professional racing livery.',
    `This livery will be wrapped onto a real 3D ${req.carClassId === 'super-trofeo' ? 'Lamborghini Huracán Super Trofeo EVO2' : 'racing car'} model in Automobilista 2.`,
    '',
    'COLOR SCHEME:',
    `  - Primary color: ${req.primaryColor} — the dominant body color, covering ~55-65% of the surface`,
    `  - Secondary color: ${req.secondaryColor} — the main contrast/accent area, covering ~25-35%`,
    `  - Accent color: ${req.accentColor} — highlights, pinstripes, trim, and small details`,
  ]

  if (req.racingNumber) {
    parts.push(
      '',
      'RACING NUMBER:',
      `  - Number: ${req.racingNumber}`,
      '  - Place the number LARGE and bold on both door panels (left and right sides)',
      '  - Also place a smaller version on the hood/bonnet and rear bumper area',
      '  - Use a clear, legible racing font with a contrasting outline for visibility',
    )
  }

  if (req.teamName) {
    parts.push(
      '',
      'TEAM NAME:',
      `  - "${req.teamName}"`,
      '  - Display prominently on both sides of the car above or near the door number',
      '  - Also place on the rear wing end-plates or above the rear bumper',
    )
  }

  if (req.sponsors && req.sponsors.length > 0) {
    parts.push('', 'SPONSORS (paint as realistic sponsor text/logos on the bodywork):')
    req.sponsors.forEach((s, i) => {
      if (i === 0)      parts.push(`  - "${s}" — main sponsor, large on hood/bonnet`)
      else if (i === 1) parts.push(`  - "${s}" — on door panels below the number`)
      else if (i === 2) parts.push(`  - "${s}" — on front fenders`)
      else if (i === 3) parts.push(`  - "${s}" — on rear wing or rear quarter panels`)
      else              parts.push(`  - "${s}" — on splitter, side skirt, or smaller panel`)
    })
  }

  const styleDesc = DESIGN_STYLES[req.designStyle] || req.designStyle
  parts.push('', 'DESIGN STYLE:', `  ${styleDesc}`)

  if (req.additionalInstructions) {
    parts.push('', 'ADDITIONAL INSTRUCTIONS:', `  ${req.additionalInstructions}`)
  }

  parts.push(
    '',
    'QUALITY REQUIREMENTS:',
    '- This must look like a real professional GT racing livery',
    '- All text and numbers should be crisp, legible, and properly oriented',
    '- Sponsor text should look like real painted decals, not floating',
    '- Colors should be vibrant and the overall design eye-catching at speed',
    '- Maintain the exact UV panel layout from the reference image',
    '- The car panels on the LEFT and RIGHT sides of the UV must have MIRRORED versions of the design',
    '- Windows and glass areas (typically dark/black regions) should remain dark',
  )

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Gemini API
// ---------------------------------------------------------------------------

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent'

async function callGeminiWithImage(
  apiKey: string,
  prompt: string,
  imageBase64: string,
  imageMimeType: string = 'image/png'
): Promise<string | null> {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${SYSTEM_PREFIX}\n\n${prompt}` },
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          imageSize: '4K',
          aspectRatio: '1:1',
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts
  if (!parts || !Array.isArray(parts)) return null

  for (const part of parts) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return part.inlineData.data // base64 string
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// texconv wrapper
// ---------------------------------------------------------------------------

function getTexconvPath(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(process.cwd(), 'tools', 'texconv.exe')
  }
  return path.join(path.dirname(app.getPath('exe')), 'tools', 'texconv.exe')
}

function convertPngToDds(pngPath: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const texconv = getTexconvPath()
    if (!fs.existsSync(texconv)) {
      reject(new Error(`texconv.exe not found at ${texconv}`))
      return
    }

    // DXT1 with mipmaps, 4096x4096
    const args = [
      '-f', 'BC1_UNORM',  // DXT1
      '-m', '0',            // auto-generate all mip levels
      '-y',                 // overwrite existing
      '-o', outputDir,
      pngPath,
    ]

    const child = spawn(texconv, args)
    let stderr = ''
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`texconv failed (code ${code}): ${stderr}`))
        return
      }
      const baseName = path.basename(pngPath, '.png') + '.dds'
      const ddsPath = path.join(outputDir, baseName)
      if (!fs.existsSync(ddsPath)) {
        reject(new Error(`texconv did not produce expected output: ${ddsPath}`))
        return
      }
      resolve(ddsPath)
    })
    child.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Override XML generator
// ---------------------------------------------------------------------------

function generateOverrideXml(
  liverySlot: number,
  name: string,
  baseLivery: string,
  bodyDdsRelPath: string,
): string {
  return [
    '<?xml version="1.0" encoding="utf-8" ?>',
    '<USER_OVERRIDES>',
    '',
    `    <LIVERY_OVERRIDE LIVERY="${liverySlot}" NAME="${escapeXml(name)}" BASELIVERY="${escapeXml(baseLivery)}">`,
    `        <TEXTURE NAME="BODY" PATH="${escapeXml(bodyDdsRelPath)}" />`,
    '    </LIVERY_OVERRIDE>',
    '',
    '</USER_OVERRIDES>',
  ].join('\n')
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ---------------------------------------------------------------------------
// UV template management
// ---------------------------------------------------------------------------

function getUvTemplatesDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(process.cwd(), 'tools', 'uv_templates')
  }
  return path.join(path.dirname(app.getPath('exe')), 'tools', 'uv_templates')
}

function getUvTemplatePath(carClassId: string): string | null {
  const mapping = CAR_CLASS_OVERRIDE_MAP[carClassId]
  if (!mapping) return null

  const templatesDir = getUvTemplatesDir()
  // Use the first extracted livery PNG as reference
  const templateFile = `${mapping.liveryPrefix}_1.png`
  const fullPath = path.join(templatesDir, templateFile)

  if (fs.existsSync(fullPath)) return fullPath
  return null
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

async function generateAms2Livery(req: LiveryGenerationRequest): Promise<LiveryGenerationResult> {
  console.log('[Livery] Starting livery generation for', req.carClassId)

  // 1. Validate car class
  const mapping = CAR_CLASS_OVERRIDE_MAP[req.carClassId]
  if (!mapping) {
    return { success: false, error: `Unsupported car class: ${req.carClassId}. Supported: ${Object.keys(CAR_CLASS_OVERRIDE_MAP).join(', ')}` }
  }

  // 2. Find UV template
  const uvTemplatePath = getUvTemplatePath(req.carClassId)
  if (!uvTemplatePath) {
    return { success: false, error: `UV template not found for ${mapping.displayName}. Extract it first using the BFF extraction tool.` }
  }

  console.log('[Livery] Using UV template:', uvTemplatePath)

  // 3. Read UV template as base64
  const uvTemplateBuffer = fs.readFileSync(uvTemplatePath)
  const uvTemplateBase64 = uvTemplateBuffer.toString('base64')

  // 4. Build the prompt
  const prompt = buildLiveryPrompt(req)
  console.log('[Livery] Prompt built, length:', prompt.length)

  // 5. Call Gemini
  console.log('[Livery] Calling Gemini API...')
  let generatedBase64: string | null
  try {
    generatedBase64 = await callGeminiWithImage(req.apiKey, prompt, uvTemplateBase64)
  } catch (err: any) {
    console.error('[Livery] Gemini API error:', err.message)
    return { success: false, error: `Gemini API error: ${err.message}` }
  }

  if (!generatedBase64) {
    return { success: false, error: 'Gemini returned no image data' }
  }

  console.log('[Livery] Received generated texture from Gemini, size:', Math.round(generatedBase64.length / 1024), 'KB')

  // 6. Save generated PNG to temp location
  const tempDir = path.join(app.getPath('temp'), 'ams2-livery-gen')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const sanitizedTeamName = req.teamName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
  const pngFileName = `${mapping.liveryPrefix}_${sanitizedTeamName}_${req.racingNumber || 'custom'}.png`
  const pngPath = path.join(tempDir, pngFileName)
  fs.writeFileSync(pngPath, Buffer.from(generatedBase64, 'base64'))
  console.log('[Livery] Saved generated PNG:', pngPath)

  // 7. Convert PNG to DDS (DXT1 with MIPs) using texconv
  console.log('[Livery] Converting to DDS...')
  let ddsPath: string
  try {
    ddsPath = await convertPngToDds(pngPath, tempDir)
  } catch (err: any) {
    console.error('[Livery] DDS conversion error:', err.message)
    return {
      success: false,
      error: `DDS conversion failed: ${err.message}`,
      previewBase64: `data:image/png;base64,${generatedBase64}`,
    }
  }

  console.log('[Livery] DDS created:', ddsPath)

  // 8. Place in AMS2 CustomLiveries folder
  const overridesBase = path.join(
    req.gamePath,
    'Vehicles', 'Textures', 'CustomLiveries', 'Overrides',
    mapping.overrideFolder,
  )

  const liverySubDir = path.join(overridesBase, 'career_companion')
  if (!fs.existsSync(liverySubDir)) fs.mkdirSync(liverySubDir, { recursive: true })

  const finalDdsName = `body_${sanitizedTeamName}_${req.racingNumber || 'custom'}.dds`
  const finalDdsPath = path.join(liverySubDir, finalDdsName)
  fs.copyFileSync(ddsPath, finalDdsPath)
  console.log('[Livery] Installed DDS to:', finalDdsPath)

  // 9. Generate / update override XML
  const xmlPath = path.join(overridesBase, `${mapping.overrideFolder}.xml`)
  const overrideName = `${req.teamName} #${req.racingNumber || '0'}`
  const bodyRelPath = `career_companion\\${finalDdsName}`
  const xmlContent = generateOverrideXml(
    req.liverySlot,
    overrideName,
    req.baseLivery || 'Default',
    bodyRelPath,
  )
  fs.writeFileSync(xmlPath, xmlContent, 'utf-8')
  console.log('[Livery] Override XML written:', xmlPath)

  // 10. Clean up temp files
  try {
    if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath)
    if (fs.existsSync(ddsPath)) fs.unlinkSync(ddsPath)
  } catch { /* ignore cleanup errors */ }

  return {
    success: true,
    ddsPath: finalDdsPath,
    previewBase64: `data:image/png;base64,${generatedBase64}`,
    overrideName,
  }
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

export function registerLiveryHandlers() {
  ipcMain.handle('livery:generate', async (_event, request: LiveryGenerationRequest) => {
    return generateAms2Livery(request)
  })

  ipcMain.handle('livery:getSupportedClasses', async () => {
    return Object.entries(CAR_CLASS_OVERRIDE_MAP).map(([classId, info]) => ({
      classId,
      displayName: info.displayName,
      hasTemplate: getUvTemplatePath(classId) !== null,
    }))
  })

  ipcMain.handle('livery:getDesignStyles', async () => {
    return Object.entries(DESIGN_STYLES).map(([id, desc]) => ({
      id,
      name: id
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: desc,
    }))
  })

  ipcMain.handle('livery:checkTemplate', async (_event, carClassId: string) => {
    return {
      hasTemplate: getUvTemplatePath(carClassId) !== null,
      classId: carClassId,
    }
  })

  // Extract UV template from BFF (one-time per car class)
  ipcMain.handle('livery:extractTemplate', async (_event, carClassId: string, gamePath: string) => {
    const mapping = CAR_CLASS_OVERRIDE_MAP[carClassId]
    if (!mapping) return { success: false, error: `Unknown car class: ${carClassId}` }

    const bffPath = path.join(gamePath, 'Pakfiles', 'Vehicles', mapping.bffName)
    if (!fs.existsSync(bffPath)) {
      return { success: false, error: `BFF file not found: ${bffPath}` }
    }

    const isDev = !app.isPackaged
    const pcarsToolsPath = isDev
      ? path.join(process.cwd(), 'tools', 'pcarstools', 'win-x64', 'PCarsTools.exe')
      : path.join(path.dirname(app.getPath('exe')), 'tools', 'pcarstools', 'win-x64', 'PCarsTools.exe')

    if (!fs.existsSync(pcarsToolsPath)) {
      return { success: false, error: `PCarsTools not found at ${pcarsToolsPath}` }
    }

    const extractDir = path.join(app.getPath('temp'), 'ams2-bff-extract')
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true })

    // Extract BFF
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(pcarsToolsPath, [
          'pak', '-i', bffPath, '-g', gamePath, '-o', extractDir,
        ])
        let stderr = ''
        child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
        child.on('close', (code) => {
          if (code !== 0) reject(new Error(`PCarsTools failed: ${stderr}`))
          else resolve()
        })
        child.on('error', reject)
      })
    } catch (err: any) {
      return { success: false, error: `BFF extraction failed: ${err.message}` }
    }

    // Find extracted livery DDS and convert first one to PNG
    const textureDir = path.join(
      extractDir,
      `${mapping.bffName.replace('.bff', '')}`,
      'vehicles', 'textures', mapping.overrideFolder,
    )

    if (!fs.existsSync(textureDir)) {
      return { success: false, error: `Expected texture directory not found after extraction: ${textureDir}` }
    }

    const ddsFiles = fs.readdirSync(textureDir)
      .filter((f) => f.endsWith('.dds') && f.startsWith(mapping.liveryPrefix))
      .sort()

    if (ddsFiles.length === 0) {
      return { success: false, error: 'No livery DDS files found in extracted BFF' }
    }

    // Convert first livery to PNG as UV template
    const templateDds = path.join(textureDir, ddsFiles[0])
    const templatesDir = getUvTemplatesDir()
    if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true })

    const texconv = getTexconvPath()
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(texconv, ['-ft', 'png', '-o', templatesDir, templateDds])
        child.on('close', (code) => {
          if (code !== 0) reject(new Error(`texconv failed with code ${code}`))
          else resolve()
        })
        child.on('error', reject)
      })
    } catch (err: any) {
      return { success: false, error: `PNG conversion failed: ${err.message}` }
    }

    return { success: true, templateCount: ddsFiles.length }
  })
}
