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
import { Badge } from "@/components/ui/badge"
import { Upload, ImageIcon, Download, Palette, Type, Layers, Info, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import TextTextureGenerator from "./text-texture-generator"

type UVMapSettings = {
  resolution: number
  showWireframe: boolean
  showTexture: boolean
  backgroundColor: string
  lineColor: string
}

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
  signStyle: string
  setSignStyle: (style: string) => void
  signName: string
  setSignName: (name: string) => void
  uvMapUrl: string | null
  modelLoaded: boolean
  uvMapSettings: UVMapSettings
  setUvMapSettings: (settings: UVMapSettings) => void
  meshInfo: MeshInfo[]
  onTextTextureGenerated: (textureUrl: string) => void
  panelWidth?: number
  panelHeight?: number
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
  uvMapSettings,
  setUvMapSettings,
  meshInfo,
  onTextTextureGenerated,
  panelWidth = 1024,
  panelHeight = 1024,
}: AppSidebarProps) {
  const modelFileRef = useRef<HTMLInputElement>(null)
  const textureFileRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("model")
  const [textColor, setTextColor] = useState("#000000")
  const [textBackgroundColor, setTextBackgroundColor] = useState("#ffffff")

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="texture">Texture</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Upload</CardTitle>
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
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="model-color">Model Color</Label>
                    <Input
                      id="model-color"
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {modelLoaded && (
              <Card>
                <CardHeader>
                  <CardTitle>Model Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meshInfo?.map((mesh, index) => (
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
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="texture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Texture Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="texture-upload">Upload Texture</Label>
                    <div className="flex gap-2">
                      <Input
                        id="texture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleTextureUpload}
                      />
                      <Button variant="outline" size="icon">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="sign-text">Sign Text</Label>
                      <Input
                        id="sign-text"
                        value={signName}
                        onChange={(e) => setSignName(e.target.value)}
                        placeholder="Enter sign text"
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="sign-style">Text Style</Label>
                      <Select value={signStyle} onValueChange={setSignStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Modern">Modern</SelectItem>
                          <SelectItem value="Classic">Classic</SelectItem>
                          <SelectItem value="Handwritten">Handwritten</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="text-color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="text-bg-color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="text-bg-color"
                          type="color"
                          value={textBackgroundColor}
                          onChange={(e) => setTextBackgroundColor(e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={textBackgroundColor}
                          onChange={(e) => setTextBackgroundColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <TextTextureGenerator
                      text={signName}
                      style={signStyle}
                      color={textColor}
                      backgroundColor={textBackgroundColor}
                      onTextureGenerated={onTextTextureGenerated}
                      maxWidth={panelWidth}
                      maxHeight={panelHeight}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>UV Map Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Slider
                      id="resolution"
                      min={512}
                      max={4096}
                      step={512}
                      value={[uvMapSettings.resolution]}
                      onValueChange={([value]) =>
                        setUvMapSettings({ ...uvMapSettings, resolution: value })
                      }
                    />
                    <div className="text-sm text-muted-foreground">
                      {uvMapSettings.resolution}x{uvMapSettings.resolution}
                    </div>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="wireframe">Show Wireframe</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="wireframe"
                        checked={uvMapSettings.showWireframe}
                        onChange={(e) =>
                          setUvMapSettings({
                            ...uvMapSettings,
                            showWireframe: e.target.checked,
                          })
                        }
                        aria-label="Show wireframe overlay"
                        title="Show wireframe overlay"
                      />
                      <Label htmlFor="wireframe" className="text-sm">
                        Enable wireframe overlay
                      </Label>
                    </div>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="texture">Show Texture</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="texture"
                        checked={uvMapSettings.showTexture}
                        onChange={(e) =>
                          setUvMapSettings({
                            ...uvMapSettings,
                            showTexture: e.target.checked,
                          })
                        }
                        aria-label="Show texture preview"
                        title="Show texture preview"
                      />
                      <Label htmlFor="texture" className="text-sm">
                        Show texture preview
                      </Label>
                    </div>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="bg-color">Background Color</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      value={uvMapSettings.backgroundColor}
                      onChange={(e) =>
                        setUvMapSettings({
                          ...uvMapSettings,
                          backgroundColor: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="line-color">Line Color</Label>
                    <Input
                      id="line-color"
                      type="color"
                      value={uvMapSettings.lineColor}
                      onChange={(e) =>
                        setUvMapSettings({
                          ...uvMapSettings,
                          lineColor: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
