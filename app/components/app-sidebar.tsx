"use client"

import type * as React from "react"
import { useRef } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, ImageIcon, Download, Palette, Type, Layers, Info, Settings } from "lucide-react"

interface AppSidebarProps {
  modelUrl: string
  setModelUrl: (url: string) => void
  textureUrl: string | null
  setTextureUrl: (url: string | null) => void
  modelColor: string
  setModelColor: (color: string) => void
  signStyle: string
  setSignStyle: (style: string) => void
  signName: string
  setSignName: (name: string) => void
  uvMapUrl: string | null
  modelLoaded: boolean
}

export function AppSidebar({
  modelUrl,
  setModelUrl,
  textureUrl,
  setTextureUrl,
  modelColor,
  setModelColor,
  signStyle,
  setSignStyle,
  signName,
  setSignName,
  uvMapUrl,
  modelLoaded,
}: AppSidebarProps) {
  const modelFileRef = useRef<HTMLInputElement>(null)
  const textureFileRef = useRef<HTMLInputElement>(null)

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.toLowerCase().endsWith(".glb")) {
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

  const downloadUVMap = () => {
    if (uvMapUrl) {
      const link = document.createElement("a")
      link.href = uvMapUrl
      link.download = "uv-map.png"
      link.click()
    }
  }

  const colorPresets = [
    "#D4A574",
    "#C4915C",
    "#B8860B",
    "#CD853F",
    "#DEB887",
    "#F4A460",
    "#DAA520",
    "#8B4513",
    "#A0522D",
    "#D2691E",
    "#FF8C00",
    "#FF7F50",
  ]

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Layers className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">3D Customizer</span>
                  <span className="truncate text-xs text-muted-foreground">Model Editor</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Model Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Settings className="size-4" />
            Model Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  3D Model
                  <Badge variant={modelLoaded ? "default" : "secondary"} className="text-xs">
                    {modelLoaded ? "Loaded" : "Loading"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="model-upload" className="text-xs font-medium">
                    Upload Model (.glb)
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => modelFileRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Upload className="size-3 mr-2" />
                      Choose File
                    </Button>
                    <Input
                      id="model-upload"
                      type="file"
                      accept=".glb"
                      ref={modelFileRef}
                      onChange={handleModelUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setModelUrl("/models/object.glb")}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Use Default Model
                </Button>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Properties */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Type className="size-4" />
            Sign Properties
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sign-name" className="text-xs font-medium">
                    Sign Name
                  </Label>
                  <Input
                    id="sign-name"
                    value={signName}
                    onChange={(e) => setSignName(e.target.value)}
                    placeholder="Enter sign name..."
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sign-style" className="text-xs font-medium">
                    Sign Style
                  </Label>
                  <Input
                    id="sign-style"
                    value={signStyle}
                    onChange={(e) => setSignStyle(e.target.value)}
                    placeholder="Enter style..."
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Appearance */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Palette className="size-4" />
            Appearance
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Color Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Model Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="flex-1 h-8 font-mono text-xs"
                      placeholder="#D4A574"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {colorPresets.map((color) => (
                      <Button
                        key={color}
                        onClick={() => setModelColor(color)}
                        className="w-full h-6 p-0 border rounded hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                        variant="outline"
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Texture Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Texture</Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => textureFileRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ImageIcon className="size-3 mr-2" />
                      Upload
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      ref={textureFileRef}
                      onChange={handleTextureUpload}
                      className="hidden"
                    />
                  </div>
                  {textureUrl && (
                    <div className="space-y-2">
                      <img
                        src={textureUrl || "/placeholder.svg"}
                        alt="Texture preview"
                        className="w-full h-16 object-cover rounded border"
                      />
                      <Button
                        onClick={() => setTextureUrl(null)}
                        variant="destructive"
                        size="sm"
                        className="w-full h-7 text-xs"
                      >
                        Remove Texture
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* UV Mapping */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Layers className="size-4" />
            UV Mapping
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card>
              <CardContent className="pt-6">
                {uvMapUrl ? (
                  <div className="space-y-3">
                    <img
                      src={uvMapUrl || "/placeholder.svg"}
                      alt="UV Map"
                      className="w-full aspect-square object-cover rounded border"
                    />
                    <Button onClick={downloadUVMap} variant="outline" size="sm" className="w-full">
                      <Download className="size-3 mr-2" />
                      Download UV Map
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">UV map will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Info className="size-3" />
                  Model Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${modelLoaded ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-muted-foreground">{modelLoaded ? "Ready" : "Loading..."}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <div>File: {modelUrl.split("/").pop()}</div>
                  <div>Format: GLB</div>
                </div>
              </CardContent>
            </Card>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
