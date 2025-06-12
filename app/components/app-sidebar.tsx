"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Palette, Type, Upload, Trash2 } from "lucide-react"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
}

interface AppSidebarProps {
  modelUrl: string
  setModelUrl: (url: string) => void
  textureUrl: string | null
  setTextureUrl: (url: string | null) => void
  modelColor: string
  setModelColor: (color: string) => void
  uvMapUrl: string | null
  modelLoaded: boolean
  meshInfo: MeshInfo[]
}

export function AppSidebar({
  modelUrl,
  setModelUrl,
  textureUrl,
  setTextureUrl,
  modelColor,
  setModelColor,
  uvMapUrl,
  modelLoaded,  meshInfo,
}: AppSidebarProps) {
  // Text state
  const [textInput, setTextInput] = useState("SAMPLE TEXT")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [fontSize, setFontSize] = useState(120)
  const [textColor, setTextColor] = useState("#ffffff")
  const [textBgColor, setTextBgColor] = useState("#1a1a1a")
  const [isGenerating, setIsGenerating] = useState(false)

  // Text presets for quick selection
  const textPresets = [
    { text: "SAMPLE TEXT", bold: false, italic: false },
    { text: "CUSTOM", bold: true, italic: false },
    { text: "DESIGN", bold: false, italic: true },
    { text: "BRANDING", bold: true, italic: true },
  ]

  const handleModelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf"))) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }, [setModelUrl])
  
  const generateTextTexture = useCallback(async () => {
    if (!textInput.trim()) return

    setIsGenerating(true)
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 2048
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      // Clear and set background
      ctx.fillStyle = textBgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Configure text rendering with better quality
      let fontWeight = isBold ? 'bold' : 'normal'
      let fontStyle = isItalic ? 'italic' : 'normal'
      
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize * 2}px Arial, sans-serif`
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Enable text smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Add text shadow for better visibility and depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetX = 6
      ctx.shadowOffsetY = 6

      // Draw text
      const yPos = canvas.height / 2
      ctx.fillText(textInput, canvas.width / 2, yPos)

      // Add underline if needed
      if (isUnderline) {
        const textMetrics = ctx.measureText(textInput)
        const underlineY = yPos + fontSize * 2 * 0.15
        const underlineX = canvas.width / 2 - textMetrics.width / 2
        
        // Remove shadow for underline
        ctx.shadowColor = 'transparent'
        ctx.fillRect(underlineX, underlineY, textMetrics.width, fontSize * 2 * 0.08)
      }      // Add a subtle border/stroke to text for better definition
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = textColor === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.4
      ctx.strokeText(textInput, canvas.width / 2, yPos)
      ctx.globalAlpha = 1

      // Add a subtle glow effect
      ctx.shadowColor = textColor
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.globalAlpha = 0.3
      ctx.fillText(textInput, canvas.width / 2, yPos)
      ctx.globalAlpha = 1

      // Convert to data URL with high quality
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setTextureUrl(dataUrl)
    } finally {
      setIsGenerating(false)
    }
  }, [textInput, isBold, isItalic, isUnderline, fontSize, textColor, textBgColor, setTextureUrl])

  const clearTexture = useCallback(() => {
    setTextureUrl(null)
  }, [setTextureUrl])

  const downloadModel = useCallback(() => {
    const link = document.createElement("a")
    link.href = modelUrl
    link.download = "model.glb"
    link.click()
  }, [modelUrl])

  const downloadTexture = useCallback(() => {
    if (textureUrl) {
      const link = document.createElement("a")
      link.href = textureUrl
      link.download = "texture.png"
      link.click()
    }
  }, [textureUrl])

  const colorPresets = ["#D4A574", "#8B4513", "#2F4F4F", "#556B2F", "#B22222", "#4682B4", "#708090", "#000000"]

  return (
    <div className="w-80 h-full bg-background border-r flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Palette className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">3D Editor</h2>
            <p className="text-xs text-muted-foreground">Model Customization</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="color" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-4 bg-muted">
          <TabsTrigger value="color" className="text-xs font-medium">
            <Palette className="w-3 h-3 mr-1.5" />
            Style
          </TabsTrigger>
          <TabsTrigger value="text" className="text-xs font-medium">
            <Type className="w-3 h-3 mr-1.5" />
            Text
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs font-medium">
            <Download className="w-3 h-3 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* COLOR TAB */}
          <TabsContent value="color" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Model Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Upload Model</Label>
                  </div>
                  <Input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleModelUpload}
                    className="text-xs cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>

                <Separator />

                {/* Color Picker */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Model Color</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="w-12 h-9 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="flex-1 text-xs font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>                {/* Color Presets */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Color Presets</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((color, index) => (
                      <Button
                        key={index}
                        variant={modelColor === color ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-full p-0 border-2 hover:scale-105 transition-all duration-200 ${
                          modelColor === color ? 'ring-2 ring-primary/20' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setModelColor(color)}
                        title={`Apply color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Applied Texture */}
                {textureUrl && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Applied Texture</Label>
                      <div className="space-y-3">
                        <div className="relative">
                          <img 
                            src={textureUrl} 
                            alt="Applied texture" 
                            className="w-full h-24 object-cover rounded-md border"
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={clearTexture}
                          className="w-full text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Remove Texture
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEXT TAB */}
          <TabsContent value="text" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">                {/* Text Input */}
                <div>
                  <Label htmlFor="text-input" className="text-sm font-medium mb-2 block">Text Content</Label>
                  <Input
                    id="text-input"
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter your text..."
                    className="text-sm"
                  />
                </div>

                {/* Text Presets */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {textPresets.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setTextInput(preset.text)
                          setIsBold(preset.bold)
                          setIsItalic(preset.italic)
                        }}
                      >
                        <span className={`${preset.bold ? 'font-bold' : ''} ${preset.italic ? 'italic' : ''}`}>
                          {preset.text}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />{/* Text Style */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Text Style</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={isBold ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsBold(!isBold)}
                      className="h-9 font-bold transition-all duration-200"
                      title="Toggle Bold"
                    >
                      B
                    </Button>
                    <Button
                      variant={isItalic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsItalic(!isItalic)}
                      className="h-9 italic transition-all duration-200"
                      title="Toggle Italic"
                    >
                      I
                    </Button>
                    <Button
                      variant={isUnderline ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsUnderline(!isUnderline)}
                      className="h-9 underline transition-all duration-200"
                      title="Toggle Underline"
                    >
                      U
                    </Button>
                  </div>
                </div>                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Font Size</Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
                      {fontSize}px
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="60"
                    max="200"
                    step="10"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>60px</span>
                    <span>200px</span>
                  </div>
                </div>                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Text Color</Label>
                    <div className="space-y-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-10 p-1 rounded cursor-pointer border"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="text-xs font-mono uppercase"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Background</Label>
                    <div className="space-y-2">
                      <Input
                        type="color"
                        value={textBgColor}
                        onChange={(e) => setTextBgColor(e.target.value)}
                        className="w-full h-10 p-1 rounded cursor-pointer border"
                      />
                      <Input
                        type="text"
                        value={textBgColor}
                        onChange={(e) => setTextBgColor(e.target.value)}
                        className="text-xs font-mono uppercase"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>{/* Preview */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="w-full h-20 bg-muted rounded-md border flex items-center justify-center relative overflow-hidden">
                    <span className={`text-sm ${isBold ? 'font-bold' : 'font-normal'} ${isItalic ? 'italic' : 'not-italic'} ${isUnderline ? 'underline' : 'no-underline'} text-foreground`}>
                      {textInput || 'Sample Text'}
                    </span>
                  </div>
                </div>                {/* Apply Button */}
                <Button
                  onClick={generateTextTexture}
                  disabled={!textInput.trim() || isGenerating}
                  className="w-full transition-all duration-200 hover:scale-[1.02]"
                  size="sm"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Type className="w-3 h-3 mr-1.5" />
                      Apply Text to Model
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>          {/* EXPORT TAB */}
          <TabsContent value="export" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Download Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={downloadModel} 
                    variant="outline" 
                    className="w-full justify-start hover:bg-muted/50 transition-colors" 
                    size="sm"
                    disabled={!modelLoaded}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Model (.glb)
                  </Button>
                  
                  <Button 
                    onClick={downloadTexture} 
                    disabled={!textureUrl}
                    variant="outline" 
                    className="w-full justify-start hover:bg-muted/50 transition-colors"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Texture (.png)
                    {textureUrl && <span className="ml-auto text-xs text-muted-foreground">2048×2048</span>}
                  </Button>
                </div>

                <Separator />

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Project Status</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md border">
                      <span className="text-xs font-medium">Model Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${modelLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-medium">
                          {modelLoaded ? 'Loaded' : 'Not Loaded'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md border">
                      <span className="text-xs font-medium">Texture Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${textureUrl ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <span className="text-xs font-medium">
                          {textureUrl ? 'Applied' : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>                {/* Model Info */}
                {meshInfo?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Model Information</Label>
                      <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Vertices:</span>
                          <span className="font-mono text-foreground">{meshInfo[0]?.vertices?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Faces:</span>
                          <span className="font-mono text-foreground">{meshInfo[0]?.faces?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Name:</span>
                          <span className="font-mono text-foreground truncate max-w-32" title={meshInfo[0]?.name}>
                            {meshInfo[0]?.name}
                          </span>
                        </div>
                        {meshInfo[0]?.materials?.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Materials:</span>
                            <span className="font-mono text-foreground text-right">{meshInfo[0]?.materials?.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}