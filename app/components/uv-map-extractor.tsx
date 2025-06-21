import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Image } from "lucide-react"
import * as THREE from 'three'
import { UVTextEditor } from "./uv-text-editor"

interface UVMapExtractorProps {
  scene: THREE.Scene | null
  onExtract: (uvMap: string) => void
  onTextureUpdate?: (texture: string) => void
}

interface UVMapData {
  name: string
  dataUrl: string
  meshName: string
  materialName?: string
  vertexCount: number
  faceCount: number
}

export function UVMapExtractor({ scene, onExtract, onTextureUpdate }: UVMapExtractorProps) {
  const [uvMaps, setUvMaps] = useState<UVMapData[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [selectedUVMap, setSelectedUVMap] = useState<string | null>(null)

  const extractUVMap = async () => {
    if (!scene) return

    setIsExtracting(true)
    try {
      const newUvMaps: UVMapData[] = []

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry) {
          const geometry = object.geometry
          const uvAttribute = geometry.getAttribute('uv')
          
          if (uvAttribute) {
            // Create a canvas for the UV map
            const canvas = document.createElement('canvas')
            const size = 2048
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            
            if (ctx) {
              // Clear canvas with transparent background
              ctx.clearRect(0, 0, size, size)
              
              // Draw UV coordinates with improved visualization
              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 2
              
              // Draw UV triangles with better organization
              const positionAttribute = geometry.getAttribute('position')
              const index = geometry.index
              
              if (index) {
                // First pass: Draw filled triangles
                ctx.fillStyle = 'rgba(200, 200, 200, 0.1)'
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i)
                  const b = index.getX(i + 1)
                  const c = index.getX(i + 2)
                  
                  const uvA = new THREE.Vector2(
                    uvAttribute.getX(a) * size,
                    (1 - uvAttribute.getY(a)) * size
                  )
                  const uvB = new THREE.Vector2(
                    uvAttribute.getX(b) * size,
                    (1 - uvAttribute.getY(b)) * size
                  )
                  const uvC = new THREE.Vector2(
                    uvAttribute.getX(c) * size,
                    (1 - uvAttribute.getY(c)) * size
                  )
                  
                  ctx.beginPath()
                  ctx.moveTo(uvA.x, uvA.y)
                  ctx.lineTo(uvB.x, uvB.y)
                  ctx.lineTo(uvC.x, uvC.y)
                  ctx.closePath()
                  ctx.fill()
                }

                // Second pass: Draw edges
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = 1
                for (let i = 0; i < index.count; i += 3) {
                  const a = index.getX(i)
                  const b = index.getX(i + 1)
                  const c = index.getX(i + 2)
                  
                  const uvA = new THREE.Vector2(
                    uvAttribute.getX(a) * size,
                    (1 - uvAttribute.getY(a)) * size
                  )
                  const uvB = new THREE.Vector2(
                    uvAttribute.getX(b) * size,
                    (1 - uvAttribute.getY(b)) * size
                  )
                  const uvC = new THREE.Vector2(
                    uvAttribute.getX(c) * size,
                    (1 - uvAttribute.getY(c)) * size
                  )
                  
                  ctx.beginPath()
                  ctx.moveTo(uvA.x, uvA.y)
                  ctx.lineTo(uvB.x, uvB.y)
                  ctx.lineTo(uvC.x, uvC.y)
                  ctx.closePath()
                  ctx.stroke()
                }

                // Add texture preview if available
                if (object.material instanceof THREE.MeshStandardMaterial && object.material.map) {
                  const texture = object.material.map
                  const textureCanvas = document.createElement('canvas')
                  textureCanvas.width = size
                  textureCanvas.height = size
                  const textureCtx = textureCanvas.getContext('2d')
                  
                  if (textureCtx && texture.image) {
                    textureCtx.drawImage(texture.image, 0, 0, size, size)
                    ctx.globalAlpha = 0.2
                    ctx.drawImage(textureCanvas, 0, 0)
                    ctx.globalAlpha = 1.0
                  }
                }

                // Get mesh information
                const meshName = object.name || 'Unnamed Mesh'
                const materialName = object.material instanceof THREE.MeshStandardMaterial 
                  ? object.material.name || 'Standard Material'
                  : 'Multiple Materials'
                const vertexCount = geometry.getAttribute('position').count
                const faceCount = index ? index.count / 3 : 0

                // Add to UV maps list with detailed information
                newUvMaps.push({
                  name: `${meshName}_UV`,
                  dataUrl: canvas.toDataURL('image/png'),
                  meshName,
                  materialName,
                  vertexCount,
                  faceCount
                })
              }
            }
          }
        }
      })

      setUvMaps(newUvMaps)
      if (newUvMaps.length > 0) {
        onExtract(newUvMaps[0].dataUrl)
      }
    } catch (error) {
      console.error('Error extracting UV maps:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const downloadUVMap = (dataUrl: string, name: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${name}_uv_map.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleTextureUpdate = (texture: string | null) => {
    if (texture && onTextureUpdate) {
      onTextureUpdate(texture)
    }
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-sm">UV Map Extractor</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <Button
          onClick={extractUVMap}
          disabled={isExtracting || !scene}
          className="w-full"
        >
          {isExtracting ? (
            'Extracting...'
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Extract UV Maps
            </>
          )}
        </Button>

        {uvMaps.length > 0 && (
          <div className="space-y-4">
            {uvMaps.map((uvMap, index) => (
              <div key={index} className="space-y-2">
                <div className="relative group">
                  <img
                    src={uvMap.dataUrl}
                    alt={uvMap.meshName}
                    className="w-full h-auto rounded border border-border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedUVMap(uvMap.dataUrl)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => downloadUVMap(uvMap.dataUrl, uvMap.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {uvMap.meshName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {uvMap.materialName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{uvMap.vertexCount} vertices</span>
                    <span>{uvMap.faceCount} faces</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUVMap && onTextureUpdate && (
          <UVTextEditor
            onTextUpdate={handleTextureUpdate}
          />
        )}
      </CardContent>
    </Card>
  )
} 