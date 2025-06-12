"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface TextTextureGeneratorProps {
  text: string
  style: string
  color: string
  backgroundColor: string
  onTextureGenerated: (textureUrl: string) => void
  maxWidth?: number
  maxHeight?: number
}

const TextTextureGenerator: React.FC<TextTextureGeneratorProps> = ({
  text,
  style,
  color,
  backgroundColor,
  onTextureGenerated,
  maxWidth = 2048,
  maxHeight = 2048,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = maxWidth
    canvas.height = maxHeight

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
    let lineHeight = 1.2

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

    // Word wrap function
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ')
      const lines: string[] = []
      let currentLine = words[0]

      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
          currentLine += ' ' + word
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
      lines.push(currentLine)
      return lines
    }

    // Calculate available width and height
    const padding = 100 // Padding from edges
    const availableWidth = maxWidth - (padding * 2)
    const availableHeight = maxHeight - (padding * 2)

    // Wrap text and calculate total height
    const lines = wrapText(text, availableWidth)
    const lineHeightPx = fontSize * lineHeight
    const totalHeight = lines.length * lineHeightPx

    // Adjust font size if text is too tall
    if (totalHeight > availableHeight) {
      const scale = availableHeight / totalHeight
      fontSize = Math.floor(fontSize * scale)
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    }

    // Draw wrapped text
    const y = (maxHeight - (lines.length * fontSize * lineHeight)) / 2
    lines.forEach((line, i) => {
      const x = maxWidth / 2
      const lineY = y + (i * fontSize * lineHeight)
      ctx.fillText(line, x, lineY)
    })

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
  }, [text, style, color, backgroundColor, onTextureGenerated, maxWidth, maxHeight])

  return <canvas ref={canvasRef} style={{ display: "none" }} />
}

export default TextTextureGenerator 