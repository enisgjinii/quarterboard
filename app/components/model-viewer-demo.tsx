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

export function ModelViewerDemo() {
  const [materialText, setMaterialText] = useState("CUSTOM TEXT")
  const [textColor, setTextColor] = useState("#ffffff")
  const [backgroundColor, setBackgroundColor] = useState("transparent")
  const [fontSize, setFontSize] = useState([64])
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif")
  const [textureRepeatU, setTextureRepeatU] = useState([1])
  const [textureRepeatV, setTextureRepeatV] = useState([1])
  const [targetMesh, setTargetMesh] = useState<string | undefined>(undefined)

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

  return (
    <div className="w-full h-screen flex">
      {/* Controls Panel */}
      <div className="w-80 p-4 bg-background border-r overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Text Texture Controls</CardTitle>
            <CardDescription>
              Apply text directly to the 3D model material as a texture
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

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMaterialText("SAMPLE TEXT")
                    setTextColor("#ffffff")
                    setBackgroundColor("#000000")
                    setFontSize([48])
                  }}
                >
                  White on Black
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMaterialText("CUSTOM LOGO")
                    setTextColor("#ff0000")
                    setBackgroundColor("transparent")
                    setFontSize([72])
                  }}
                >
                  Red Text
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 h-full">
        <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
          <ModelViewer
            modelPath="/models/quarterboard.glb"
            color="#8B4513"
            isPreviewMode={false}
            materialText={materialText}
            materialTextOptions={materialTextOptions}
            targetMeshName={targetMesh}
            textureRepeat={textureRepeat}
          />
        </Canvas>
      </div>
    </div>
  )
}
