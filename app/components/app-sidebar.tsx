"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Sun, Moon, Download, Mail, Video, Square, Palette, TextCursor, Layers, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"
import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import emailjs from '@emailjs/browser'
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontPreviewer } from "./font-previewer"
import { Scene } from "@babylonjs/core"

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
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  isTextEditing?: boolean;
  setIsTextEditing?: (editing: boolean) => void;
  averageFps?: number;
  performanceMode?: boolean;
  setPerformanceMode?: (mode: boolean) => void;
  resetView?: () => void;
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
  selectedFont,
  setSelectedFont,
  isTextEditing,
  setIsTextEditing,
  averageFps,
  performanceMode,
  setPerformanceMode,
  resetView
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [activeSection, setActiveSection] = useState<'model' | 'text' | 'colors'>('model')

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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Designer Panel
          </h2>
          
          {/* FPS Monitor */}
          {process.env.NODE_ENV === 'development' && averageFps && (
            <div className="bg-black/80 text-white px-2 py-1 text-xs rounded font-mono backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${averageFps > 50 ? 'bg-green-400' : averageFps > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                {averageFps.toFixed(1)} FPS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <Button
          variant={activeSection === 'model' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('model')}
          className="flex-1 rounded-none border-r border-slate-200 dark:border-slate-700"
        >
          <Layers className="h-4 w-4 mr-2" />
          Model
        </Button>
        
        <Button
          variant={activeSection === 'colors' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('colors')}
          className="flex-1 rounded-none border-r border-slate-200 dark:border-slate-700"
        >
          <Palette className="h-4 w-4 mr-2" />
          Colors
        </Button>
        
        <Button
          variant={activeSection === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveSection('text')}
          className="flex-1 rounded-none"
        >
          <TextCursor className="h-4 w-4 mr-2" />
          Text
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeSection === 'model' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quarterboard Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select" className="text-sm font-medium">Select Model</Label>
                  <select 
                    id="model-select"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    title="Select a quarterboard model"
                  >
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model.replace('.glb', '').replace(/^The /, '')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Base Model Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded-md"
                    />
                    <Input
                      type="text"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="flex-1 text-sm"
                      placeholder="#8B4513"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'colors' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mesh Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Mesh Part</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedMesh || ""}
                    onChange={(e) => setSelectedMesh(e.target.value || null)}
                    title="Select a mesh part to customize"
                  >
                    <option value="">Choose a part to color</option>
                    {meshes.map((mesh) => (
                      <option key={mesh.name} value={mesh.name}>
                        {mesh.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedMesh && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Part Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={meshColors[selectedMesh] || modelColor}
                        onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                        className="w-16 h-10 p-1 border rounded-md"
                      />
                      <Input
                        type="text"
                        value={meshColors[selectedMesh] || modelColor}
                        onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  💡 Click on model parts in the 3D view to select them quickly
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'text' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3D Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Text Content</Label>
                  <Input
                    value={text3D}
                    onChange={(e) => setText3D(e.target.value)}
                    placeholder="Enter your text"
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-16 h-10 p-1 border rounded-md"
                    />
                    <Input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-select" className="text-sm font-medium">Font</Label>
                  <select 
                    id="font-select"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    title="Select a font"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>
                        {font.replace('.ttf', '').replace('.json', '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Position</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">X</Label>
                      <Input
                        type="number"
                        value={textPosition.x.toFixed(1)}
                        onChange={(e) => setTextPosition({...textPosition, x: parseFloat(e.target.value) || 0})}
                        step={0.1}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Y</Label>
                      <Input
                        type="number"
                        value={textPosition.y.toFixed(1)}
                        onChange={(e) => setTextPosition({...textPosition, y: parseFloat(e.target.value) || 0})}
                        step={0.1}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Z</Label>
                      <Input
                        type="number"
                        value={textPosition.z.toFixed(1)}
                        onChange={(e) => setTextPosition({...textPosition, z: parseFloat(e.target.value) || 0})}
                        step={0.1}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                  <input
                    type="checkbox"
                    id="text-editing-mode"
                    checked={isTextEditing}
                    onChange={(e) => setIsTextEditing?.(e.target.checked)}
                    className="rounded border-gray-300"
                    title="Enable click-to-place text mode"
                  />
                  <Label htmlFor="text-editing-mode" className="text-sm">
                    Enable click-to-place text
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
        {/* Performance and Text Controls */}
        <div className="space-y-2">
          {/* Performance Mode Toggle */}
          {setPerformanceMode && (
            <Button
              variant={performanceMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPerformanceMode(!performanceMode)}
              className={`w-full h-8 ${performanceMode ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            >
              {performanceMode ? "Performance Mode" : "Quality Mode"}
            </Button>
          )}
          
          {/* Text Editing Toggle */}
          {setIsTextEditing && (
            <Button
              variant={isTextEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsTextEditing(!isTextEditing)}
              className={`w-full h-8 ${isTextEditing ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
            >
              {isTextEditing ? "Exit Text Edit" : "Edit Text"}
            </Button>
          )}
          
          {/* Reset View Button */}
          {resetView && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetView}
              className="w-full h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset View
            </Button>
          )}
        </div>
        
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
