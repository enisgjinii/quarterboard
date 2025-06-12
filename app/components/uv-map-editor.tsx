"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UVMapEditorProps {
  onTextUpdate: (text: string, options: TextOptions) => void
  uvMapUrl: string
}

interface TextOptions {
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  position: { x: number; y: number }
  rotation: number
  scale: number
}

export function UVMapEditor({ onTextUpdate, uvMapUrl }: UVMapEditorProps) {
  const [text, setText] = useState("")
  const [options, setOptions] = useState<TextOptions>({
    fontSize: 48,
    fontFamily: "Arial",
    textColor: "#ffffff",
    backgroundColor: "transparent",
    position: { x: 0.5, y: 0.5 },
    rotation: 0,
    scale: 1
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Load UV map
    const uvMap = new Image()
    uvMap.src = uvMapUrl
    uvMap.onload = () => {
      // Set canvas size to match UV map
      canvas.width = uvMap.width
      canvas.height = uvMap.height

      // Draw UV map
      ctx.drawImage(uvMap, 0, 0)

      // Draw text
      drawText(ctx)
    }
  }, [text, options, uvMapUrl])

  const drawText = (ctx: CanvasRenderingContext2D) => {
    if (!text) return

    ctx.save()
    ctx.translate(options.position.x * ctx.canvas.width, options.position.y * ctx.canvas.height)
    ctx.rotate(options.rotation * Math.PI / 180)
    ctx.scale(options.scale, options.scale)

    // Set text properties
    ctx.font = `${options.fontSize}px ${options.fontFamily}`
    ctx.fillStyle = options.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Draw text
    ctx.fillText(text, 0, 0)
    ctx.restore()

    // Notify parent component of changes
    onTextUpdate(text, options)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvas.width
    const y = (e.clientY - rect.top) / canvas.height

    setIsDragging(true)
    setDragStart({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / canvas.width
    const y = (e.clientY - rect.top) / canvas.height

    setOptions(prev => ({
      ...prev,
      position: {
        x: prev.position.x + (x - dragStart.x),
        y: prev.position.y + (y - dragStart.y)
      }
    }))

    setDragStart({ x, y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>UV Map Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Slider
              id="fontSize"
              value={[options.fontSize]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, fontSize: value }))}
              min={12}
              max={200}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <Input
              id="textColor"
              type="color"
              value={options.textColor}
              onChange={(e) => setOptions(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-full h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rotation">Rotation</Label>
            <Slider
              id="rotation"
              value={[options.rotation]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, rotation: value }))}
              min={-180}
              max={180}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scale">Scale</Label>
            <Slider
              id="scale"
              value={[options.scale]}
              onValueChange={([value]) => setOptions(prev => ({ ...prev, scale: value }))}
              min={0.1}
              max={5}
              step={0.1}
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 