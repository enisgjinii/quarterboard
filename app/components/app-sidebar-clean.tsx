"use client"

import type * as React from "react"
import { useRef, useState } from "react"
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
import { Upload, ImageIcon, Download, Palette, Layers, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const modelFileRef = useRef<HTMLInputElement>(null)
  const textureFileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("model")

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

  const downloadUVMap = () => {
    if (uvMapUrl) {
      const link = document.createElement("a")
      link.href = uvMapUrl
      link.download = "uv-map.png"
      link.click()
    }
  }

  const colorPresets = [
    "#D4A574", // Wood
    "#8B4513", // Brown
    "#2F4F4F", // Dark Slate Gray
    "#556B2F", // Dark Olive Green
    "#B22222", // Fire Brick
    "#4682B4", // Steel Blue
    "#708090", // Slate Gray
    "#000000", // Black
  ]

  return (
    <Sidebar variant="sidebar" collapsible="none">
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
        <SidebarGroup>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="texture">Texture</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="model" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>3D Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="model-upload">Upload Model</Label>
                      <div className="flex gap-2">
                        <Input
                          id="model-upload"
                          type="file"
                          accept=".glb,.gltf"
                          onChange={handleModelUpload}
                          ref={modelFileRef}
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="model-color">Model Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="model-color"
                          type="color"
                          value={modelColor}
                          onChange={(e) => setModelColor(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={modelColor}
                          onChange={(e) => setModelColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="grid w-full gap-1.5">
                      <Label>Color Presets</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorPresets.map((color) => (
                          <Button
                            key={color}
                            variant="outline"
                            size="sm"
                            className="h-8 w-full p-1"
                            style={{ backgroundColor: color }}
                            onClick={() => setModelColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="texture" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Texture Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="texture-upload">Upload Image/Texture</Label>
                      <div className="flex gap-2">
                        <Input
                          id="texture-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleTextureUpload}
                          ref={textureFileRef}
                        />
                        <Button variant="outline" size="icon">
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {textureUrl && (
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Current Texture Preview</Label>
                        <img 
                          src={textureUrl} 
                          alt="Current texture" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => setTextureUrl(null)}
                          className="w-full"
                        >
                          Remove Texture
                        </Button>
                      </div>
                    )}

                    {uvMapUrl && (
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>UV Map</Label>
                        <img 
                          src={uvMapUrl} 
                          alt="UV Map" 
                          className="w-full h-32 object-cover rounded border"
                        />
                        <Button variant="outline" onClick={downloadUVMap} className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download UV Map
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Model Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelLoaded && meshInfo?.length > 0 ? (
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {meshInfo.map((mesh, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{mesh.name}</div>
                            <div className="text-muted-foreground">
                              Vertices: {mesh.vertices.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              Faces: {mesh.faces.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              Materials: {mesh.materials.join(", ")}
                            </div>
                            <div className="text-muted-foreground">
                              UV Sets: {mesh.uvSets.join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Load a 3D model to see information
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between text-xs text-muted-foreground p-2">
          <span>Model Status:</span>
          <span className={modelLoaded ? "text-green-600" : "text-red-600"}>
            {modelLoaded ? "Loaded" : "Not Loaded"}
          </span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
