"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Layers, Palette, Zap, Camera, X, ChevronUp, ChevronDown,
  Download, Share2, Settings, Info, History, Wand2
} from 'lucide-react'
import { toast } from '@/lib/toast-utils'

interface MobileSidebarProps {
  activeSection: 'model' | 'colors' | 'ar' | 'share'
  onSectionChange: (section: 'model' | 'colors' | 'ar' | 'share') => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  modelColor: string
  setModelColor: (color: string) => void
  meshColors: Record<string, string>
  setMeshColors: (colors: Record<string, string>) => void
  arMode: boolean
  onToggleAR: () => void
  onTakeScreenshot: () => void
}

export function MobileSidebar({
  activeSection,
  onSectionChange,
  selectedModel,
  setSelectedModel,
  modelColor,
  setModelColor,
  meshColors,
  setMeshColors,
  arMode,
  onToggleAR,
  onTakeScreenshot
}: MobileSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const models = [
    { id: "quarterboard.glb", name: "Quarterboard", emoji: "🏠" },
    { id: "quarterboard_2.glb", name: "Quarterboard 2", emoji: "🏡" },
    { id: "The Captain Ahab .glb", name: "Captain Ahab", emoji: "⚓" },
    { id: "The Cisco Beach.glb", name: "Cisco Beach", emoji: "🏖️" },
    { id: "The Gaslight.glb", name: "Gaslight", emoji: "💡" },
    { id: "The Hilderbrand.glb", name: "Hilderbrand", emoji: "🌿" },
    { id: "The Landbank.glb", name: "Landbank", emoji: "🏦" },
    { id: "The Madaket Millies.glb", name: "Madaket Millies", emoji: "🌊" },
    { id: "The MarkFlow.glb", name: "MarkFlow", emoji: "🌊" },
    { id: "The Original.glb", name: "Original", emoji: "⭐" },
    { id: "The Sconset.glb", name: "Sconset", emoji: "🏘️" },
    { id: "The Shangri-La.glb", name: "Shangri-La", emoji: "🏔️" },
  ]

  const colorPresets = [
    { name: "Natural Oak", color: "#D2B48C" },
    { name: "Rich Mahogany", color: "#8B4513" },
    { name: "Warm Cherry", color: "#A0522D" },
    { name: "Dark Walnut", color: "#654321" },
    { name: "Light Pine", color: "#F5DEB3" },
    { name: "Golden Teak", color: "#CD853F" },
  ]

  const selectedModelData = models.find(model => model.id === selectedModel)

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
      isExpanded ? 'h-96' : 'h-16'
    }`}>
      {/* Handle Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center justify-around px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => onSectionChange('model')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeSection === 'model'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="text-xs font-medium">Model</span>
        </button>
        
        <button
          onClick={() => onSectionChange('colors')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeSection === 'colors'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span className="text-xs font-medium">Colors</span>
        </button>
        
        <button
          onClick={() => onSectionChange('ar')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeSection === 'ar'
              ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span className="text-xs font-medium">AR</span>
        </button>
        
        <button
          onClick={() => onSectionChange('share')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeSection === 'share'
              ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 max-h-80">
          {activeSection === 'model' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Choose Your Board</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        toast.success(`Selected ${model.name}`)
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        selectedModel === model.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg">{model.emoji}</span>
                      <span className="text-sm font-medium truncate">{model.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'colors' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Base Color</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setModelColor(preset.color)
                        toast.success(`Applied ${preset.name}`)
                      }}
                      className={`p-3 rounded-lg border transition-colors ${
                        modelColor === preset.color
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div 
                        className="w-full h-8 rounded mb-2"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ar' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-violet-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Augmented Reality</h3>
                </div>
                
                <div className="space-y-4">
                  <Button
                    onClick={onToggleAR}
                    className={`w-full transition-all duration-200 ${
                      arMode 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                    }`}
                  >
                    {arMode ? 'Exit AR Mode' : 'Enter AR Mode'}
                  </Button>

                  {arMode && (
                    <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-violet-800 dark:text-violet-200">AR Mode Active</span>
                      </div>
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        Your quarterboard is now viewable in augmented reality. Use your device's camera to place it in your space.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'share' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Share Your Design</h3>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={onTakeScreenshot}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take Screenshot
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Design
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 