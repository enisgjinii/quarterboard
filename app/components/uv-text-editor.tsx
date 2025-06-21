import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Type, Download, Upload, Lock, Unlock, Move, ZoomIn, RotateCw } from "lucide-react"
import debounce from 'lodash.debounce'

interface UVTextEditorProps {
  uvMap: string
  onTextUpdate: (texture: string | null) => void
}

export function UVTextEditor({ uvMap, onTextUpdate }: UVTextEditorProps) {
  const [text, setText] = useState("YOUR TEXT")
  const [fontSize, setFontSize] = useState(48)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#1a1a1a")
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [isLocked, setIsLocked] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const debouncedUpdate = useCallback(debounce((newTexture: string) => {
    onTextUpdate(newTexture)
  }, 300), [onTextUpdate])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Maintain aspect ratio
    const canvasWidth = canvas.parentElement?.clientWidth || 512
    const aspectRatio = image.naturalWidth / image.naturalHeight
    const canvasHeight = canvasWidth / aspectRatio
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(position.x * canvas.width, position.y * canvas.height)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add a subtle stroke for better visibility
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeText(text, 0, 0)
    ctx.fillText(text, 0, 0)

    ctx.restore()

    // Draw interactive handles if not locked
    if (!isLocked) {
      ctx.save()
      ctx.translate(position.x * canvas.width, position.y * canvas.height)
      ctx.rotate((rotation * Math.PI) / 180)

      const textWidth = ctx.measureText(text).width * scale
      const textHeight = fontSize * scale * 1.2
      
      ctx.strokeStyle = "rgba(0, 123, 255, 0.9)"
      ctx.lineWidth = 1
      ctx.strokeRect(-textWidth / 2, -textHeight / 2, textWidth, textHeight)

      // Draw resize handle
      ctx.fillStyle = "rgba(0, 123, 255, 1)"
      ctx.fillRect(textWidth / 2 - 5, textHeight / 2 - 5, 10, 10)
      
      // Draw rotation handle
      ctx.beginPath()
      ctx.arc(textWidth / 2 + 10, -textHeight / 2 - 10, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
    
    debouncedUpdate(canvas.toDataURL('image/png'))
  }, [text, fontSize, fontFamily, textColor, position, rotation, scale, isLocked, debouncedUpdate])

  useEffect(() => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = uvMap
    image.onload = () => {
      imageRef.current = image
      drawCanvas()
    }
  }, [uvMap, drawCanvas])
  
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const [interaction, setInteraction] = useState<{type: 'move' | 'scale' | 'rotate' | null, startX: number, startY: number}>({type: null, startX: 0, startY: 0});

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse coords to canvas coords
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);
    
    // Logic to determine if user is clicking on text or a handle
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    
    const textX = position.x * canvas.width;
    const textY = position.y * canvas.height;
    const textWidth = ctx.measureText(text).width * scale;
    const textHeight = fontSize * scale * 1.2;

    const dx = canvasX - textX;
    const dy = canvasY - textY;
    
    // Check for resize handle click
    const handleSize = 10;
    const handleX = textX + textWidth/2 - handleSize/2;
    const handleY = textY + textHeight/2 - handleSize/2;

    if (canvasX >= handleX && canvasX <= handleX + handleSize && canvasY >= handleY && canvasY <= handleY + handleSize) {
      setInteraction({ type: 'scale', startX: e.clientX, startY: e.clientY });
    } else if (dx * dx + dy * dy < (textWidth/2)*(textWidth/2)) { // simple check if inside text
      setInteraction({ type: 'move', startX: e.clientX, startY: e.clientY });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked || !interaction.type || !canvasRef.current) return;
    
    const dx = e.clientX - interaction.startX;
    const dy = e.clientY - interaction.startY;

    if (interaction.type === 'move') {
      const newX = position.x + dx / canvasRef.current.width;
      const newY = position.y + dy / canvasRef.current.height;
      setPosition({x: newX, y: newY});
    } else if (interaction.type === 'scale') {
      const newScale = scale + (dx / 100);
      setScale(Math.max(0.1, newScale));
    }
    
    setInteraction({...interaction, startX: e.clientX, startY: e.clientY });
  };
  
  const handleMouseUp = () => {
    setInteraction({type: null, startX: 0, startY: 0});
  };

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="pb-2 p-3 bg-green-50 dark:bg-green-900/20">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-green-600" />
            Texture Text Editor
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsLocked(!isLocked)} className="h-7 px-2">
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Text</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text..."
            className="h-8 text-sm"
            disabled={isLocked}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Font</Label>
          <Select value={fontFamily} onValueChange={setFontFamily} disabled={isLocked}>
            <SelectTrigger id="font-family" className="h-8 text-sm">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"].map((font) => (
                <SelectItem key={font} value={font} className="text-sm">
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Font Size</Label>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={12} max={150} step={1}
            disabled={isLocked}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <Input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-full h-8 p-1"
            disabled={isLocked}
          />
        </div>

        <div className="p-2 border rounded-md bg-slate-100 dark:bg-slate-800">
          <canvas 
            ref={canvasRef}
            className={`w-full h-auto rounded ${isLocked ? 'cursor-not-allowed' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          {isLocked ? 'Unlock to edit text on the map.' : 'Click and drag text, or use handles to scale/rotate.'}
        </p>
      </CardContent>
    </Card>
  )
} 