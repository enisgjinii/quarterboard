"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Palette, Type } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface AppSidebarProps {
  modelUrl: string
  setModelUrl: (url: string) => void
  textureUrl: string | null
  setTextureUrl: (url: string | null) => void
  modelColor: string
  setModelColor: (color: string) => void
  uvMapUrl: string | null
  modelLoaded: boolean
  meshInfo: any[]
  selectedMaterial: string | null
  setSelectedMaterial: (material: string | null) => void
  materialPreview: string | null
  setMaterialPreview: (preview: string | null) => void
  isPreviewMode: boolean
  setIsPreviewMode: (mode: boolean) => void
  overlayText?: string
  setOverlayText?: (text: string) => void
  materialText?: string
  setMaterialText?: (text: string) => void
  textColor?: string
  setTextColor?: (color: string) => void
  fontSize?: number
  setFontSize?: (size: number) => void
  textPosition?: { x: number; y: number; z: number }
  setTextPosition?: (position: { x: number; y: number; z: number }) => void
  // 3D Text props
  text3D?: string
  setText3D?: (text: string) => void
  textRotation?: { x: number; y: number; z: number }
  setTextRotation?: (rotation: { x: number; y: number; z: number }) => void
  textScale?: { x: number; y: number; z: number }
  setTextScale?: (scale: { x: number; y: number; z: number }) => void
  text3DOptions?: any
  setText3DOptions?: (options: any) => void
  textMaterial?: 'standard' | 'emissive' | 'engraved'
  setTextMaterial?: (material: 'standard' | 'emissive' | 'engraved') => void
  engraveDepth?: number
  setEngraveDepth?: (depth: number) => void
  isEngraving?: boolean
  setIsEngraving?: (engraving: boolean) => void
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
  selectedMaterial,
  setSelectedMaterial,
  materialPreview,
  setMaterialPreview,
  isPreviewMode,
  setIsPreviewMode,
  overlayText = "",
  setOverlayText = () => {},
  materialText = "",
  setMaterialText = () => {},
  textColor = "#ffffff",
  setTextColor = () => {},
  fontSize = 1,
  setFontSize = () => {},
  textPosition = { x: 0, y: 1, z: 0 },
  setTextPosition = () => {},
  // 3D Text props
  text3D = "SAMPLE",
  setText3D = () => {},
  textRotation = { x: 0, y: 0, z: 0 },
  setTextRotation = () => {},
  textScale = { x: 1, y: 1, z: 1 },
  setTextScale = () => {},
  text3DOptions = {},
  setText3DOptions = () => {},
  textMaterial = 'standard',
  setTextMaterial = () => {},
  engraveDepth = 0.01,
  setEngraveDepth = () => {},
  isEngraving = false,
  setIsEngraving = () => {}
}: AppSidebarProps) {

  return (
    <div className="flex-shrink-0">
      <Tabs defaultValue="color" className="w-full">
        <TabsList className="grid grid-cols-3 mx-4 mt-4 bg-muted">
          <TabsTrigger value="color" className="text-xs font-medium">
            <Palette className="w-3 h-3 mr-1.5" />
            Style
          </TabsTrigger>
          <TabsTrigger value="text3d" className="text-xs font-medium">
            <Type className="w-3 h-3 mr-1.5" />
            3D Text
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs font-medium">
            <Download className="w-3 h-3 mr-1.5" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            
            {/* STYLE TAB */}
            <TabsContent value="color" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Model Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={modelColor}
                        onChange={(e) => setModelColor(e.target.value)}
                        className="w-12 h-9 p-1 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={modelColor}
                        onChange={(e) => setModelColor(e.target.value)}
                        className="flex-1 text-xs font-mono"
                        placeholder="#D4A574"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isPreviewMode}
                      onCheckedChange={setIsPreviewMode}
                    />
                    <Label className="text-sm">Auto Rotate Model</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3D TEXT TAB */}
            <TabsContent value="text3d" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* 3D Text Input */}
                  <div>
                    <Label htmlFor="text3d-input" className="text-sm font-medium mb-2 block">3D Text</Label>
                    <Input
                      id="text3d-input"
                      type="text"
                      value={text3D}
                      onChange={(e) => setText3D(e.target.value)}
                      placeholder="Enter text to create 3D geometry..."
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Creates real 3D text geometry that can be positioned and engraved
                    </p>
                  </div>

                  <Separator />

                  {/* Text Material Type */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Text Material</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={textMaterial === 'standard' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTextMaterial('standard')}
                        className="text-xs"
                      >
                        Standard
                      </Button>
                      <Button
                        variant={textMaterial === 'emissive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTextMaterial('emissive')}
                        className="text-xs"
                      >
                        Glowing
                      </Button>
                      <Button
                        variant={textMaterial === 'engraved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTextMaterial('engraved')}
                        className="text-xs"
                      >
                        Engraved
                      </Button>
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-12 h-9 p-1 rounded cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 text-xs font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Text Position */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Text Position</Label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">X Position</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {textPosition.x.toFixed(2)}
                          </span>
                        </div>
                        <Input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={textPosition.x}
                          onChange={(e) => setTextPosition({
                            ...textPosition,
                            x: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Y Position</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {textPosition.y.toFixed(2)}
                          </span>
                        </div>
                        <Input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={textPosition.y}
                          onChange={(e) => setTextPosition({
                            ...textPosition,
                            y: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Z Position</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {textPosition.z.toFixed(2)}
                          </span>
                        </div>
                        <Input
                          type="range"
                          min="-2"
                          max="2"
                          step="0.1"
                          value={textPosition.z}
                          onChange={(e) => setTextPosition({
                            ...textPosition,
                            z: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Rotation */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Text Rotation</Label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">X Rotation</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {(textRotation.x * 180 / Math.PI).toFixed(0)}°
                          </span>
                        </div>
                        <Input
                          type="range"
                          min={-Math.PI}
                          max={Math.PI}
                          step="0.1"
                          value={textRotation.x}
                          onChange={(e) => setTextRotation({
                            ...textRotation,
                            x: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Y Rotation</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {(textRotation.y * 180 / Math.PI).toFixed(0)}°
                          </span>
                        </div>
                        <Input
                          type="range"
                          min={-Math.PI}
                          max={Math.PI}
                          step="0.1"
                          value={textRotation.y}
                          onChange={(e) => setTextRotation({
                            ...textRotation,
                            y: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Z Rotation</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {(textRotation.z * 180 / Math.PI).toFixed(0)}°
                          </span>
                        </div>
                        <Input
                          type="range"
                          min={-Math.PI}
                          max={Math.PI}
                          step="0.1"
                          value={textRotation.z}
                          onChange={(e) => setTextRotation({
                            ...textRotation,
                            z: parseFloat(e.target.value)
                          })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Scale */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Text Scale</Label>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Size</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {textScale.x.toFixed(1)}x
                        </span>
                      </div>
                      <Input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={textScale.x}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          setTextScale({ x: value, y: value, z: value })
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Engraving Controls */}
                  {textMaterial === 'engraved' && (
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Engraving</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isEngraving}
                            onCheckedChange={setIsEngraving}
                          />
                          <Label className="text-sm">Enable Engraving</Label>
                        </div>
                        {isEngraving && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Engrave Depth</span>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {engraveDepth.toFixed(3)}
                              </span>
                            </div>
                            <Input
                              type="range"
                              min="0.001"
                              max="0.05"
                              step="0.001"
                              value={engraveDepth}
                              onChange={(e) => setEngraveDepth(parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTextPosition({ x: 0, y: 0.5, z: 0.1 })
                          setTextRotation({ x: 0, y: 0, z: 0 })
                          setTextScale({ x: 1, y: 1, z: 1 })
                        }}
                      >
                        Reset Position
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setText3D("")}
                      >
                        Clear Text
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EXPORT TAB */}
            <TabsContent value="export" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Export Options</Label>
                    <p className="text-xs text-muted-foreground mb-4">
                      Export your customized 3D model with text
                    </p>
                    <Button className="w-full" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Model (.glb)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </div>
  )
}
