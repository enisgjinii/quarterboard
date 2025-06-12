"use client"

import { Canvas } from "@react-three/fiber"
import { ModelViewer } from "./model-viewer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function EnhancedModelViewerDemo() {
  // Model and color controls
  const [modelColor, setModelColor] = useState("#8B4513")
  const [borderColor, setBorderColor] = useState("#FFD700")
  const [colorMode, setColorMode] = useState<'solid' | 'textTexture' | 'mixed'>('solid')
  
  // Text texture controls
  const [materialText, setMaterialText] = useState("CUSTOM TEXT")
  const [textColor, setTextColor] = useState("#ffffff")
  const [backgroundColor, setBackgroundColor] = useState("transparent")
  const [fontSize, setFontSize] = useState([48])
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif")
  const [textureRepeatU, setTextureRepeatU] = useState([1])
  const [textureRepeatV, setTextureRepeatV] = useState([1])
  const [targetMesh, setTargetMesh] = useState<string | undefined>(undefined)

  // 3D Text controls
  const [text3D, setText3D] = useState("")
  const [text3DColor, setText3DColor] = useState("#ffffff")
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0.5, z: 0 })
  const [textScale, setTextScale] = useState({ x: 1.2, y: 1.2, z: 1.2 })
  const [textRotation, setTextRotation] = useState({ x: 0, y: 0, z: 0 })
  const [enableTextPlacement, setEnableTextPlacement] = useState(false)
  
  // Preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const materialTextOptions = {
    fontSize: fontSize[0],
    fontFamily,
    textColor,
    backgroundColor: backgroundColor === "transparent" ? "transparent" : backgroundColor,
    width: 512,
    height: 512,
    padding: 20
  }

  const textureRepeat = {
    u: textureRepeatU[0],
    v: textureRepeatV[0]
  }

  const text3DOptions = {
    size: 0.1,
    height: 0.02,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.001,
    bevelOffset: 0,
    bevelSegments: 3
  }

  const handleTextPositionChange = (newPosition: { x: number; y: number; z: number }) => {
    setTextPosition(newPosition)
  }

  return (
    <div className="w-full h-screen flex">
      {/* Controls Panel */}
      <div className="w-96 p-4 bg-background border-r overflow-y-auto">
        <div className="space-y-4">
          {/* Preview Mode Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">View Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="preview-mode"
                  checked={isPreviewMode}
                  onCheckedChange={setIsPreviewMode}
                />
                <Label htmlFor="preview-mode">Preview Mode (Hide Grid)</Label>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="model" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="texture">Texture</TabsTrigger>
              <TabsTrigger value="3d-text">3D Text</TabsTrigger>
            </TabsList>

            {/* Model Controls */}
            <TabsContent value="model" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Colors</CardTitle>
                  <CardDescription>
                    Control the colors and appearance of your 3D model
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="colorMode">Color Mode</Label>
                    <Select value={colorMode} onValueChange={(value: any) => setColorMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="textTexture">Text Texture Only</SelectItem>
                        <SelectItem value="mixed">Mixed (Text + Color)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model Color */}
                  <div className="space-y-2">
                    <Label htmlFor="modelColor">Model Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="modelColor"
                        type="color"
                        value={modelColor}
                        onChange={(e) => setModelColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={modelColor}
                        onChange={(e) => setModelColor(e.target.value)}
                        placeholder="#8B4513"
                      />
                    </div>
                  </div>

                  {/* Border Color */}
                  <div className="space-y-2">
                    <Label htmlFor="borderColor">Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="borderColor"
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        placeholder="#FFD700"
                      />
                    </div>
                  </div>

                  {/* Quick Color Presets */}
                  <div className="space-y-2">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModelColor("#8B4513")
                          setBorderColor("#FFD700")
                        }}
                      >
                        Wood & Gold
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModelColor("#2C3E50")
                          setBorderColor("#E74C3C")
                        }}
                      >
                        Dark & Red
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModelColor("#FFFFFF")
                          setBorderColor("#000000")
                        }}
                      >
                        White & Black
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModelColor("#1E40AF")
                          setBorderColor("#FBBF24")
                        }}
                      >
                        Blue & Yellow
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Texture Controls */}
            <TabsContent value="texture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Text Texture</CardTitle>
                  <CardDescription>
                    Apply text directly to the model surface as a texture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text">Text Content</Label>
                    <Input
                      id="text"
                      value={materialText}
                      onChange={(e) => setMaterialText(e.target.value)}
                      placeholder="Enter text to display on model"
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      min={20}
                      max={120}
                      step={4}
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label htmlFor="font">Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                        <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-2">
                    <Label htmlFor="bgColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bgColor"
                        type="color"
                        value={backgroundColor === "transparent" ? "#000000" : backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Button
                        variant={backgroundColor === "transparent" ? "default" : "outline"}
                        onClick={() => setBackgroundColor("transparent")}
                        size="sm"
                      >
                        Transparent
                      </Button>
                    </div>
                  </div>

                  {/* Texture Repeat */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Texture Repeat U: {textureRepeatU[0]}</Label>
                      <Slider
                        value={textureRepeatU}
                        onValueChange={setTextureRepeatU}
                        min={0.1}
                        max={5}
                        step={0.1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Texture Repeat V: {textureRepeatV[0]}</Label>
                      <Slider
                        value={textureRepeatV}
                        onValueChange={setTextureRepeatV}
                        min={0.1}
                        max={5}
                        step={0.1}
                      />
                    </div>
                  </div>

                  {/* Target Mesh */}
                  <div className="space-y-2">
                    <Label htmlFor="targetMesh">Target Mesh (Optional)</Label>
                    <Input
                      id="targetMesh"
                      value={targetMesh || ""}
                      onChange={(e) => setTargetMesh(e.target.value || undefined)}
                      placeholder="Leave empty for all meshes"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3D Text Controls */}
            <TabsContent value="3d-text" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>3D Text Object</CardTitle>
                  <CardDescription>
                    Add floating 3D text that can be positioned anywhere
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 3D Text Input */}
                  <div className="space-y-2">
                    <Label htmlFor="text3d">3D Text</Label>
                    <Input
                      id="text3d"
                      value={text3D}
                      onChange={(e) => setText3D(e.target.value)}
                      placeholder="Enter 3D text"
                    />
                  </div>

                  {/* 3D Text Color */}
                  <div className="space-y-2">
                    <Label htmlFor="text3dColor">3D Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text3dColor"
                        type="color"
                        value={text3DColor}
                        onChange={(e) => setText3DColor(e.target.value)}
                        className="w-16 h-10"
                      />
                      <Input
                        value={text3DColor}
                        onChange={(e) => setText3DColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  {/* Interactive Placement */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="interactive-placement"
                      checked={enableTextPlacement}
                      onCheckedChange={setEnableTextPlacement}
                    />
                    <Label htmlFor="interactive-placement">Interactive Placement</Label>
                  </div>

                  <Separator />

                  {/* Position Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Position</h4>
                    <div className="space-y-2">
                      <Label>X: {textPosition.x.toFixed(2)}</Label>
                      <Slider
                        value={[textPosition.x]}
                        onValueChange={(value) => setTextPosition(prev => ({ ...prev, x: value[0] }))}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y: {textPosition.y.toFixed(2)}</Label>
                      <Slider
                        value={[textPosition.y]}
                        onValueChange={(value) => setTextPosition(prev => ({ ...prev, y: value[0] }))}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Z: {textPosition.z.toFixed(2)}</Label>
                      <Slider
                        value={[textPosition.z]}
                        onValueChange={(value) => setTextPosition(prev => ({ ...prev, z: value[0] }))}
                        min={-2}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Scale Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Scale</h4>
                    <div className="space-y-2">
                      <Label>Scale: {textScale.x.toFixed(1)}</Label>
                      <Slider
                        value={[textScale.x]}
                        onValueChange={(value) => setTextScale({ x: value[0], y: value[0], z: value[0] })}
                        min={0.1}
                        max={3}
                        step={0.1}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Rotation Controls */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Rotation</h4>
                    <div className="space-y-2">
                      <Label>Y Rotation: {(textRotation.y * 180 / Math.PI).toFixed(0)}°</Label>
                      <Slider
                        value={[textRotation.y * 180 / Math.PI]}
                        onValueChange={(value) => setTextRotation(prev => ({ ...prev, y: value[0] * Math.PI / 180 }))}
                        min={-180}
                        max={180}
                        step={15}
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTextPosition({ x: 0, y: 0.5, z: 0 })
                      setTextScale({ x: 1.2, y: 1.2, z: 1.2 })
                      setTextRotation({ x: 0, y: 0, z: 0 })
                    }}
                    className="w-full"
                  >
                    Reset Position & Scale
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 h-full">
        <Canvas shadows camera={{ position: [8, 6, 8], fov: 60 }}>
          <ModelViewer
            modelPath="/models/quarterboard.glb"
            color={modelColor}
            borderColor={borderColor}
            colorMode={colorMode}
            isPreviewMode={isPreviewMode}
            materialText={materialText}
            materialTextOptions={materialTextOptions}
            targetMeshName={targetMesh}
            textureRepeat={textureRepeat}
            text3D={text3D}
            textColor={text3DColor}
            textPosition={textPosition}
            textScale={textScale}
            textRotation={textRotation}
            text3DOptions={text3DOptions}
            enableTextPlacement={enableTextPlacement}
            onTextPositionChange={handleTextPositionChange}
          />
        </Canvas>
      </div>
    </div>
  )
}
