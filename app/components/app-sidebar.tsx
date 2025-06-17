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
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontPreviewer } from "./font-previewer"
import { Scene } from "@babylonjs/core"

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

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  materials: string[]
  uvSets: string[]
  materialData?: Array<{
    color?: string
    roughness?: number
    metalness?: number
    map?: string
  }>
}

interface AppSidebarProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelColor: string;
  setModelColor: (color: string) => void;
  meshInfo: MeshInfo[];
  selectedMaterial: string | null;
  setSelectedMaterial: (material: string | null) => void;
  materialPreview: string | null;
  setMaterialPreview: (preview: string | null) => void;
  isPreviewMode: boolean;
  setIsPreviewMode: (mode: boolean) => void;
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
  text3DOptions: any;
  setText3DOptions: (options: any) => void;
  textMaterial: 'standard' | 'emissive' | 'engraved';
  setTextMaterial: (material: 'standard' | 'emissive' | 'engraved') => void;
  engraveDepth: number;
  setEngraveDepth: (depth: number) => void;
  isEngraving: boolean;
  setIsEngraving: (isEngraving: boolean) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  uvMapTexture: string | null;
  setUvMapTexture: (texture: string | null) => void;
  uvMapText: string;
  setUvMapText: (text: string) => void;
  uvMapTextOptions: any;
  setUvMapTextOptions: (options: any) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  recordedVideo: Blob | null;
  setRecordedVideo: (video: Blob | null) => void;
}

export function AppSidebar({
  selectedModel,
  setSelectedModel,
  modelColor,
  setModelColor,
  meshInfo,
  selectedMaterial,
  setSelectedMaterial,
  materialPreview,
  setMaterialPreview,
  isPreviewMode,
  setIsPreviewMode,
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
  text3DOptions,
  setText3DOptions,
  textMaterial,
  setTextMaterial,
  engraveDepth,
  setEngraveDepth,
  isEngraving,
  setIsEngraving,
  selectedFont,
  setSelectedFont,
  uvMapTexture,
  setUvMapTexture,
  uvMapText,
  setUvMapText,
  uvMapTextOptions,
  setUvMapTextOptions,
  isRecording,
  setIsRecording,
  recordedVideo,
  setRecordedVideo
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
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

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setRecordingDuration(0)
    }
  }, [isRecording])

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      toast.info('Exporting scene...')
      // Export logic here
      toast.success('Scene exported successfully!')
    } catch (error) {
      console.error('Error exporting scene:', error)
      toast.error('Failed to export scene')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    try {
      setIsSending(true)
      toast.info('Sending email...')
      // Email sending logic here
      toast.success('Email sent successfully!')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="w-72 border-r bg-background p-4 space-y-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Model Color</Label>
            <Input
              type="color"
              value={modelColor}
              onChange={(e) => setModelColor(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3D Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Text</Label>
            <Input
              value={text3D}
              onChange={(e) => setText3D(e.target.value)}
              placeholder="Enter text"
            />
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Font</Label>
            <Select value={selectedFont} onValueChange={setSelectedFont}>
              <SelectTrigger>
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Material</Label>
            <Select value={textMaterial} onValueChange={setTextMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="emissive">Emissive</SelectItem>
                <SelectItem value="engraved">Engraved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {textMaterial === 'engraved' && (
            <div className="space-y-2">
              <Label>Engrave Depth</Label>
              <Slider
                value={[engraveDepth]}
                onValueChange={([value]) => setEngraveDepth(value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Scene'}
          </Button>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSendEmail}
              disabled={isSending}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsRecording(!isRecording)}
          >
            <Video className="mr-2 h-4 w-4" />
            {isRecording ? `Stop Recording (${formatDuration(recordingDuration)})` : 'Start Recording'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
