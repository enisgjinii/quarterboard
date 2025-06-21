import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Type, Download, Upload, Lock, Unlock, Move, ZoomIn, RotateCw, Image } from "lucide-react"
import debounce from 'lodash.debounce'

interface UVTextEditorProps {
  onTextUpdate: (texture: string | null) => void
  modelUrl?: string
  onUVMapExtracted?: (uvMapUrl: string) => void
}

export function UVTextEditor({ onTextUpdate, modelUrl, onUVMapExtracted }: UVTextEditorProps) {
  const [text, setText] = useState("YOUR TEXT")
  const [fontSize, setFontSize] = useState(40)  // Smaller default font
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#ffffff")
  const [isLocked, setIsLocked] = useState(false)
  const [embossEffect, setEmbossEffect] = useState(true)
  const [embossDepth, setEmbossDepth] = useState(3)
  const [uvMapUrl, setUvMapUrl] = useState<string | null>(null)
  const [isExtractingUV, setIsExtractingUV] = useState(false)
  const [fabricLoaded, setFabricLoaded] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<any>(null)
  const textObjectRef = useRef<any>(null)
  const fabricInstanceRef = useRef<any>(null)

  // Load fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabricModule = await import('fabric')
        // For fabric v6, the main fabric object is the default export
        fabricInstanceRef.current = fabricModule.default || fabricModule
        setFabricLoaded(true)
        console.log('Fabric.js loaded successfully')
      } catch (error) {
        console.error('Failed to load fabric.js:', error)
      }
    }
    
    loadFabric()
  }, [])

  // Function to extract UV map from model
  const extractUVMap = useCallback(async () => {
    if (!modelUrl) return
    
    setIsExtractingUV(true)
    try {
      // Create a temporary scene to load the model
      const { Scene, FreeCamera, Engine, MeshBuilder } = await import('@babylonjs/core')
      const { GLTFFileLoader } = await import('@babylonjs/loaders')
      
      const canvas = document.createElement('canvas')
      canvas.width = 256  // Smaller UV map
      canvas.height = 256
      const engine = new Engine(canvas, true)
      const scene = new Scene(engine)
      
      // Load the model
      const loader = new GLTFFileLoader()
      const result = await loader.importMeshAsync('', '', modelUrl, scene)
      
      // Extract UV coordinates and create UV map
      const uvMapCanvas = document.createElement('canvas')
      uvMapCanvas.width = 256
      uvMapCanvas.height = 256
      const ctx = uvMapCanvas.getContext('2d')
      
      if (ctx) {
        // Clear with light background
        ctx.fillStyle = '#f8f9fa'
        ctx.fillRect(0, 0, 256, 256)
        
        // Draw UV coordinates
        ctx.strokeStyle = '#6c757d'
        ctx.lineWidth = 1
        
        result.meshes.forEach((mesh) => {
          if (mesh.geometry) {
            const positions = mesh.geometry.getVerticesData('position')
            const uvs = mesh.geometry.getVerticesData('uv')
            const indices = mesh.geometry.getIndices()
            
            if (positions && uvs && indices) {
              // Draw UV wireframe
              for (let i = 0; i < indices.length; i += 3) {
                const i1 = indices[i] * 2
                const i2 = indices[i + 1] * 2
                const i3 = indices[i + 2] * 2
                
                const u1 = uvs[i1] * 256
                const v1 = (1 - uvs[i1 + 1]) * 256
                const u2 = uvs[i2] * 256
                const v2 = (1 - uvs[i2 + 1]) * 256
                const u3 = uvs[i3] * 256
                const v3 = (1 - uvs[i3 + 1]) * 256
                
                ctx.beginPath()
                ctx.moveTo(u1, v1)
                ctx.lineTo(u2, v2)
                ctx.lineTo(u3, v3)
                ctx.closePath()
                ctx.stroke()
              }
            }
          }
        })
        
        // Convert to data URL
        const uvMapDataUrl = uvMapCanvas.toDataURL('image/png')
        setUvMapUrl(uvMapDataUrl)
        onUVMapExtracted?.(uvMapDataUrl)
      }
      
      engine.dispose()
    } catch (error) {
      console.error('Error extracting UV map:', error)
    } finally {
      setIsExtractingUV(false)
    }
  }, [modelUrl, onUVMapExtracted])

  // Extract UV map when model changes
  useEffect(() => {
    if (modelUrl) {
      extractUVMap()
    }
  }, [modelUrl, extractUVMap])

  const debouncedUpdate = useCallback(
    debounce((canvas: any) => {
      if (!fabricInstanceRef.current) return
      
      // Create a temporary canvas for the texture with smaller resolution
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 1024  // Smaller resolution
      tempCanvas.height = 1024
      const tempCtx = tempCanvas.getContext('2d')
      
      if (tempCtx) {
        // Clear with transparent background
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        // Scale factor to match the higher resolution
        const scaleFactor = tempCanvas.width / 256  // 256 is the fabric canvas size
        
        // Draw only the text objects (no background)
        const objects = canvas.getObjects()
        objects.forEach((obj: any) => {
          if (obj instanceof fabricInstanceRef.current.Text) {
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
        console.log('Generated texture with', objects.filter((o: any) => o instanceof fabricInstanceRef.current.Text).length, 'text objects')
        onTextUpdate(dataUrl)
      }
    }, 250),
    [onTextUpdate, embossEffect, embossDepth]
  )

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || !fabricLoaded || !fabricInstanceRef.current) return
    
    const initFabric = () => {
      try {
        const fabricInstance = fabricInstanceRef.current
        
        // Set canvas dimensions - smaller size
        if (canvasRef.current) {
          canvasRef.current.width = 256
          canvasRef.current.height = 256
        }
        
        const canvas = new fabricInstance.Canvas(canvasRef.current, {
          width: 256,
          height: 256,
          backgroundColor: '#f0f0f0',
        })
        
        // Add event listeners
        canvas.on('object:modified', () => debouncedUpdate(canvas))
        canvas.on('object:moving', () => debouncedUpdate(canvas))
        canvas.on('object:scaling', () => debouncedUpdate(canvas))
        canvas.on('object:rotating', () => debouncedUpdate(canvas))
        
        fabricCanvasRef.current = canvas
        
        // Load UV map as background if available
        if (uvMapUrl) {
          fabricInstance.Image.fromURL(uvMapUrl, (img: any) => {
            img.scaleToWidth(256)
            img.scaleToHeight(256)
            img.set({
              selectable: false,
              evented: false
            })
            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
          })
        }
        
        // Create initial text object
        const textObj = new fabricInstance.Text(text, {
          left: 128,  // Center of 256x256 canvas
          top: 75,
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
        canvas.renderAll()
        debouncedUpdate(canvas)
        
        console.log('Fabric canvas initialized successfully')
      } catch (error) {
        console.error('Error initializing fabric canvas:', error)
      }
    }
    
    initFabric()
  }, [canvasRef, fabricLoaded, uvMapUrl, text, fontSize, fontFamily, textColor, isLocked, debouncedUpdate])

  // Update text properties
  useEffect(() => {
    if (!textObjectRef.current || !fabricCanvasRef.current || !fabricLoaded || !fabricInstanceRef.current) return
    
    const updateText = () => {
      try {
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
      } catch (error) {
        console.error('Error updating text:', error)
      }
    }
    
    updateText()
  }, [text, fontSize, fontFamily, textColor, isLocked, debouncedUpdate, fabricLoaded])

  const handleAddText = () => {
    if (!fabricCanvasRef.current || !fabricLoaded || !fabricInstanceRef.current) return
    
    try {
      const fabricInstance = fabricInstanceRef.current
      
      const newText = new fabricInstance.Text('NEW TEXT', {
        left: Math.random() * 200 + 25,
        top: Math.random() * 200 + 25,
        fontSize: 30,
        fontFamily: fontFamily,
        fill: textColor,
        originX: 'center',
        originY: 'center',
      })
      
      fabricCanvasRef.current.add(newText)
      fabricCanvasRef.current.setActiveObject(newText)
      fabricCanvasRef.current.renderAll()
      debouncedUpdate(fabricCanvasRef.current)
    } catch (error) {
      console.error('Error adding text:', error)
    }
  }

  const handleDeleteSelected = () => {
    if (!fabricCanvasRef.current) return
    
    try {
      const activeObject = fabricCanvasRef.current.getActiveObject()
      if (activeObject && activeObject !== textObjectRef.current) {
        fabricCanvasRef.current.remove(activeObject)
        fabricCanvasRef.current.renderAll()
        debouncedUpdate(fabricCanvasRef.current)
      }
    } catch (error) {
      console.error('Error deleting selected object:', error)
    }
  }

  const handleClearAll = () => {
    if (!fabricCanvasRef.current || !textObjectRef.current || !fabricLoaded || !fabricInstanceRef.current) return
    
    try {
      const fabricInstance = fabricInstanceRef.current
      
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.add(textObjectRef.current)
      
      // Re-add UV map background if it exists
      if (uvMapUrl) {
        fabricInstance.Image.fromURL(uvMapUrl, (img: any) => {
          img.scaleToWidth(256)
          img.scaleToHeight(256)
          img.set({
            selectable: false,
            evented: false
          })
          fabricCanvasRef.current!.setBackgroundImage(img, fabricCanvasRef.current!.renderAll.bind(fabricCanvasRef.current!))
        })
      }
      
      fabricCanvasRef.current.renderAll()
      debouncedUpdate(fabricCanvasRef.current)
    } catch (error) {
      console.error('Error clearing canvas:', error)
    }
  }

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="pb-2 p-3 bg-green-50 dark:bg-green-900/20">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-green-600" />
            UV Text Editor
          </div>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={extractUVMap}
              disabled={isExtractingUV}
              className="h-7 px-2"
            >
              {isExtractingUV ? 'Extracting...' : <Image className="h-3 w-3" />}
            </Button>
            <Button 
              variant={isLocked ? "destructive" : "secondary"} 
              size="sm" 
              onClick={() => setIsLocked(!isLocked)} 
              className="h-7 px-2"
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-3">
        {!fabricLoaded ? (
          <div className="text-center py-8 text-sm text-slate-500">
            Loading text editor...
          </div>
        ) : (
          <>
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
                min={8}
                max={80}
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
                    max={8}
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
                Delete
              </Button>
              <Button onClick={handleClearAll} size="sm" variant="outline" className="flex-1">
                Clear
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
          </>
        )}
      </CardContent>
    </Card>
  )
} 