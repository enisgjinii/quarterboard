import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Type, Download, Upload } from "lucide-react"
import * as THREE from 'three'

interface UVTextEditorProps {
  uvMap: string
  onTextUpdate: (texture: string) => void
}

export function UVTextEditor({ uvMap, onTextUpdate }: UVTextEditorProps) {
  const [text, setText] = useState("")
  const [fontSize, setFontSize] = useState(48)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#000000")
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [editedTexture, setEditedTexture] = useState<string | null>(null)

  const fonts = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana"
  ]

  const applyTextToUVMap = () => {
    const canvas = document.createElement('canvas')
    const size = 2048 // Higher resolution for better quality
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Load the original UV map
      const img = new Image()
      img.onload = () => {
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, size, size)
        
        // Draw the original UV map
        ctx.drawImage(img, 0, 0, size, size)

        // Apply text with improved visibility
        ctx.save()
        ctx.translate(position.x * size, position.y * size)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(scale, scale)
        
        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        
        ctx.font = `${fontSize}px ${fontFamily}`
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, 0, 0)
        
        ctx.restore()

        // Update texture
        const newTexture = canvas.toDataURL('image/png')
        setEditedTexture(newTexture)
        onTextUpdate(newTexture)
      }
      img.src = uvMap
    }
  }

  useEffect(() => {
    if (text) {
      applyTextToUVMap()
    }
  }, [text, fontSize, fontFamily, textColor, position, rotation, scale])

  const downloadTexture = () => {
    if (editedTexture) {
      const link = document.createElement('a')
      link.href = editedTexture
      link.download = 'uv_texture.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-sm">UV Text Editor</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="text-input">Text</Label>
          <Input
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-family">Font</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger id="font-family" className="h-8 text-sm">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font} className="text-sm">
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-size">Font Size</Label>
          <Slider
            id="font-size"
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={12}
            max={200}
            step={1}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="text-color"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 p-1"
            />
            <Input
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#000000"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Slider
                value={[position.x]}
                onValueChange={([value]) => setPosition(prev => ({ ...prev, x: value }))}
                min={0}
                max={1}
                step={0.01}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Slider
                value={[position.y]}
                onValueChange={([value]) => setPosition(prev => ({ ...prev, y: value }))}
                min={0}
                max={1}
                step={0.01}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rotation">Rotation</Label>
          <Slider
            id="rotation"
            value={[rotation]}
            onValueChange={([value]) => setRotation(value)}
            min={0}
            max={360}
            step={1}
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scale">Scale</Label>
          <Slider
            id="scale"
            value={[scale]}
            onValueChange={([value]) => setScale(value)}
            min={0.1}
            max={5}
            step={0.1}
            className="h-8"
          />
        </div>

        {editedTexture && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative group">
              <img
                src={editedTexture}
                alt="UV Texture Preview"
                className="w-full h-auto rounded border border-border"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={downloadTexture}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 