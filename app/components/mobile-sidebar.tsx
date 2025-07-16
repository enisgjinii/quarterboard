"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Layers, Palette, Zap, Camera, X, ChevronUp, ChevronDown,
  Download, Share2, Settings, Info, History, Wand2, RotateCcw,
  Maximize2, Minimize2, Smartphone, Tablet, Monitor, Search,
  Heart, Star, Filter, Grid, List, Eye, EyeOff, Volume2, VolumeX
} from 'lucide-react'
import { toast } from '@/lib/toast-utils'

interface MobileSidebarProps {
  activeSection: 'model' | 'colors' | 'ar' | 'share' | 'settings'
  onSectionChange: (section: 'model' | 'colors' | 'ar' | 'share' | 'settings') => void
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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showWireframe, setShowWireframe] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const models = [
    { id: "quarterboard.glb", name: "Quarterboard", emoji: "🏠", description: "Classic design", category: "classic" },
    { id: "quarterboard_2.glb", name: "Quarterboard 2", emoji: "🏡", description: "Modern style", category: "modern" },
    { id: "The Captain Ahab .glb", name: "Captain Ahab", emoji: "⚓", description: "Nautical theme", category: "themed" },
    { id: "The Cisco Beach.glb", name: "Cisco Beach", emoji: "🏖️", description: "Coastal vibes", category: "themed" },
    { id: "The Gaslight.glb", name: "Gaslight", emoji: "💡", description: "Vintage charm", category: "vintage" },
    { id: "The Hilderbrand.glb", name: "Hilderbrand", emoji: "🌿", description: "Natural elegance", category: "natural" },
    { id: "The Landbank.glb", name: "Landbank", emoji: "🏦", description: "Sophisticated", category: "sophisticated" },
    { id: "The Madaket Millies.glb", name: "Madaket Millies", emoji: "🌊", description: "Ocean inspired", category: "themed" },
    { id: "The MarkFlow.glb", name: "MarkFlow", emoji: "🌊", description: "Flowing design", category: "modern" },
    { id: "The Original.glb", name: "Original", emoji: "⭐", description: "Timeless classic", category: "classic" },
    { id: "The Sconset.glb", name: "Sconset", emoji: "🏘️", description: "Traditional", category: "traditional" },
    { id: "The Shangri-La.glb", name: "Shangri-La", emoji: "🏔️", description: "Mountain retreat", category: "themed" },
  ]

  const colorPresets = [
    { name: "Natural Oak", color: "#D2B48C", description: "Light natural wood", category: "natural" },
    { name: "Rich Mahogany", color: "#8B4513", description: "Deep rich brown", category: "rich" },
    { name: "Warm Cherry", color: "#A0522D", description: "Warm reddish tone", category: "warm" },
    { name: "Dark Walnut", color: "#654321", description: "Dark sophisticated", category: "dark" },
    { name: "Light Pine", color: "#F5DEB3", description: "Pale natural finish", category: "light" },
    { name: "Golden Teak", color: "#CD853F", description: "Golden brown", category: "golden" },
    { name: "Weathered Gray", color: "#8B8B8B", description: "Aged gray finish", category: "weathered" },
    { name: "Whitewashed", color: "#F5F5DC", description: "Light white finish", category: "white" },
  ]

  const selectedModelData = models.find(model => model.id === selectedModel)

  // Filter models based on search and favorites
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorites = !showFavorites || favorites.includes(model.id)
    return matchesSearch && matchesFavorites
  })

  // Touch gesture handling for expand/collapse
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = dragStartY - currentY
    
    if (Math.abs(deltaY) > 20) {
      if (deltaY > 0 && !isExpanded) {
        setIsExpanded(true)
      } else if (deltaY < 0 && isExpanded) {
        setIsExpanded(false)
      }
      setIsDragging(false)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Toggle favorite
  const toggleFavorite = (modelId: string) => {
    setFavorites(prev => {
      const isCurrentlyFavorite = prev.includes(modelId)
      const newFavorites = isCurrentlyFavorite 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
      
      toast.success(isCurrentlyFavorite ? 'Removed from favorites' : 'Added to favorites')
      return newFavorites
    })
  }

  // Auto-collapse when switching sections
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 10000) // Auto-collapse after 10 seconds
      return () => clearTimeout(timer)
    }
  }, [isExpanded])

  return (
    <div 
      ref={sidebarRef}
      className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
        isExpanded ? 'h-[85vh]' : 'h-20'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-center py-2">
        <div className={`h-1 rounded-full transition-all duration-300 ${
          isExpanded 
            ? 'bg-blue-500 dark:bg-blue-400 w-16' 
            : 'bg-slate-300 dark:bg-slate-600 w-12'
        }`}></div>
        {isExpanded && (
          <div className="absolute top-2 right-2 text-xs text-slate-500 dark:text-slate-400">
            {activeSection}
          </div>
        )}
      </div>

      {/* Quick Navigation Tabs - Better organized */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mobile-touch-feedback"
          >
            <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </button>
        )}
        <button
          onClick={() => {
            onSectionChange('model')
            setIsExpanded(true)
          }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mobile-touch-feedback ${
            activeSection === 'model'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-102'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span className="text-xs font-medium truncate">Model</span>
        </button>
        
        <button
          onClick={() => {
            onSectionChange('colors')
            setIsExpanded(true)
          }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mobile-touch-feedback ${
            activeSection === 'colors'
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-102'
          }`}
        >
          <Palette className="h-5 w-5" />
          <span className="text-xs font-medium truncate">Colors</span>
        </button>
        
        <button
          onClick={() => {
            onSectionChange('ar')
            setIsExpanded(true)
          }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mobile-touch-feedback ${
            activeSection === 'ar'
              ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-102'
          }`}
        >
          <Zap className="h-5 w-5" />
          <span className="text-xs font-medium truncate">AR</span>
        </button>
        
        <button
          onClick={() => {
            onSectionChange('share')
            setIsExpanded(true)
          }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mobile-touch-feedback ${
            activeSection === 'share'
              ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-102'
          }`}
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs font-medium truncate">Share</span>
        </button>

        <button
          onClick={() => {
            onSectionChange('settings')
            setIsExpanded(true)
          }}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mobile-touch-feedback ${
            activeSection === 'settings'
              ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 scale-105'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:scale-102'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs font-medium truncate">Settings</span>
        </button>
      </div>

      {/* Expanded Content - Fixed height and better scrolling */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(85vh - 100px)' }}>
          {activeSection === 'model' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Choose Your Board</h3>
                </div>

                {/* Search and Filters */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFavorites(!showFavorites)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        showFavorites 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      Favorites
                    </button>
                    
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                      {viewMode === 'grid' ? 'List' : 'Grid'}
                    </button>
                  </div>
                </div>
                
                <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        toast.success(`Selected ${model.name}`)
                        setIsExpanded(false)
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                        selectedModel === model.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-102'
                      }`}
                    >
                      <span className="text-2xl">{model.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{model.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{model.description}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {favorites.includes(model.id) && (
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                        )}
                        {selectedModel === model.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'colors' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Palette className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Wood Finish</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setModelColor(preset.color)
                        toast.success(`Applied ${preset.name}`)
                        setIsExpanded(false)
                      }}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        modelColor === preset.color
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-102'
                      }`}
                    >
                      <div 
                        className="w-full h-12 rounded-lg mb-3 shadow-inner"
                        style={{ backgroundColor: preset.color }}
                      />
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {preset.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ar' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Augmented Reality</h3>
                </div>
                
                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      onToggleAR()
                      setIsExpanded(false)
                    }}
                    className={`w-full h-14 text-lg font-medium transition-all duration-200 ${
                      arMode 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg scale-105' 
                        : 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 hover:scale-102'
                    }`}
                  >
                    {arMode ? 'Exit AR Mode' : 'Enter AR Mode'}
                  </Button>

                  {arMode && (
                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-medium text-violet-800 dark:text-violet-200">AR Mode Active</span>
                      </div>
                      <p className="text-sm text-violet-700 dark:text-violet-300">
                        Point your camera at a flat surface to place your quarterboard in augmented reality.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                        <span>💡 Tip:</span>
                        <span>Use gestures to resize and rotate</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'share' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Camera className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Share Your Design</h3>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      onTakeScreenshot()
                      setIsExpanded(false)
                    }}
                    className="w-full h-14 text-lg font-medium bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Take Screenshot
                  </Button>
                  
                  <Button variant="outline" className="w-full h-14 text-lg font-medium hover:scale-102 transition-all duration-200">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Design
                  </Button>
                  
                  <Button variant="outline" className="w-full h-14 text-lg font-medium hover:scale-102 transition-all duration-200">
                    <Download className="mr-2 h-5 w-5" />
                    Export 3D Model
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <Settings className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Settings</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {showWireframe ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span className="text-sm text-slate-700 dark:text-slate-300">Wireframe Mode</span>
                    </div>
                    <button
                      onClick={() => setShowWireframe(!showWireframe)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showWireframe ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        showWireframe ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      <span className="text-sm text-slate-700 dark:text-slate-300">Sound Effects</span>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        soundEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" className="h-12 text-sm">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset View
                      </Button>
                      <Button variant="outline" size="sm" className="h-12 text-sm">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Auto Adjust
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 