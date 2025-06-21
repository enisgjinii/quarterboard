import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Type, Download, Upload, Lock, Unlock, Move, ZoomIn, RotateCw } from "lucide-react"
import { Canvas, FabricText, FabricImage, type FabricObject } from 'fabric'
import debounce from 'lodash.debounce'

interface UVTextEditorProps {
  onTextUpdate: (texture: string | null) => void
  uvMapUrl?: string
}

export function UVTextEditor({ onTextUpdate, uvMapUrl }: UVTextEditorProps) {
  const [text, setText] = useState("YOUR TEXT")
  const [fontSize, setFontSize] = useState(60)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#ffffff")  // White text for embossed effect
  const [isLocked, setIsLocked] = useState(false)
  const [embossEffect, setEmbossEffect] = useState(true)
  const [embossDepth, setEmbossDepth] = useState(3)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)
  const textObjectRef = useRef<FabricText | null>(null)

  const debouncedUpdate = useCallback(
    debounce((canvas: Canvas) => {
      // Create a temporary canvas for the texture with higher resolution
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 2048  // Higher resolution for better quality
      tempCanvas.height = 2048
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        // Clear with transparent background
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        // Scale factor to match the higher resolution
        const scaleFactor = tempCanvas.width / 512  // 512 is the fabric canvas size
        
        // Draw only the text objects (no background)
        const objects = canvas.getObjects()
        objects.forEach((obj: FabricObject) => {
          if (obj instanceof FabricText) {
            // Draw emboss effect if enabled
            if (embossEffect) {
              // Shadow for depth effect
              tempCtx.save()
              
              // Apply transformations with scale factor
              const left = (obj.left || 0) * scaleFactor
              const top = (obj.top || 0) * scaleFactor
              const scaleX = (obj.scaleX || 1) * scaleFactor
              const scaleY = (obj.scaleY || 1) * scaleFactor
              
              // Draw shadow (darker version)
              tempCtx.translate(left + embossDepth, top + embossDepth)
              tempCtx.rotate((obj.angle || 0) * Math.PI / 180)
              
              const fontSize = (obj.fontSize || 40) * scaleX
              tempCtx.font = `${fontSize}px ${obj.fontFamily || 'Arial'}`
              tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'  // Dark shadow
              tempCtx.textAlign = 'left'
              tempCtx.textBaseline = 'top'
              
              const text = obj.text || ''
              const lines = text.split('\n')
              lines.forEach((line: string, index: number) => {
                tempCtx.fillText(line, 0, index * fontSize * 1.2)
              })
              
              tempCtx.restore()
            }
            
            // Draw main text
            tempCtx.save()
            
            // Apply transformations with scale factor
            const left = (obj.left || 0) * scaleFactor
            const top = (obj.top || 0) * scaleFactor
            const scaleX = (obj.scaleX || 1) * scaleFactor
            const scaleY = (obj.scaleY || 1) * scaleFactor
            
            tempCtx.translate(left, top)
            tempCtx.rotate((obj.angle || 0) * Math.PI / 180)
            
            // Set text properties
            const fontSize = (obj.fontSize || 40) * scaleX
            tempCtx.font = `${fontSize}px ${obj.fontFamily || 'Arial'}`
            tempCtx.fillStyle = obj.fill as string || '#ffffff'
            tempCtx.textAlign = 'left'
            tempCtx.textBaseline = 'top'
            
            // Draw the text
            const text = obj.text || ''
            const lines = text.split('\n')
            lines.forEach((line: string, index: number) => {
              tempCtx.fillText(line, 0, index * fontSize * 1.2)
            })
            
            tempCtx.restore()
          }
        })
        
        // Convert to data URL and send update
        const dataUrl = tempCanvas.toDataURL('image/png')
        console.log('Generated texture with', objects.filter((o: FabricObject) => o instanceof FabricText).length, 'text objects')
        onTextUpdate(dataUrl)
      }
    }, 250),
    [onTextUpdate, embossEffect, embossDepth]
  )

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Set canvas dimensions
    canvasRef.current.width = 512
    canvasRef.current.height = 512
    
    const canvas = new Canvas(canvasRef.current, {
      width: 512,
      height: 512,
      backgroundColor: '#f0f0f0',
    })
    
    fabricCanvasRef.current = canvas
    
    // Load UV map as background if provided
    if (uvMapUrl) {
      FabricImage.fromURL(uvMapUrl).then((img: FabricImage) => {
        img.scaleToWidth(512)
        img.scaleToHeight(512)
        img.selectable = false
        img.evented = false
        canvas.setBackgroundImage(img, () => canvas.renderAll())
      })
    }
    
    // Create initial text object
    const textObj = new FabricText(text, {
      left: 256,
      top: 150,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      originX: 'center',
      originY: 'center',
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      lockMovementX: isLocked,
      lockMovementY: isLocked,
    })
    
    canvas.add(textObj)
    textObjectRef.current = textObj
    
    // Update texture on any change
    canvas.on('object:modified', () => debouncedUpdate(canvas))
    canvas.on('object:moving', () => debouncedUpdate(canvas))
    canvas.on('object:scaling', () => debouncedUpdate(canvas))
    canvas.on('object:rotating', () => debouncedUpdate(canvas))
    
    // Initial texture generation
    debouncedUpdate(canvas)
    
    return () => {
      canvas.dispose()
    }
  }, [uvMapUrl])

  // Update text properties
  useEffect(() => {
    if (!textObjectRef.current || !fabricCanvasRef.current) return
    
    textObjectRef.current.set({
      text: text,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      lockRotation: isLocked,
      lockScalingX: isLocked,
      lockScalingY: isLocked,
      lockMovementX: isLocked,
      lockMovementY: isLocked,
    })
    
    fabricCanvasRef.current.renderAll()
    debouncedUpdate(fabricCanvasRef.current)
  }, [text, fontSize, fontFamily, textColor, isLocked, debouncedUpdate])

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return
    
    const newText = new FabricText('NEW TEXT', {
      left: Math.random() * 400 + 50,
      top: Math.random() * 400 + 50,
      fontSize: 40,
      fontFamily: fontFamily,
      fill: textColor,
      originX: 'center',
      originY: 'center',
    })
    
    fabricCanvasRef.current.add(newText)
    fabricCanvasRef.current.setActiveObject(newText)
    fabricCanvasRef.current.renderAll()
    debouncedUpdate(fabricCanvasRef.current)
  }

  const handleDeleteSelected = () => {
    if (!fabricCanvasRef.current) return
    
    const activeObject = fabricCanvasRef.current.getActiveObject()
    if (activeObject && activeObject !== textObjectRef.current) {
      fabricCanvasRef.current.remove(activeObject)
      fabricCanvasRef.current.renderAll()
      debouncedUpdate(fabricCanvasRef.current)
    }
  }

  const handleClearAll = () => {
    if (!fabricCanvasRef.current || !textObjectRef.current) return
    
    fabricCanvasRef.current.clear()
    fabricCanvasRef.current.add(textObjectRef.current)
    
    // Re-add UV map background if it exists
    if (uvMapUrl) {
      FabricImage.fromURL(uvMapUrl).then((img: FabricImage) => {
        img.scaleToWidth(512)
        img.scaleToHeight(512)
        img.selectable = false
        img.evented = false
        fabricCanvasRef.current?.setBackgroundImage(img, () => fabricCanvasRef.current?.renderAll())
      })
    }
    
    fabricCanvasRef.current.renderAll()
    debouncedUpdate(fabricCanvasRef.current)
  }

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="pb-2 p-3 bg-green-50 dark:bg-green-900/20">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-green-600" />
            UV Text Editor (Embossed)
          </div>
          <Button 
            variant={isLocked ? "destructive" : "secondary"} 
            size="sm" 
            onClick={() => setIsLocked(!isLocked)} 
            className="h-7 px-2"
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Main Text</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact"].map((font) => (
                  <SelectItem key={font} value={font} className="text-sm">
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-8 p-1"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Font Size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={12}
            max={150}
            step={1}
          />
        </div>

        <div className="space-y-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="flex items-center justify-between">
            <Label htmlFor="emboss-checkbox" className="text-xs">Emboss Effect</Label>
            <input
              id="emboss-checkbox"
              type="checkbox"
              checked={embossEffect}
              onChange={(e) => setEmbossEffect(e.target.checked)}
              className="h-4 w-4"
              aria-label="Toggle emboss effect"
            />
          </div>
          {embossEffect && (
            <div className="space-y-1">
              <Label className="text-xs">Emboss Depth: {embossDepth}px</Label>
              <Slider
                value={[embossDepth]}
                onValueChange={([value]) => setEmbossDepth(value)}
                min={1}
                max={10}
                step={1}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddText} size="sm" variant="outline" className="flex-1">
            Add Text
          </Button>
          <Button onClick={handleDeleteSelected} size="sm" variant="outline" className="flex-1">
            Delete Selected
          </Button>
          <Button onClick={handleClearAll} size="sm" variant="outline" className="flex-1">
            Clear All
          </Button>
        </div>

        <div className="border rounded-md bg-white">
          <canvas 
            ref={canvasRef}
            className="w-full h-auto rounded"
          />
        </div>
        
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          {isLocked ? 'Unlock to edit text. UV map shown as reference.' : 'Click and drag to move text. Use handles to resize/rotate.'}
        </p>
      </CardContent>
    </Card>
  )
} 