"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Palette, Type, Upload, Trash2, Bold, Italic, Underline, Loader2, Layers, Grid, Maximize2, Minimize2, RotateCcw, RotateCw, Move, Scale, AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
  materialData?: Array<{
    color?: string
    roughness?: number
    metalness?: number
    map?: string
  }>
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
  selectedMaterial: string | null
  setSelectedMaterial: (material: string | null) => void
  materialPreview: string | null
  setMaterialPreview: (preview: string | null) => void
  isPreviewMode: boolean
  setIsPreviewMode: (mode: boolean) => void
}

export function AppSidebar({
  modelUrl,
  setModelUrl,
  textureUrl,
  setTextureUrl,
  modelColor,
  setModelColor,
  uvMapUrl,
  modelLoaded,
  meshInfo,
  selectedMaterial,
  setSelectedMaterial,
  materialPreview,
  setMaterialPreview,
  isPreviewMode,
  setIsPreviewMode
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
  const [textPosition, setTextPosition] = useState({ x: 0.5, y: 0.5 })
  const [textRotation, setTextRotation] = useState(0)
  const [textScale, setTextScale] = useState(1)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null)
  const [debugInfo, setDebugInfo] = useState({
    textureSize: "2048x2048",
    textMetrics: { width: 0, height: 0 },
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1
  })
  const [zIndex, setZIndex] = useState(0)
  const [isExtractingUV, setIsExtractingUV] = useState(false)
  const [uvProgress, setUvProgress] = useState(0)
  const [showGrid, setShowGrid] = useState(true)
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center')
  const [verticalAlignment, setVerticalAlignment] = useState<'top' | 'middle' | 'bottom'>('middle')
  const [textOpacity, setTextOpacity] = useState(100)
  const [textShadow, setTextShadow] = useState({
    enabled: true,
    blur: 4,
    offsetX: 2,
    offsetY: 2,
    color: 'rgba(0,0,0,0.5)'
  })

  // Text presets for quick selection
  const textPresets = [
    { text: "SAMPLE TEXT", bold: false, italic: false },
    { text: "CUSTOM", bold: true, italic: false },
    { text: "DESIGN", bold: false, italic: true },
    { text: "BRANDING", bold: true, italic: true },
  ]

  const fontFamilies = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Impact",
    "Comic Sans MS"
  ]

  // Create preview canvas on mount
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 200
    setPreviewCanvas(canvas)
  }, [])

  // Update preview and debug info whenever text properties change
  useEffect(() => {
    if (!previewCanvas) return

    const ctx = previewCanvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = textBgColor
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height)

    // Configure text rendering
    let fontWeight = isBold ? 'bold' : 'normal'
    let fontStyle = isItalic ? 'italic' : 'normal'
    const previewFontSize = fontSize * (previewCanvas.width / 2048) // Scale font size for preview
    
    ctx.font = `${fontStyle} ${fontWeight} ${previewFontSize}px ${fontFamily}, sans-serif`
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Apply transformations
    ctx.save()
    ctx.translate(previewCanvas.width * textPosition.x, previewCanvas.height * textPosition.y)
    ctx.rotate(textRotation * Math.PI / 180)
    ctx.scale(textScale, textScale)

    // Draw text
    ctx.fillText(textInput, 0, 0)

    // Get text metrics
    const metrics = ctx.measureText(textInput)
    const textHeight = previewFontSize

    // Update debug info only if values have changed
    const newDebugInfo = {
      textureSize: "2048x2048",
      textMetrics: {
        width: Math.round(metrics.width * (2048 / previewCanvas.width)),
        height: Math.round(textHeight * (2048 / previewCanvas.height))
      },
      position: {
        x: Math.round(textPosition.x * 100),
        y: Math.round(textPosition.y * 100)
      },
      rotation: Math.round(textRotation),
      scale: Math.round(textScale * 100) / 100
    }

    // Only update if values have actually changed
    if (JSON.stringify(newDebugInfo) !== JSON.stringify(debugInfo)) {
      setDebugInfo(newDebugInfo)
    }

    ctx.restore()
  }, [
    textInput,
    isBold,
    isItalic,
    isUnderline,
    fontSize,
    textColor,
    textBgColor,
    textPosition,
    textRotation,
    textScale,
    fontFamily,
    previewCanvas
  ])

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
      
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize * 2}px ${fontFamily}, sans-serif`
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

      // Apply transformations
      ctx.save()
      ctx.translate(canvas.width * textPosition.x, canvas.height * textPosition.y)
      ctx.rotate(textRotation * Math.PI / 180)
      ctx.scale(textScale, textScale)

      // Draw text
      ctx.fillText(textInput, 0, 0)

      // Add underline if needed
      if (isUnderline) {
        const textMetrics = ctx.measureText(textInput)
        const underlineY = fontSize * 2 * 0.15
        const underlineX = -textMetrics.width / 2
        
        ctx.shadowColor = 'transparent'
        ctx.fillRect(underlineX, underlineY, textMetrics.width, fontSize * 2 * 0.08)
      }

      // Add a subtle border/stroke to text
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = textColor === '#ffffff' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.4
      ctx.strokeText(textInput, 0, 0)
      ctx.globalAlpha = 1

      // Add a subtle glow effect
      ctx.shadowColor = textColor
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      ctx.globalAlpha = 0.3
      ctx.fillText(textInput, 0, 0)
      
      ctx.restore()

      // Convert to data URL with high quality
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setTextureUrl(dataUrl)
    } finally {
      setIsGenerating(false)
    }
  }, [textInput, isBold, isItalic, isUnderline, fontSize, textColor, textBgColor, textPosition, textRotation, textScale, fontFamily, setTextureUrl])

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

  const extractUVMap = useCallback(async () => {
    if (!modelLoaded) return
    
    setIsExtractingUV(true)
    setUvProgress(0)
    
    try {
      // Simulate UV extraction process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUvProgress(i)
      }
      
      // TODO: Implement actual UV extraction logic here
      // This would involve analyzing the model's geometry and generating a UV map
      
    } catch (error) {
      console.error('Error extracting UV map:', error)
    } finally {
      setIsExtractingUV(false)
      setUvProgress(0)
    }
  }, [modelLoaded])

  return (
    <div className="w-80 h-full bg-background border-r flex flex-col shadow-sm">
      {/* Header - Fixed */}
      <div className="p-4 border-b bg-muted/50 flex-shrink-0">
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

      {/* Tabs - Fixed */}
      <div className="flex-shrink-0">
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid grid-cols-4 mx-4 mt-4 bg-muted">
            <TabsTrigger value="color" className="text-xs font-medium">
              <Palette className="w-3 h-3 mr-1.5" />
              Style
            </TabsTrigger>
            <TabsTrigger value="text" className="text-xs font-medium">
              <Type className="w-3 h-3 mr-1.5" />
              Text
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-xs font-medium">
              <Layers className="w-3 h-3 mr-1.5" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs font-medium">
              <Download className="w-3 h-3 mr-1.5" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto h-[calc(100vh-8rem)]">
            <div className="p-4 space-y-4">
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
                    </div>

                    {/* Color Presets */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Color Presets</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map((color, index) => (
                          <Button
                            key={index}
                            variant={modelColor === color ? "default" : "outline"}
                            size="sm"
                            className={`h-8 ${
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
                  <CardContent className="p-4 space-y-4">
                    {/* Text Input */}
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

                    <Separator />

                    {/* Text Style */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Text Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={isBold ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsBold(!isBold)}
                          className="h-9 font-bold"
                        >
                          B
                        </Button>
                        <Button
                          variant={isItalic ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsItalic(!isItalic)}
                          className="h-9 italic"
                        >
                          I
                        </Button>
                        <Button
                          variant={isUnderline ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsUnderline(!isUnderline)}
                          className="h-9 underline"
                        >
                          U
                        </Button>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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
                        className="cursor-pointer"
                      />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Text Color</Label>
                        <div className="space-y-2">
                          <Input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-full h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-2 block">Background Color</Label>
                        <div className="space-y-2">
                          <Input
                            type="color"
                            value={textBgColor}
                            onChange={(e) => setTextBgColor(e.target.value)}
                            className="w-full h-8 p-1 rounded cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={textBgColor}
                            onChange={(e) => setTextBgColor(e.target.value)}
                            className="text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      className="w-full"
                      onClick={generateTextTexture}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Type className="mr-2 h-4 w-4" />
                          Generate Texture
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MATERIALS TAB */}
              <TabsContent value="materials" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Model Materials</CardTitle>
                        <CardDescription>View and manage materials from your 3D model</CardDescription>
                      </div>
                      {selectedMaterial && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPreviewMode(!isPreviewMode)}
                          className="text-xs"
                        >
                          {isPreviewMode ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1.5" />
                              Exit Preview
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1.5" />
                              Preview Material
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {modelLoaded ? (
                      <div className="space-y-4">
                        {/* Material List */}
                        {meshInfo.map((mesh, meshIndex) => (
                          <div key={meshIndex} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">{mesh.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {mesh.materials.length} materials
                              </Badge>
                            </div>
                            
                            {/* Material Details */}
                            <div className="space-y-2">
                              {mesh.materials.map((material, materialIndex) => {
                                const materialId = `${mesh.name}_${materialIndex}`
                                const isSelected = selectedMaterial === materialId
                                const materialData = mesh.materialData?.[materialIndex]

                                return (
                                  <div 
                                    key={materialIndex}
                                    className={`p-3 bg-muted/50 rounded-md border space-y-2 transition-colors ${
                                      isSelected ? 'ring-2 ring-primary/20' : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium">Material {materialIndex + 1}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {material}
                                      </Badge>
                                    </div>
                                    
                                    {/* Material Preview */}
                                    {materialData && (
                                      <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                                        <img
                                          src={materialData.map || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#${materialData.color || 'ffffff'}"/></svg>`}
                                          alt={`Material ${materialIndex + 1} preview`}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-xs text-white">
                                          <div>Roughness: {materialData.roughness?.toFixed(2)}</div>
                                          <div>Metalness: {materialData.metalness?.toFixed(2)}</div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Material Properties */}
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                      <div className="space-y-1">
                                        <div className="font-medium">Properties</div>
                                        <div>Type: {material.includes('Standard') ? 'Standard' : 'Custom'}</div>
                                        <div>UV Sets: {mesh.uvSets.length}</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="font-medium">Geometry</div>
                                        <div>Vertices: {mesh.vertices.toLocaleString()}</div>
                                        <div>Faces: {mesh.faces.toLocaleString()}</div>
                                      </div>
                                    </div>

                                    {/* Material Actions */}
                                    <div className="flex gap-2 pt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => {
                                          // TODO: Implement material extraction
                                          console.log(`Extracting material: ${material}`)
                                        }}
                                      >
                                        <Download className="w-3 h-3 mr-1.5" />
                                        Extract
                                      </Button>
                                      <Button
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => {
                                          setSelectedMaterial(isSelected ? null : materialId)
                                          if (!isSelected) {
                                            setMaterialPreview(materialData?.map || null)
                                            setIsPreviewMode(false)
                                          }
                                        }}
                                      >
                                        <Eye className="w-3 h-3 mr-1.5" />
                                        {isSelected ? 'Selected' : 'Select'}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}

                        {/* Material Statistics */}
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <h3 className="text-sm font-medium mb-2">Material Statistics</h3>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Total Materials</div>
                              <div className="font-medium">
                                {meshInfo.reduce((acc, mesh) => acc + mesh.materials.length, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Unique Materials</div>
                              <div className="font-medium">
                                {new Set(meshInfo.flatMap(mesh => mesh.materials)).size}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Load a 3D model to view materials</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPORT TAB */}
              <TabsContent value="export" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>Download your model and textures</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      {/* Model Status */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md border">
                          <span className="text-xs font-medium">Model Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${modelLoaded ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            <span className="text-xs font-medium">
                              {modelLoaded ? 'Loaded' : 'Not Loaded'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Texture Status */}
                      <div className="space-y-2">
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

                      {/* Export Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadModel}
                          disabled={!modelLoaded}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Model
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTexture}
                          disabled={!textureUrl}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Texture
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}