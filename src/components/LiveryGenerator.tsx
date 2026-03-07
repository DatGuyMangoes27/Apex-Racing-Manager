import { useState, useEffect } from 'react'
import { RefreshCw, Palette, AlertTriangle, Check, Loader2, X } from 'lucide-react'
import { getNextGeminiApiKey } from '@/services/geminiKeyRotation'
import { useSettingsStore } from '@/store/settingsStore'

const FB: React.CSSProperties = { fontFamily: "'Arial Black', 'Arial', sans-serif" }
const FBold: React.CSSProperties = { fontFamily: "'Arial', sans-serif", fontWeight: 700 }
const FR: React.CSSProperties = { fontFamily: "'Arial', sans-serif" }

interface LiveryGeneratorProps {
  isOpen: boolean
  onClose: () => void
  carClassId: string
  teamName: string
  racingNumber: string
  sponsors: string[]
}

interface DesignStyle {
  id: string
  name: string
  description: string
}

type GenerationStatus = 'idle' | 'checking' | 'extracting' | 'generating' | 'converting' | 'success' | 'error'

const COLOR_PRESETS = [
  { name: 'Lamborghini Verde', primary: '#00FF00', secondary: '#000000', accent: '#FFD700' },
  { name: 'Racing Red', primary: '#CC0000', secondary: '#FFFFFF', accent: '#000000' },
  { name: 'Gulf Heritage', primary: '#75C2E2', secondary: '#FF6600', accent: '#FFFFFF' },
  { name: 'Martini Racing', primary: '#FFFFFF', secondary: '#0026A0', accent: '#E60012' },
  { name: 'Rothmans', primary: '#002B7F', secondary: '#FFFFFF', accent: '#FFD700' },
  { name: 'Camel Yellow', primary: '#FFB800', secondary: '#1A1A1A', accent: '#FFFFFF' },
  { name: 'McLaren Papaya', primary: '#FF8700', secondary: '#2E2E2E', accent: '#FFFFFF' },
  { name: 'British Racing Green', primary: '#004225', secondary: '#D4AF37', accent: '#FFFFFF' },
  { name: 'Porsche Pink', primary: '#FF69B4', secondary: '#FFFFFF', accent: '#000000' },
  { name: 'Midnight Purple', primary: '#301934', secondary: '#C0C0C0', accent: '#8B00FF' },
]

const BASE_LIVERY_OPTIONS = ['Default', 'Matte', 'Chrome', 'GreenMetallic', 'RedMetallic', 'BlueMetallic']

export function LiveryGenerator({ isOpen, onClose, carClassId, teamName, racingNumber, sponsors }: LiveryGeneratorProps) {
  const ams2Path = useSettingsStore((s) => s.ams2Path)

  const [designStyles, setDesignStyles] = useState<DesignStyle[]>([])
  const [selectedStyle, setSelectedStyle] = useState('geometric')
  const [primaryColor, setPrimaryColor] = useState('#00FF00')
  const [secondaryColor, setSecondaryColor] = useState('#000000')
  const [accentColor, setAccentColor] = useState('#FFD700')
  const [baseLivery, setBaseLivery] = useState('Default')
  const [liverySlot, setLiverySlot] = useState(51)
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [hasTemplate, setHasTemplate] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isOpen) return
    window.electron.getLiveryDesignStyles().then(setDesignStyles).catch(() => {})
    window.electron.checkLiveryTemplate(carClassId).then((r) => setHasTemplate(r.hasTemplate)).catch(() => setHasTemplate(false))
  }, [isOpen, carClassId])

  const handleExtractTemplate = async () => {
    if (!ams2Path) {
      setStatusMessage('AMS2 path not set. Go to Settings first.')
      setStatus('error')
      return
    }
    setStatus('extracting')
    setStatusMessage('Extracting UV template from game files...')
    try {
      const result = await window.electron.extractLiveryTemplate(carClassId, ams2Path)
      if (result.success) {
        setHasTemplate(true)
        setStatus('idle')
        setStatusMessage(`Template extracted! (${result.templateCount} liveries found)`)
      } else {
        setStatus('error')
        setStatusMessage(result.error || 'Extraction failed')
      }
    } catch (err: any) {
      setStatus('error')
      setStatusMessage(err.message || 'Extraction failed')
    }
  }

  const handleGenerate = async () => {
    if (!ams2Path) {
      setStatusMessage('AMS2 path not set. Go to Settings first.')
      setStatus('error')
      return
    }

    const apiKey = getNextGeminiApiKey()
    if (!apiKey) {
      setStatusMessage('No Gemini API key configured. Add one in Settings.')
      setStatus('error')
      return
    }

    setStatus('generating')
    setStatusMessage('Sending design to Gemini AI... This may take 30-60 seconds.')
    setPreviewImage(null)

    try {
      const result = await window.electron.generateLivery({
        carClassId,
        teamName,
        primaryColor,
        secondaryColor,
        accentColor,
        sponsors,
        designStyle: selectedStyle,
        racingNumber,
        liverySlot,
        baseLivery,
        gamePath: ams2Path,
        apiKey,
        additionalInstructions: additionalInstructions || undefined,
      })

      if (result.success) {
        setStatus('success')
        setStatusMessage(`Livery installed as "${result.overrideName}"`)
        if (result.previewBase64) {
          setPreviewImage(result.previewBase64)
        }
      } else {
        setStatus('error')
        setStatusMessage(result.error || 'Generation failed')
        if (result.previewBase64) {
          setPreviewImage(result.previewBase64)
        }
      }
    } catch (err: any) {
      setStatus('error')
      setStatusMessage(err.message || 'Generation failed')
    }
  }

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary)
    setSecondaryColor(preset.secondary)
    setAccentColor(preset.accent)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[24px]" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[20px] border-b-[1.6px] border-black">
          <div className="flex items-center gap-[12px]">
            <Palette className="w-[24px] h-[24px] text-black" />
            <h2 className="text-[20px] text-black" style={FB}>GENERATE AMS2 LIVERY</h2>
          </div>
          <button onClick={onClose} className="p-[4px] rounded-full hover:bg-black/5">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-[20px] space-y-[16px]">
          {/* Template Status */}
          {hasTemplate === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-[16px] flex items-start gap-[12px]">
              <AlertTriangle className="w-[20px] h-[20px] text-amber-500 flex-shrink-0 mt-[2px]" />
              <div className="flex-1">
                <p className="text-[14px] text-amber-800" style={FBold}>UV Template Required</p>
                <p className="text-[12px] text-amber-700 mt-[4px]" style={FR}>
                  The base texture needs to be extracted from AMS2 game files first. This is a one-time setup.
                </p>
                <button
                  onClick={handleExtractTemplate}
                  disabled={status === 'extracting'}
                  className="mt-[8px] bg-amber-600 text-white rounded-[10px] px-[16px] py-[8px] text-[12px] flex items-center gap-[6px] hover:bg-amber-700 disabled:opacity-50"
                  style={FB}
                >
                  {status === 'extracting' ? (
                    <><Loader2 className="w-[14px] h-[14px] animate-spin" /> EXTRACTING...</>
                  ) : (
                    'EXTRACT TEMPLATE'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewImage && (
            <div className="rounded-[14px] overflow-hidden border-[1.6px] border-black">
              <img src={previewImage} alt="Generated Livery UV" className="w-full h-auto" />
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-[16px]">
            {/* Left: Colors */}
            <div className="space-y-[12px]">
              <p className="text-[14px] text-black" style={FB}>COLORS</p>

              <div className="grid grid-cols-3 gap-[8px]">
                <div>
                  <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Primary</label>
                  <div className="flex items-center gap-[6px]">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-[36px] h-[36px] rounded-[8px] border border-black cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 text-[11px] border border-[#e5e7eb] rounded-[8px] px-[8px] py-[6px]"
                      style={FR}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Secondary</label>
                  <div className="flex items-center gap-[6px]">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-[36px] h-[36px] rounded-[8px] border border-black cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 text-[11px] border border-[#e5e7eb] rounded-[8px] px-[8px] py-[6px]"
                      style={FR}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Accent</label>
                  <div className="flex items-center gap-[6px]">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-[36px] h-[36px] rounded-[8px] border border-black cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 text-[11px] border border-[#e5e7eb] rounded-[8px] px-[8px] py-[6px]"
                      style={FR}
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-[11px] text-[#4a5565] block mb-[6px]" style={FR}>Quick Presets</label>
                <div className="flex flex-wrap gap-[4px]">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      title={p.name}
                      className="flex items-center gap-[2px] rounded-[6px] border border-[#e5e7eb] px-[6px] py-[3px] hover:border-black"
                    >
                      <span className="w-[10px] h-[10px] rounded-full border border-black/20" style={{ background: p.primary }} />
                      <span className="w-[10px] h-[10px] rounded-full border border-black/20" style={{ background: p.secondary }} />
                      <span className="w-[10px] h-[10px] rounded-full border border-black/20" style={{ background: p.accent }} />
                      <span className="text-[9px] text-[#6b7280] ml-[2px]" style={FR}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Design Options */}
            <div className="space-y-[12px]">
              <p className="text-[14px] text-black" style={FB}>DESIGN</p>

              <div>
                <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full border border-[#e5e7eb] rounded-[10px] px-[12px] py-[8px] text-[13px] text-black"
                  style={FR}
                >
                  {designStyles.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-[8px]">
                <div>
                  <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Paint Finish</label>
                  <select
                    value={baseLivery}
                    onChange={(e) => setBaseLivery(e.target.value)}
                    className="w-full border border-[#e5e7eb] rounded-[10px] px-[12px] py-[8px] text-[13px] text-black"
                    style={FR}
                  >
                    {BASE_LIVERY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Override Slot (Livery ID)</label>
                  <input
                    type="number"
                    value={liverySlot}
                    onChange={(e) => setLiverySlot(Number(e.target.value))}
                    min={1}
                    max={99}
                    className="w-full border border-[#e5e7eb] rounded-[10px] px-[12px] py-[8px] text-[13px] text-black"
                    style={FR}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#4a5565] block mb-[4px]" style={FR}>Additional Instructions (optional)</label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Chrome roof, carbon fiber splitter..."
                  className="w-full border border-[#e5e7eb] rounded-[10px] px-[12px] py-[8px] text-[13px] text-black resize-none"
                  style={FR}
                />
              </div>
            </div>
          </div>

          {/* Context Summary */}
          <div className="bg-[#f9fafb] rounded-[14px] p-[12px]">
            <p className="text-[11px] text-[#4a5565] mb-[4px]" style={FR}>LIVERY WILL BE GENERATED FOR:</p>
            <p className="text-[13px] text-black" style={FBold}>
              {teamName} #{racingNumber} — {carClassId}
            </p>
            {sponsors.length > 0 && (
              <p className="text-[11px] text-[#6b7280] mt-[2px]" style={FR}>
                Sponsors: {sponsors.slice(0, 5).join(', ')}{sponsors.length > 5 ? '...' : ''}
              </p>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`rounded-[10px] p-[12px] flex items-center gap-[8px] ${
              status === 'error' ? 'bg-red-50 text-red-700' :
              status === 'success' ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {status === 'generating' && <Loader2 className="w-[16px] h-[16px] animate-spin flex-shrink-0" />}
              {status === 'success' && <Check className="w-[16px] h-[16px] flex-shrink-0" />}
              {status === 'error' && <AlertTriangle className="w-[16px] h-[16px] flex-shrink-0" />}
              <p className="text-[12px]" style={FR}>{statusMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-[20px] border-t-[1.6px] border-black flex items-center justify-between">
          <p className="text-[11px] text-[#6b7280]" style={FR}>
            Uses Gemini 3 Pro Image to paint on the car's UV texture
          </p>
          <div className="flex items-center gap-[8px]">
            {previewImage && status === 'success' && (
              <button
                onClick={handleGenerate}
                className="bg-white border-[1.6px] border-black text-black rounded-[14px] px-[20px] h-[43px] flex items-center gap-[8px] hover:bg-[#f9fafb]"
                style={FB}
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                REGENERATE
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={status === 'generating' || status === 'extracting' || hasTemplate === false || !ams2Path}
              className="bg-black text-white rounded-[14px] px-[24px] h-[43px] flex items-center gap-[8px] disabled:opacity-40"
              style={FB}
            >
              {status === 'generating' ? (
                <><Loader2 className="w-[16px] h-[16px] animate-spin" /> GENERATING...</>
              ) : (
                <><Palette className="w-[16px] h-[16px]" /> GENERATE LIVERY</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
