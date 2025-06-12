"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface TextTextureGeneratorProps {
  text: string
  style: string
  color: string
  backgroundColor: string
  onTextureGenerated: (textureUrl: string) => void
}

const TextTextureGenerator: React.FC<TextTextureGeneratorProps> = ({
  text,
  style,
  color,
  backgroundColor,
  onTextureGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 2048
    canvas.height = 2048

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Configure text style based on selected style
    let fontSize = 200
    let fontFamily = "Arial"
    let fontWeight = "normal"
    let letterSpacing = 0
    let textAlign: CanvasTextAlign = "center"
    let textBaseline: CanvasTextBaseline = "middle"

    switch (style) {
      case "Modern":
        fontFamily = "Helvetica"
        fontWeight = "bold"
        letterSpacing = 2
        break
      case "Classic":
        fontFamily = "Times New Roman"
        fontSize = 180
        letterSpacing = 1
        break
      case "Handwritten":
        fontFamily = "Brush Script MT"
        fontSize = 220
        letterSpacing = 3
        break
      case "Industrial":
        fontFamily = "Impact"
        fontSize = 190
        letterSpacing = 4
        break
      case "Minimal":
        fontFamily = "Arial"
        fontWeight = "300"
        fontSize = 170
        letterSpacing = 0
        break
    }

    // Set text properties
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline
    ctx.letterSpacing = `${letterSpacing}px`

    // Add text shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5

    // Draw text
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    // Convert texture to data URL
    const dataUrl = canvas.toDataURL("image/png")
    onTextureGenerated(dataUrl)

    // Cleanup
    return () => {
      texture.dispose()
    }
  }, [text, style, color, backgroundColor, onTextureGenerated])

  return <canvas ref={canvasRef} style={{ display: "none" }} />
}

export default TextTextureGenerator 