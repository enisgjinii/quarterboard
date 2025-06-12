"use client"

import type * as React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ImageIcon, Layers } from "lucide-react"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
}

interface AppSidebarProps {
  modelUrl: string
  setModelUrl: (url: string) => void
  textureUrl: string | null
  setTextureUrl: (url: string | null) => void
  modelColor: string
  setModelColor: (color: string) => void
  uvMapUrl: string | null
  modelLoaded: boolean
  meshInfo: MeshInfo[]
}

export function AppSidebar({
  modelUrl,
  setModelUrl,
  textureUrl,
  setTextureUrl,
  modelColor,
  setModelColor,
  uvMapUrl,
  modelLoaded,
  meshInfo,
}: AppSidebarProps) {
  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && (file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf"))) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }

  const handleTextureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setTextureUrl(url)
    }
  }

  const colorPresets = [
    "#D4A574", "#8B4513", "#2F4F4F", "#556B2F", 
    "#B22222", "#4682B4", "#708090", "#000000"
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="size-5" />
        <span className="font-semibold">3D Model Editor</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="model-upload">GLB/GLTF File</Label>
            <Input
              id="model-upload"
              type="file"
              accept=".glb,.gltf"
              onChange={handleModelUpload}
            />
          </div>

          <div>
            <Label htmlFor="model-color">Model Color</Label>
            <div className="flex gap-2">
              <Input
                id="model-color"
                type="color"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
                className="w-16"
              />
              <Input
                type="text"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label>Color Presets</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {colorPresets.map((color) => (
                <Button
                  key={color}
                  variant="outline"
                  size="sm"
                  className="h-8 p-1"
                  style={{ backgroundColor: color }}
                  onClick={() => setModelColor(color)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply Texture/Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="texture-upload">Upload Image</Label>
            <Input
              id="texture-upload"
              type="file"
              accept="image/*"
              onChange={handleTextureUpload}
            />
          </div>

          {textureUrl && (
            <div>
              <Label>Current Texture</Label>
              <img 
                src={textureUrl} 
                alt="Applied texture" 
                className="w-full h-32 object-cover rounded border mt-2"
              />
              <Button 
                variant="outline" 
                onClick={() => setTextureUrl(null)}
                className="w-full mt-2"
              >
                Remove Texture
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className={modelLoaded ? "text-green-600" : "text-red-600"}>
                {modelLoaded ? "Loaded" : "Not Loaded"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Texture:</span>
              <span className={textureUrl ? "text-green-600" : "text-gray-500"}>
                {textureUrl ? "Applied" : "None"}
              </span>
            </div>
          </div>
        </CardContent>      </Card>
    </div>
  )
}
