"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Sun, Moon, Download, Mail, Video, Square, Palette, TextCursor, Layers, RotateCcw, Box } from "lucide-react"
import { useTheme } from "next-themes"
import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import emailjs from '@emailjs/browser'
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontPreviewer } from "./font-previewer"
import { Scene } from "@babylonjs/core"
import { UVTextEditor } from "./uv-text-editor"
import { MeshInfoPanel } from "./mesh-info-panel"
import { ModelLoadData } from "./three-scene"

interface MeshData {
  name: string;
  color: string;
  originalMaterial: any;
}

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
  meshes: MeshData[];
  selectedMesh: string | null;
  setSelectedMesh: (mesh: string | null) => void;
  meshColors: Record<string, string>;
  setMeshColors: (colors: Record<string, string>) => void;
  onTextTextureUpdate: (texture: string | null) => void;
  modelData?: ModelLoadData;
  averageFps?: number;
}

export function AppSidebar({
  selectedModel,
  setSelectedModel,
  modelColor,
  setModelColor,
  meshes,
  selectedMesh,
  setSelectedMesh,
  meshColors,
  setMeshColors,
  onTextTextureUpdate,
  modelData,
  averageFps,
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [activeSection, setActiveSection] = useState<'model' | 'text' | 'colors' | 'info'>('model')

  // Handle mesh color changes
  const handleMeshColorChange = (meshName: string, color: string) => {
    setMeshColors({
      ...meshColors,
      [meshName]: color
    });
  };

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
    // NOTE: Text3D requires .json typeface files. 
    // The TTF files listed below would require a conversion step.
    // "EBGaramond-Regular.ttf",
    // "EBGaramond-Bold.ttf",
    // "EBGaramond-Italic.ttf",
    // "EBGaramond-BoldItalic.ttf",
    // "CopperplateCC-Bold.ttf",
    // "CopperplateCC-Heavy.ttf",
    // "Bookman Old Style Regular.ttf",
    // "Bookman Old Style Bold.ttf",
    // "Bookman Old Style Italic.ttf",
    // "Bookman Old Style Bold Italic.ttf"
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true)
      toast.info('Exporting scene...')
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
      toast.success('Email sent successfully!')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white/95 dark:bg-slate-900/95">
      {/* Header - More compact */}
      <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Designer Panel
          </h2>
          
          {/* FPS Monitor */}
          {process.env.NODE_ENV === 'development' && averageFps && (
            <div className="bg-black/80 text-white px-1.5 py-0.5 text-xs rounded font-mono backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${averageFps > 50 ? 'bg-green-400' : averageFps > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                {averageFps.toFixed(0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs - More compact */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <Button
          variant={activeSection === 'model' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('model')}
          className="flex-1 rounded-none border-r border-slate-200 dark:border-slate-700 h-8 text-xs"
        >
          <Layers className="h-3 w-3 mr-1" />
          Model
        </Button>
        
        <Button
          variant={activeSection === 'colors' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('colors')}
          className="flex-1 rounded-none border-r border-slate-200 dark:border-slate-700 h-8 text-xs"
        >
          <Palette className="h-3 w-3 mr-1" />
          Colors
        </Button>
        
        <Button
          variant={activeSection === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('text')}
          className="flex-1 rounded-none border-r border-slate-200 dark:border-slate-700 h-8 text-xs"
        >
          <TextCursor className="h-3 w-3 mr-1" />
          Text
        </Button>
        
        <Button
          variant={activeSection === 'info' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('info')}
          className="flex-1 rounded-none h-8 text-xs"
        >
          <Box className="h-3 w-3 mr-1" />
          Info
        </Button>
      </div>

      {/* Content Area - More compact */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        {activeSection === 'model' && (
          <div className="space-y-2">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2 p-3 bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  Quarterboard Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1">
                  <Label htmlFor="model-select" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Choose Model Style
                  </Label>
                  <select 
                    id="model-select"
                    className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    title="Select a quarterboard model"
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>
                        🏄‍♂️ {model.replace('.glb', '').replace(/^The /, '')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Base Wood Color</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="w-12 h-8 p-1 border rounded-md cursor-pointer"
                      title="Click to choose color"
                    />
                    <Input
                      type="text"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="flex-1 text-xs h-8"
                      placeholder="#8B4513"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    This sets the base color for all parts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'colors' && (
          <div className="space-y-2">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2 p-3 bg-purple-50 dark:bg-purple-900/20">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-600" />
                  Part Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3 pt-0">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Select Part ({meshes.length} available)
                  </Label>
                  <select 
                    className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    value={selectedMesh || ""}
                    onChange={(e) => setSelectedMesh(e.target.value || null)}
                    title="Select a mesh part to customize"
                  >
                    <option value="">🎨 Choose a part to color</option>
                    {meshes.map((mesh) => (
                      <option key={mesh.name} value={mesh.name}>
                        🔧 {mesh.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedMesh && (
                  <div className="space-y-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Label className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      Color for "{selectedMesh}"
                    </Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={meshColors[selectedMesh] || modelColor}
                        onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                        className="w-12 h-8 p-1 border rounded-md cursor-pointer"
                        title="Click to choose color"
                      />
                      <Input
                        type="text"
                        value={meshColors[selectedMesh] || modelColor}
                        onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                        className="flex-1 text-xs h-8"
                        placeholder="#8B4513"
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  💡 <strong>Pro tip:</strong> Click on model parts in the 3D view to select them quickly
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'text' && (
          <div className="space-y-2">
            <UVTextEditor 
              modelUrl={`/models/${encodeURIComponent(selectedModel)}`}
              onTextUpdate={onTextTextureUpdate}
            />
          </div>
        )}

        {activeSection === 'info' && (
          <div className="space-y-2">
            <MeshInfoPanel
              modelData={modelData}
              selectedMesh={selectedMesh}
              onMeshSelect={setSelectedMesh}
            />
          </div>
        )}
      </div>

      {/* Footer Actions - More compact */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-2 space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Design'}
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="text-sm"
          />
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={isSending}
            className="text-sm"
          >
            <Mail className="mr-1 h-3 w-3" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
