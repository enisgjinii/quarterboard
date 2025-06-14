"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Sun, Moon, Download, Mail } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { toast } from "sonner"
import emailjs from '@emailjs/browser'
import * as THREE from 'three'
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SceneData {
  modelUrl: string;
  modelColor: string;
  text3D: string;
  textColor: string;
  textPosition: { x: number; y: number; z: number };
  textRotation: { x: number; y: number; z: number };
  textScale: { x: number; y: number; z: number };
  textMaterial: 'standard' | 'emissive' | 'engraved';
  engraveDepth: number;
  isEngraving: boolean;
  image: string;
}

interface AppSidebarProps {
  modelUrl: string;
  setModelUrl: (url: string) => void;
  modelColor: string;
  setModelColor: (color: string) => void;
  text3D: string;
  setText3D: (text: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  textPosition: { x: number; y: number; z: number };
  setTextPosition: (position: { x: number; y: number; z: number }) => void;
  textRotation: { x: number; y: number; z: number };
  setTextRotation: (rotation: { x: number; y: number; z: number }) => void;
  textScale: { x: number; y: number; z: number };
  setTextScale: (scale: { x: number; y: number; z: number }) => void;
  textMaterial: 'standard' | 'emissive' | 'engraved';
  setTextMaterial: (material: 'standard' | 'emissive' | 'engraved') => void;
  engraveDepth: number;
  setEngraveDepth: (depth: number) => void;
  isEngraving: boolean;
  setIsEngraving: (isEngraving: boolean) => void;
  scene: THREE.Scene | null;
  gl: THREE.WebGLRenderer | null;
  onExport: (data: any) => void;
}

export function AppSidebar({
  modelUrl,
  setModelUrl,
  modelColor,
  setModelColor,
  text3D,
  setText3D,
  textColor,
  setTextColor,
  textPosition,
  setTextPosition,
  textRotation,
  setTextRotation,
  textScale,
  setTextScale,
  textMaterial,
  setTextMaterial,
  engraveDepth,
  setEngraveDepth,
  isEngraving,
  setIsEngraving,
  scene,
  gl,
  onExport
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const captureScene = async (): Promise<SceneData | null> => {
    if (!scene || !gl) return null;

    // Capture the current view as an image
    const image = gl.domElement.toDataURL('image/png');

    // Collect scene data
    const sceneData: SceneData = {
      modelUrl,
      modelColor,
      text3D,
      textColor,
      textPosition,
      textRotation,
      textScale,
      textMaterial,
      engraveDepth,
      isEngraving,
      image
    };

    return sceneData;
  }

  const sendEmail = async (data: any) => {
    if (!email) return;

    try {
      setIsSending(true);
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          to_email: email,
          scene_data: JSON.stringify(data)
        },
        'YOUR_PUBLIC_KEY'
      );
      toast.success('Scene data sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send scene data. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  const handleExport = async () => {
    if (!scene || !gl) return;

    try {
      setIsExporting(true);
      const sceneData = await captureScene();
      if (!sceneData) return;

      if (email) {
        await sendEmail(sceneData);
      } else {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      onExport(sceneData);
    } catch (error) {
      console.error('Error exporting scene:', error);
      toast.error('Failed to export scene. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Type className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">3D Editor</h1>
            <p className="text-xs text-muted-foreground">Model Customization</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-url">Model URL</Label>
                <Input
                  id="model-url"
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  placeholder="Enter model URL"
                />
              </div>

              <div className="space-y-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-3d">3D Text</Label>
                <Input
                  id="text-3d"
                  value={text3D}
                  onChange={(e) => setText3D(e.target.value)}
                  placeholder="Enter 3D text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Text Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={textPosition.x}
                    onChange={(e) => setTextPosition({ ...textPosition, x: parseFloat(e.target.value) })}
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    value={textPosition.y}
                    onChange={(e) => setTextPosition({ ...textPosition, y: parseFloat(e.target.value) })}
                    placeholder="Y"
                  />
                  <Input
                    type="number"
                    value={textPosition.z}
                    onChange={(e) => setTextPosition({ ...textPosition, z: parseFloat(e.target.value) })}
                    placeholder="Z"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Text Rotation</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={textRotation.x}
                    onChange={(e) => setTextRotation({ ...textRotation, x: parseFloat(e.target.value) })}
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    value={textRotation.y}
                    onChange={(e) => setTextRotation({ ...textRotation, y: parseFloat(e.target.value) })}
                    placeholder="Y"
                  />
                  <Input
                    type="number"
                    value={textRotation.z}
                    onChange={(e) => setTextRotation({ ...textRotation, z: parseFloat(e.target.value) })}
                    placeholder="Z"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Text Scale</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={textScale.x}
                    onChange={(e) => setTextScale({ ...textScale, x: parseFloat(e.target.value) })}
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    value={textScale.y}
                    onChange={(e) => setTextScale({ ...textScale, y: parseFloat(e.target.value) })}
                    placeholder="Y"
                  />
                  <Input
                    type="number"
                    value={textScale.z}
                    onChange={(e) => setTextScale({ ...textScale, z: parseFloat(e.target.value) })}
                    placeholder="Z"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-material">Text Material</Label>
                <Select value={textMaterial} onValueChange={(value: 'standard' | 'emissive' | 'engraved') => setTextMaterial(value)}>
                  <SelectTrigger id="text-material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="emissive">Emissive</SelectItem>
                    <SelectItem value="engraved">Engraved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engrave-depth">Engrave Depth</Label>
                <Slider
                  id="engrave-depth"
                  value={[engraveDepth]}
                  onValueChange={([value]) => setEngraveDepth(value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-engraving"
                  checked={isEngraving}
                  onChange={(e) => setIsEngraving(e.target.checked)}
                  aria-label="Enable engraving"
                  title="Enable engraving"
                />
                <Label htmlFor="is-engraving">Enable Engraving</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to receive scene data"
                />
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting || isSending}
                className="w-full"
              >
                {isExporting ? (
                  'Exporting...'
                ) : isSending ? (
                  'Sending...'
                ) : email ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send via Email
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Scene Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
