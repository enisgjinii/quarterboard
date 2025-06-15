"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Sun, Moon, Download, Mail, Video, Square } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import emailjs from '@emailjs/browser'
import * as THREE from 'three'
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontPreviewer } from "./font-previewer"

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
  selectedFont: string;
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
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  scene: THREE.Scene | null;
  gl: THREE.WebGLRenderer | null;
  onExport: (data: any) => void;
  isRecording?: boolean
  onRecordingStart?: () => void
  onRecordingStop?: () => void
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
  selectedFont,
  setSelectedFont,
  scene,
  gl,
  onExport,
  isRecording = false,
  onRecordingStart,
  onRecordingStop,
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const models = [
    "quarterboard.glb",
    "quarterboard_2.glb",
    "The Captain Ahab .glb",
    "The Cisco Beach.glb",
    "The Gaslight.glb",
    "The Hilderbrand.glb",
    "The Landbank.glb",
    "The Madaket Millies.glb",
    "The MarkFlow.glb",
    "The Original.glb",
    "The Sconset.glb",
    "The Shangri-La.glb",
  ]

  const fonts = [
    "helvetiker_regular.typeface.json",
    "EBGaramond-Regular.ttf",
    "EBGaramond-Bold.ttf",
    "EBGaramond-Italic.ttf",
    "EBGaramond-BoldItalic.ttf",
    "CopperplateCC-Bold.ttf",
    "CopperplateCC-Heavy.ttf",
    "Bookman Old Style Regular.ttf",
    "Bookman Old Style Bold.ttf",
    "Bookman Old Style Italic.ttf",
    "Bookman Old Style Bold Italic.ttf"
  ];

  useEffect(() => {
    if (selectedModel) {
      setModelUrl(`/models/${selectedModel}`)
    }
  }, [selectedModel, setModelUrl])

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      // Stop timer and reset duration
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setRecordingDuration(0)
    }

    // Cleanup
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }, [isRecording])

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
      image,
      selectedFont
    };

    return sceneData;
  };

  const sendEmail = async (data: SceneData) => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsSending(true);

      // Initialize EmailJS
      emailjs.init('eG7bbVA-D3yNyGjbj');

      // Create a minimal version of the scene data without the image
      const minimalSceneData = {
        modelUrl: data.modelUrl,
        modelColor: data.modelColor,
        text3D: data.text3D,
        textColor: data.textColor,
        textPosition: data.textPosition,
        textRotation: data.textRotation,
        textScale: data.textScale,
        textMaterial: data.textMaterial,
        engraveDepth: data.engraveDepth,
        isEngraving: data.isEngraving
      };

      // Get current time
      const now = new Date();
      const time = now.toLocaleString();

      // Prepare template parameters
      const templateParams = {
        to_email: email,
        name: 'QuarterBoard App',
        from_name: 'QuarterBoard App',
        message: `Here is your exported scene data. The scene image has been omitted due to size limitations.\n\nScene Data:\n${JSON.stringify(minimalSceneData, null, 2)}`,
        time: time
      };

      console.log('Sending email with params:', {
        serviceID: 'service_2g3snpe',
        templateID: 'template_vsp1vjs',
        toEmail: email,
        dataSize: JSON.stringify(templateParams).length
      });

      // Send email using Promise
      const result = await new Promise((resolve, reject) => {
        emailjs.send(
          'service_2g3snpe',
          'template_vsp1vjs',
          templateParams
        )
        .then((response) => {
          console.log('EmailJS response:', response);
          resolve(response);
        })
        .catch((error) => {
          console.error('EmailJS error details:', {
            error,
            message: error.message,
            text: error.text,
            status: error.status,
            stack: error.stack
          });
          reject(error);
        });
      });

      console.log('Email sent successfully:', result);
      toast.success('Scene data sent successfully!');
    } catch (error: any) {
      console.error('Detailed error in sendEmail:', {
        error,
        message: error.message,
        text: error.text,
        status: error.status,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to send scene data. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleExport = async () => {
    if (!scene || !gl) return;

    try {
      setIsExporting(true);
      const sceneData = await captureScene();
      if (!sceneData) {
        toast.error('Failed to capture scene data');
        return;
      }

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
        toast.success('Scene data downloaded successfully!');
      }

      onExport(sceneData);
    } catch (error: any) {
      console.error('Error exporting scene:', error);
      toast.error(error.message || 'Failed to export scene. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Type className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">3D Editor</h1>
            <p className="text-xs text-muted-foreground">Model Customization</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Model Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-xs">Select Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select" className="h-8 text-sm">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model} className="text-sm">
                      {model.replace('.glb', '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-color" className="text-xs">Model Color</Label>
              <div className="flex gap-2">
                <Input
                  id="model-color"
                  type="color"
                  value={modelColor}
                  onChange={(e) => setModelColor(e.target.value)}
                  className="w-8 h-8 p-1"
                />
                <Input
                  value={modelColor}
                  onChange={(e) => setModelColor(e.target.value)}
                  placeholder="#ffffff"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Text Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="text-3d" className="text-xs">3D Text</Label>
              <Input
                id="text-3d"
                value={text3D}
                onChange={(e) => setText3D(e.target.value)}
                placeholder="Enter text"
                className="h-8 text-sm"
              />
            </div>

            {/* Font Previewer component that shows font options with preview */}
            <FontPreviewer 
              fonts={fonts}
              selectedFont={selectedFont}
              setSelectedFont={setSelectedFont}
              previewText={text3D || "Sample Text"}
            />

            <div className="space-y-2">
              <Label htmlFor="text-color" className="text-xs">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 p-1"
                />
                <Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#ffffff"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-material" className="text-xs">Text Material</Label>
              <Select value={textMaterial} onValueChange={(value: 'standard' | 'emissive' | 'engraved') => setTextMaterial(value)}>
                <SelectTrigger id="text-material" className="h-8 text-sm">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-sm">Standard</SelectItem>
                  <SelectItem value="emissive" className="text-sm">Emissive</SelectItem>
                  <SelectItem value="engraved" className="text-sm">Engraved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="engrave-depth" className="text-xs">Engrave Depth</Label>
              <Slider
                id="engrave-depth"
                value={[engraveDepth]}
                onValueChange={([value]) => setEngraveDepth(value)}
                min={0}
                max={1}
                step={0.1}
                className="h-8"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-engraving"
                checked={isEngraving}
                onChange={(e) => setIsEngraving(e.target.checked)}
                className="h-3.5 w-3.5"
                aria-label="Enable engraving"
                title="Enable engraving"
              />
              <Label htmlFor="is-engraving" className="text-xs">Enable Engraving</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Recording Status</Label>
                <span className={`text-sm ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                  {isRecording ? `Recording: ${formatDuration(recordingDuration)}` : 'Not Recording'}
                </span>
              </div>
              <Button
                onClick={isRecording ? onRecordingStop : onRecordingStart}
                className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
                disabled={!onRecordingStart || !onRecordingStop}
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
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
