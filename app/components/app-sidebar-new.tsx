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
  modelLoaded,
  meshInfo,
}: AppSidebarProps) {
  // Text state
  const [textInput, setTextInput] = useState("SAMPLE TEXT")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [fontSize, setFontSize] = useState(120)
  const [textColor, setTextColor] = useState("#ffffff")
  const [textBgColor, setTextBgColor] = useState("#1a1a1a")

  const handleModelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf"))) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }, [setModelUrl])

  const generateTextTexture = useCallback(() => {
    if (!textInput.trim()) return

    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 2048
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Clear and set background
    ctx.fillStyle = textBgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Configure text rendering
    let fontWeight = isBold ? 'bold' : 'normal'
    let fontStyle = isItalic ? 'italic' : 'normal'
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize * 2}px Arial, sans-serif`
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 4

    // Draw text
    const yPos = canvas.height / 2
    ctx.fillText(textInput, canvas.width / 2, yPos)

    // Add underline if needed
    if (isUnderline) {
      const textMetrics = ctx.measureText(textInput)
      const underlineY = yPos + fontSize * 2 * 0.15
      const underlineX = canvas.width / 2 - textMetrics.width / 2
      
      ctx.shadowColor = 'transparent'
      ctx.fillRect(underlineX, underlineY, textMetrics.width, fontSize * 2 * 0.08)
    }

    // Convert to data URL and apply
    const dataUrl = canvas.toDataURL('image/png', 0.9)
    setTextureUrl(dataUrl)
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
                </div>

                {/* Color Presets */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Color Presets</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((color, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-8 w-full p-0 border-2 hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setModelColor(color)}
                        title={color}
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
                    <Label className="text-xs font-medium mb-2 block">Background</Label>
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

                {/* Preview */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <div className="w-full h-20 bg-muted rounded-md border flex items-center justify-center">
                    <span 
                      className={`text-sm ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}
                      style={{ color: textColor }}
                    >
                      {textInput || 'Preview Text'}
                    </span>
                  </div>
                </div>

                {/* Apply Button */}
                <Button
                  onClick={generateTextTexture}
                  disabled={!textInput.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Type className="w-3 h-3 mr-1.5" />
                  Apply Text to Model
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Download Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={downloadModel} 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Model (.glb)
                  </Button>
                  
                  <Button 
                    onClick={downloadTexture} 
                    disabled={!textureUrl}
                    variant="outline" 
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Download Texture (.png)
                  </Button>
                </div>

                <Separator />

                {/* Status */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Project Status</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <span className="text-xs">Model Status</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${modelLoaded ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs font-medium">
                          {modelLoaded ? 'Loaded' : 'Not Loaded'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <span className="text-xs">Texture Status</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${textureUrl ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs font-medium">
                          {textureUrl ? 'Applied' : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Info */}
                {meshInfo?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Model Information</Label>
                      <div className="space-y-1 text-xs text-muted-foreground bg-muted p-3 rounded-md">
                        <div className="flex justify-between">
                          <span>Vertices:</span>
                          <span className="font-mono">{meshInfo[0]?.vertices?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Faces:</span>
                          <span className="font-mono">{meshInfo[0]?.faces?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-mono truncate max-w-24">{meshInfo[0]?.name}</span>
                        </div>
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
