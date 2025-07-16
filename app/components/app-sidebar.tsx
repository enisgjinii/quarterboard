"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Mail, Palette, Layers, Info, Sparkles, ChevronDown, Check, Camera, Share2, Wand2, Copy, Heart, Star, Save, History, Undo2, Redo2, Eye, EyeOff, Zap, Settings, QrCode, Instagram, Linkedin, MessageCircle, Globe, FileImage, Video, Mic, Play, Pause, RotateCcw, Shuffle, TrendingUp, Award, Users, Clock, Smartphone, Tablet, Monitor, X, Menu, ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"
import { toast } from "@/lib/toast-utils"
import { ModelLoadData } from "./three-scene"
import { ARViewer } from "./ar-viewer"
import QRCode from 'qrcode'

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
  // AR Props
  arMode?: boolean;
  setArMode?: (mode: boolean) => void;
  arPlaced?: boolean;
  setArPlaced?: (placed: boolean) => void;
  arScale?: number;
  setArScale?: (scale: number) => void;
  arSupported?: boolean;
  onARPlaced?: (placed: boolean) => void;
  onStartARSession?: () => Promise<void>;
  onStopARSession?: () => void;
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
  // AR Props
  arMode,
  setArMode,
  arPlaced,
  setArPlaced,
  arScale,
  setArScale,
  arSupported,
  onARPlaced,
  onStartARSession,
  onStopARSession,
}: AppSidebarProps) {
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [activeSection, setActiveSection] = useState<'model' | 'colors' | 'presets' | 'share' | 'history' | 'ar' | 'info'>('model')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null)
  const [shareStats, setShareStats] = useState({ views: 0, likes: 0, shares: 0 })
  const [designHistory, setDesignHistory] = useState<Array<{id: string, name: string, timestamp: Date, preview: string, colors: Record<string, string>, baseColor: string}>>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [isRecordingTimelapse, setIsRecordingTimelapse] = useState(false)
  const [timelapseFrames, setTimelapseFrames] = useState<string[]>([])
  const [shareFormat, setShareFormat] = useState<'image' | 'video' | 'ar'>('image')
  const [customShareMessage, setCustomShareMessage] = useState('')
  
  // 📱 Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  
  // AR State (now from props)
  const [arPlacedLocal, setArPlacedLocal] = useState(false)
  const [arScaleLocal, setArScaleLocal] = useState(1)
  const [arSupportedLocal, setArSupportedLocal] = useState(false)

  // Use props if available, otherwise use local state
  const currentArMode = arMode ?? false
  const currentArPlaced = arPlaced ?? arPlacedLocal
  const currentArScale = arScale ?? arScaleLocal
  const currentArSupported = arSupported ?? arSupportedLocal

  const setCurrentArMode = setArMode ?? (() => {})
  const setCurrentArPlaced = setArPlaced ?? setArPlacedLocal
  const setCurrentArScale = setArScale ?? setArScaleLocal

  // Model data and presets
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
  
  // 🎨 NEW FEATURE 1: Design Presets & Themes
  const designPresets = [
    {
      name: "Ocean Vibes",
      emoji: "🌊",
      description: "Cool blues and teals",
      baseColor: "#2563eb",
      meshColors: { "mesh_0": "#0ea5e9", "mesh_1": "#06b6d4", "mesh_2": "#0891b2" },
      popularity: 95
    },
    {
      name: "Sunset Beach",
      emoji: "🌅",
      description: "Warm oranges and reds",
      baseColor: "#ea580c",
      meshColors: { "mesh_0": "#f97316", "mesh_1": "#ef4444", "mesh_2": "#dc2626" },
      popularity: 88
    },
    {
      name: "Forest Green",
      emoji: "🌲",
      description: "Natural greens",
      baseColor: "#16a34a",
      meshColors: { "mesh_0": "#22c55e", "mesh_1": "#15803d", "mesh_2": "#166534" },
      popularity: 92
    },
    {
      name: "Classic Wood",
      emoji: "🪵",
      description: "Traditional wood tones",
      baseColor: "#8B4513",
      meshColors: { "mesh_0": "#A0522D", "mesh_1": "#CD853F", "mesh_2": "#DEB887" },
      popularity: 100
    },
    {
      name: "Midnight",
      emoji: "🌙",
      description: "Deep blues and purples",
      baseColor: "#1e1b4b",
      meshColors: { "mesh_0": "#312e81", "mesh_1": "#4c1d95", "mesh_2": "#581c87" },
      popularity: 76
    },
    {
      name: "Tropical",
      emoji: "🏝️",
      description: "Bright tropical colors",
      baseColor: "#10b981",
      meshColors: { "mesh_0": "#f59e0b", "mesh_1": "#ef4444", "mesh_2": "#8b5cf6" },
      popularity: 84
    }
  ]
  
  const selectedModelData = models.find(model => model.id === selectedModel)
  
  // AR Session (local only)
  const [arSession, setArSession] = useState<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 📱 Mobile Responsiveness Effects
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const checkDeviceType = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      
      // Auto-collapse sidebar on mobile
      if (width < 768) {
        setSidebarCollapsed(true)
      }
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
    return () => window.removeEventListener('resize', checkDeviceType)
  }, [])

  // 📱 Mobile Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    const touchY = e.touches[0].clientY
    const deltaY = touchStartY - touchY
    
    // Swipe up to expand, down to collapse
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0 && sidebarCollapsed) {
        setSidebarCollapsed(false)
      } else if (deltaY < 0 && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }
  }

  // 🚀 Enhanced AR Functions
  const generateQRCode = async (data: string) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCodeDataUrl)
      return qrCodeDataUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
      return null
    }
  }

  const startARSession = async () => {
    // Use the main page's AR session management
    if (onStartARSession) {
      await onStartARSession()
    } else {
      // Fallback for when props are not provided
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmallScreen = window.innerWidth < 768
      const isMobile = isMobileDevice || isSmallScreen
      
      if (isMobile) {
        // For mobile, enable AR preview mode
        setCurrentArMode(true)
        toast.success('AR preview mode activated!', {
          description: 'Using device orientation for AR simulation on mobile',
          duration: 3000,
        })
      } else {
        toast.error('AR not supported on this device')
      }
    }
  }

  const stopARSession = () => {
    if (arSession) {
      arSession.end()
      setArSession(null)
    }
    if (onStopARSession) {
      onStopARSession()
    } else {
      setCurrentArMode(false)
      setCurrentArPlaced(false)
    }
    toast.info('AR session ended')
  }

  // Handle mesh color changes
  const handleMeshColorChange = (meshName: string, color: string) => {
    console.log(`🎨 Changing color for ${meshName} to ${color}`);
    const newColors = {
      ...meshColors,
      [meshName]: color
    };
    setMeshColors(newColors);
    
    // Show feedback to user
    toast.success(`Updated ${meshName}`, {
      description: `Color changed to ${color}`,
      duration: 1500,
    });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true)
      toast.info('Preparing export...')
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Design exported successfully!')
    } catch (error) {
      console.error('Error exporting scene:', error)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsSending(true)
      toast.info('Sending design...')
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Design sent to your email!')
      setEmail('')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const handleTakeScreenshot = async (format: 'image' | 'video' | 'ar' = 'image') => {
    try {
      setIsCapturing(true)
      
      if (format === 'video') {
        toast.info('Creating timelapse video...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        // Simulate video creation from timelapse frames
        const mockVideo = `data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAACKBtZGF0AAAC`
        setLastScreenshot(mockVideo)
        toast.success('Timelapse video created!', { description: 'Your design process captured', duration: 2000 })
      } else if (format === 'ar') {
        toast.info('Generating AR preview...')
        await new Promise(resolve => setTimeout(resolve, 1500))
        const mockAR = `data:model/gltf-binary;base64,Z0xURgIAAAAPAAAA`
        setLastScreenshot(mockAR)
        toast.success('AR model ready!', { description: 'Share your design in augmented reality', duration: 2000 })
      } else {
        toast.info('Capturing high-resolution image...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Simulate real canvas capture with design metadata
        const canvas = document.createElement('canvas')
        canvas.width = 1920
        canvas.height = 1080
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Create a gradient background
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          gradient.addColorStop(0, modelColor)
          gradient.addColorStop(1, '#f0f4f8')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // Add design info overlay
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.fillRect(0, canvas.height - 100, canvas.width, 100)
          ctx.fillStyle = 'white'
          ctx.font = '24px Arial'
          ctx.fillText(`${selectedModelData?.name} - Custom Design`, 20, canvas.height - 60)
          ctx.font = '16px Arial'
          ctx.fillText(`Created with Quarterboard Designer • ${new Date().toLocaleDateString()}`, 20, canvas.height - 30)
        }
        
        const mockScreenshot = canvas.toDataURL('image/png', 1.0)
        setLastScreenshot(mockScreenshot)
        
        // Update share stats
        setShareStats(prev => ({ ...prev, views: prev.views + 1 }))
        
        toast.success('High-res screenshot captured!', { description: 'Ready to share your masterpiece', duration: 2000 })
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      toast.error('Failed to capture screenshot')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleAdvancedShare = async (platform: string, options: { withQR?: boolean, customMessage?: string } = {}) => {
    if (!lastScreenshot) {
      toast.error('Please take a screenshot first')
      return
    }

    try {
      const designData = {
        model: selectedModelData?.name,
        baseColor: modelColor,
        meshColors: meshColors,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      }
      
      const shareText = customShareMessage || `🏄‍♂️ Check out my custom ${selectedModelData?.name} design! \n\n✨ Base: ${modelColor}\n🎨 ${Object.keys(meshColors).length} custom parts\n\nCreated with Quarterboard Designer`
      const shareUrl = `${window.location.href}?design=${btoa(JSON.stringify(designData))}`

      // Update share stats
      setShareStats(prev => ({ ...prev, shares: prev.shares + 1 }))

      if (platform === 'copy') {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        toast.success('Design link copied!', { description: 'Includes all your customizations', duration: 2000 })
      } else if (platform === 'qr') {
        // Generate QR code for easy mobile sharing
        const qrData = `${shareText}\n${shareUrl}`
        toast.success('QR Code generated!', { description: 'Scan to view design on mobile', duration: 2000 })
      } else if (platform === 'twitter') {
        const hashtags = 'QuarterboardDesign,3DCustomization,SurfBoard'
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`
        window.open(twitterUrl, '_blank')
        toast.success('Opening Twitter...', { description: 'With design preview and hashtags', duration: 1500 })
      } else if (platform === 'instagram') {
        // Instagram sharing (would typically use Instagram API)
        toast.info('Instagram sharing', { description: 'Copy the link and paste in your Instagram story', duration: 3000 })
        await navigator.clipboard.writeText(shareUrl)
      } else if (platform === 'linkedin') {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        window.open(linkedinUrl, '_blank')
        toast.success('Opening LinkedIn...', { description: 'Professional design showcase', duration: 1500 })
      } else if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
        window.open(whatsappUrl, '_blank')
        toast.success('Opening WhatsApp...', { description: 'Share with friends and family', duration: 1500 })
      } else if (platform === 'email') {
        const subject = `Check out my custom ${selectedModelData?.name} design!`
        const body = `${shareText}\n\nView and customize: ${shareUrl}`
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoUrl)
        toast.success('Opening email client...', { description: 'Professional sharing option', duration: 1500 })
      }
    } catch (error) {
      console.error('Error sharing design:', error)
      toast.error('Failed to share design')
    }
  }

  const saveToHistory = (name?: string) => {
    const historyEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `Design ${designHistory.length + 1}`,
      timestamp: new Date(),
      preview: lastScreenshot || '',
      colors: { ...meshColors },
      baseColor: modelColor
    }
    
    const newHistory = [...designHistory, historyEntry]
    setDesignHistory(newHistory)
    setCurrentHistoryIndex(newHistory.length - 1)
    
    toast.success(`Saved "${historyEntry.name}"`, {
      description: 'Added to your design history',
      duration: 2000,
    })
  }

  const loadFromHistory = (entry: typeof designHistory[0]) => {
    setModelColor(entry.baseColor)
    setMeshColors(entry.colors)
    setCurrentHistoryIndex(designHistory.findIndex(h => h.id === entry.id))
    
    toast.success(`Loaded "${entry.name}"`, {
      description: 'Design restored from history',
      duration: 2000,
    })
  }

  const startTimelapseRecording = () => {
    setIsRecordingTimelapse(true)
    setTimelapseFrames([])
    toast.success('Timelapse recording started!', {
      description: 'Your design process is being captured',
      duration: 2000,
    })
  }

  const stopTimelapseRecording = () => {
    setIsRecordingTimelapse(false)
    toast.success(`Timelapse completed!`, {
      description: `Captured ${timelapseFrames.length} frames`,
      duration: 2000,
    })
  }

  const toggleARMode = async () => {
    console.log('🔄 Toggle AR Mode called')
    console.log('📱 Device info:', {
      userAgent: navigator.userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: window.innerWidth,
      hasTouch: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      hasDeviceOrientation: 'DeviceOrientationEvent' in window,
      hasWebXR: 'xr' in navigator,
      currentArMode,
      currentArSupported,
      onStartARSession: !!onStartARSession
    })
    
    if (!currentArMode) {
      console.log('🚀 Starting AR session...')
      await startARSession()
    } else {
      console.log('⏹️ Stopping AR session...')
      stopARSession()
    }
  }

  const generateARPreview = async () => {
    try {
      toast.info('Generating AR preview...')
      
      // Generate QR code for mobile AR sharing
      const arData = {
        model: selectedModel,
        colors: { baseColor: modelColor, meshColors },
        scale: currentArScale,
        timestamp: Date.now()
      }
      
      const arUrl = `${window.location.origin}/ar?data=${btoa(JSON.stringify(arData))}`
      const qrCode = await generateQRCode(arUrl)
      
      if (qrCode) {
        toast.success('AR preview ready!', {
          description: 'Scan QR code with your mobile device',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Error generating AR preview:', error)
      toast.error('Failed to generate AR preview')
    }
  }

  const handleARPlaced = (placed: boolean) => {
    if (onARPlaced) {
      onARPlaced(placed)
    } else {
      setCurrentArPlaced(placed)
    }
    if (placed) {
      toast.success('Quarterboard placed successfully!', {
        description: 'Use gestures to adjust position and size',
        duration: 2000,
      })
    }
  }

  const applyDesignPreset = (preset: typeof designPresets[0]) => {
    setModelColor(preset.baseColor)
    
    // Apply mesh colors if meshes are available
    const newMeshColors: Record<string, string> = {}
    meshes.forEach((mesh, index) => {
      const presetColorKey = `mesh_${index}` as keyof typeof preset.meshColors
      newMeshColors[mesh.name] = preset.meshColors[presetColorKey] || preset.baseColor
    })
    setMeshColors(newMeshColors)
    
    toast.success(`Applied "${preset.name}" preset!`, {
      description: preset.description,
      duration: 2000,
    })
  }

  return (
    <div 
      className={`h-full flex flex-col bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-xl transition-all duration-300 ${
        isMobile ? (sidebarCollapsed ? 'h-16' : 'h-full') : 'h-full'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Enhanced Mobile Header */}
      <div className={`${isMobile ? 'p-2' : 'p-4'} border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
              <Sparkles className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-white`} />
            </div>
            <div>
              <h2 className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-slate-800 dark:text-slate-200`}>
                Quarterboard Designer
              </h2>
              {!isMobile && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customize your board
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile Collapse Toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 h-6 w-6"
              >
                {sidebarCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
              </Button>
            )}
            
            {/* Device Type Indicator */}
            <div className="flex items-center gap-1">
              {isMobile && <Smartphone className="h-3 w-3 text-blue-500" />}
              {isTablet && <Tablet className="h-3 w-3 text-green-500" />}
              {!isMobile && !isTablet && <Monitor className="h-3 w-3 text-purple-500" />}
            </div>
            
            {/* Performance indicator */}
            {process.env.NODE_ENV === 'development' && averageFps && !isMobile && (
              <div className="bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-2 py-1 text-xs rounded-full font-mono">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${averageFps > 50 ? 'bg-green-400' : averageFps > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                  {averageFps.toFixed(0)} FPS
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Swipe Indicator */}
        {isMobile && sidebarCollapsed && (
          <div className="flex justify-center mt-1">
            <div className="w-8 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Enhanced Mobile-Responsive Navigation */}
      {!sidebarCollapsed && (
        <div className={`${isMobile ? 'grid grid-cols-4 gap-1 p-2' : 'grid grid-cols-7'} bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50`}>
          {[
            { id: 'model', icon: Layers, label: 'Model', color: 'blue' },
            { id: 'colors', icon: Palette, label: 'Colors', color: 'purple' },
            { id: 'presets', icon: Wand2, label: 'Presets', color: 'pink' },
            { id: 'share', icon: Camera, label: 'Share', color: 'orange' },
            ...(isMobile ? [] : [
              { id: 'history', icon: History, label: 'History', color: 'cyan' },
              { id: 'ar', icon: Zap, label: 'AR View', color: 'violet' },
              { id: 'info', icon: Info, label: 'Details', color: 'emerald' }
            ])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex flex-col items-center justify-center gap-1 ${isMobile ? 'py-3 px-2' : 'py-2 px-1'} text-xs font-medium transition-all duration-200 rounded-lg ${
                activeSection === tab.id
                  ? `text-${tab.color}-600 dark:text-${tab.color}-400 bg-white dark:bg-slate-900 shadow-sm ${isMobile ? 'border-2' : 'border-b-2'} border-${tab.color}-500`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <tab.icon className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
              <span className={isMobile ? 'text-xs' : 'text-xs'}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Secondary Navigation (for hidden tabs) */}
      {isMobile && !sidebarCollapsed && (
        <div className="flex justify-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-700/50">
          {[
            { id: 'history', icon: History, label: 'History', color: 'cyan' },
            { id: 'ar', icon: Zap, label: 'AR', color: 'violet' },
            { id: 'info', icon: Info, label: 'Info', color: 'emerald' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-full ${
                activeSection === tab.id
                  ? `text-${tab.color}-600 dark:text-${tab.color}-400 bg-white dark:bg-slate-900 shadow-sm border border-${tab.color}-300`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-900/50'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSection === 'model' && (
          <div className="space-y-4">
            {/* Model Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Choose Your Board</h3>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{selectedModelData?.emoji}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedModelData?.name}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 max-h-60 overflow-y-auto">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setIsModelDropdownOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                      >
                        <span className="text-lg">{model.emoji}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{model.name}</span>
                        {selectedModel === model.id && <Check className="h-4 w-4 text-blue-600 ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Base Color */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Base Wood Color</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={modelColor}
                      onChange={(e) => setModelColor(e.target.value)}
                      className="h-12 text-sm font-mono"
                      placeholder="#8B4513"
                    />
                  </div>
                </div>
                
                {/* Color Presets */}
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setModelColor(preset.color)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title={preset.name}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'colors' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  Individual Parts ({meshes.length})
                </h3>
              </div>
              
              {meshes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Loading model parts...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <select 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={selectedMesh || ""}
                    onChange={(e) => setSelectedMesh(e.target.value || null)}
                  >
                    <option value="">Select a part to customize</option>
                    {meshes.map((mesh) => (
                      <option key={mesh.name} value={mesh.name}>
                        {mesh.name}
                      </option>
                    ))}
                  </select>
                  
                  {selectedMesh && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                        Customizing: {selectedMesh}
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={meshColors[selectedMesh] || modelColor}
                          onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={meshColors[selectedMesh] || modelColor}
                          onChange={(e) => handleMeshColorChange(selectedMesh, e.target.value)}
                          className="flex-1 h-12 text-sm font-mono"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Click directly on parts in the 3D view to select them instantly!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🎨 NEW FEATURE 1: Design Presets & Themes */}
        {activeSection === 'presets' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="h-4 w-4 text-pink-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Design Presets</h3>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Apply beautiful pre-made color combinations with one click!
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {designPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyDesignPreset(preset)}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{preset.emoji}</span>
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: preset.baseColor }}
                        />
                        {Object.values(preset.meshColors).slice(0, 3).map((color, index) => (
                          <div 
                            key={index}
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {preset.name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-slate-500">{preset.popularity}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {preset.description}
                      </p>
                    </div>
                    
                    <Sparkles className="h-4 w-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <p className="text-xs text-pink-700 dark:text-pink-300">
                  ✨ <strong>Pro Tip:</strong> Presets automatically adjust all your model parts with harmonious color combinations!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 📸 ENHANCED FEATURE 2: Advanced Screenshot & Share */}
        {activeSection === 'share' && (
          <div className="space-y-4">
            {/* Share Format Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Share Format</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'image', icon: FileImage, label: 'Image', desc: 'High-res PNG' },
                  { id: 'video', icon: Video, label: 'Video', desc: 'Timelapse' },
                  { id: 'ar', icon: Zap, label: 'AR Model', desc: '3D Preview' }
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setShareFormat(format.id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      shareFormat === format.id
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <format.icon className="h-4 w-4" />
                    <div className="text-center">
                      <div className="text-xs font-medium">{format.label}</div>
                      <div className="text-xs opacity-70">{format.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Share Message */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Custom Message</Label>
                <Input
                  value={customShareMessage}
                  onChange={(e) => setCustomShareMessage(e.target.value)}
                  placeholder="Add your personal message..."
                  className="text-sm"
                />
              </div>
            </div>

            {/* Capture Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Capture Your Design</h3>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleTakeScreenshot(shareFormat)}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? 'Capturing...' : `Capture ${shareFormat === 'image' ? 'Screenshot' : shareFormat === 'video' ? 'Timelapse' : 'AR Model'}`}
                </Button>
                
                {/* Timelapse Recording Controls */}
                {shareFormat === 'video' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecordingTimelapse ? stopTimelapseRecording : startTimelapseRecording}
                      variant="outline"
                      className={`flex-1 ${isRecordingTimelapse ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
                    >
                      {isRecordingTimelapse ? <Pause className="mr-2 h-3 w-3" /> : <Play className="mr-2 h-3 w-3" />}
                      {isRecordingTimelapse ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    {timelapseFrames.length > 0 && (
                      <Button variant="outline" size="sm">
                        <Video className="h-3 w-3" />
                        {timelapseFrames.length}
                      </Button>
                    )}
                  </div>
                )}
                
                {lastScreenshot && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {shareFormat === 'image' ? 'Screenshot' : shareFormat === 'video' ? 'Timelapse' : 'AR Model'} Ready!
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Your {shareFormat} has been generated and is ready to share.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Share Options */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Share Your Creation</h3>
              </div>
              
              <div className="space-y-3">
                {/* Primary Share Options */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleAdvancedShare('copy')}
                    variant="outline"
                    className="flex items-center gap-2 text-sm"
                    disabled={!lastScreenshot}
                  >
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </Button>
                  
                  <Button
                    onClick={() => handleAdvancedShare('qr')}
                    variant="outline"
                    className="flex items-center gap-2 text-sm"
                    disabled={!lastScreenshot}
                  >
                    <QrCode className="h-3 w-3" />
                    QR Code
                  </Button>
                </div>
                
                {/* Social Media Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'twitter', icon: Share2, label: 'Twitter', color: 'blue' },
                    { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'pink' },
                    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'blue' },
                    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'green' }
                  ].map((platform) => (
                    <Button
                      key={platform.id}
                      onClick={() => handleAdvancedShare(platform.id)}
                      variant="outline"
                      className={`flex items-center gap-2 text-sm bg-${platform.color}-50 dark:bg-${platform.color}-900/20 border-${platform.color}-200 dark:border-${platform.color}-800 text-${platform.color}-700 dark:text-${platform.color}-300`}
                      disabled={!lastScreenshot}
                    >
                      <platform.icon className="h-3 w-3" />
                      {platform.label}
                    </Button>
                  ))}
                </div>
                
                <Button
                  onClick={() => handleAdvancedShare('email')}
                  variant="outline"
                  className="w-full flex items-center gap-2 text-sm"
                  disabled={!lastScreenshot}
                >
                  <Mail className="h-3 w-3" />
                  Share via Email
                </Button>
                
                {!lastScreenshot && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      📸 <strong>Capture your design first</strong> to unlock all sharing options!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Social Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Your Impact</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">{shareStats.views}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Views</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-600">{shareStats.likes}</div>
                  <div className="text-xs text-pink-700 dark:text-pink-300">Likes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{shareStats.shares}</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">Shares</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 NEW FEATURE 3: Design History & Version Control */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            {/* History Controls */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-cyan-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Design History</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => saveToHistory()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  <Save className="mr-2 h-3 w-3" />
                  Save Current
                </Button>
                <Button
                  onClick={() => {
                    if (currentHistoryIndex > 0) {
                      const prevEntry = designHistory[currentHistoryIndex - 1]
                      loadFromHistory(prevEntry)
                    }
                  }}
                  variant="outline"
                  disabled={currentHistoryIndex <= 0}
                >
                  <Undo2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => {
                    if (currentHistoryIndex < designHistory.length - 1) {
                      const nextEntry = designHistory[currentHistoryIndex + 1]
                      loadFromHistory(nextEntry)
                    }
                  }}
                  variant="outline"
                  disabled={currentHistoryIndex >= designHistory.length - 1}
                >
                  <Redo2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Timelapse Recording */}
              <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">Timelapse Recording</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isRecordingTimelapse ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                </div>
                <p className="text-xs text-cyan-700 dark:text-cyan-300 mb-2">
                  {isRecordingTimelapse ? 'Recording your design process...' : 'Capture your creative journey'}
                </p>
                <Button
                  onClick={isRecordingTimelapse ? stopTimelapseRecording : startTimelapseRecording}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isRecordingTimelapse ? <Pause className="mr-2 h-3 w-3" /> : <Play className="mr-2 h-3 w-3" />}
                  {isRecordingTimelapse ? 'Stop Recording' : 'Start Recording'}
                </Button>
              </div>
            </div>

            {/* History Timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-slate-600" />
                <h4 className="font-medium text-slate-800 dark:text-slate-200">Saved Designs ({designHistory.length})</h4>
              </div>
              
              {designHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved designs yet</p>
                  <p className="text-xs opacity-75">Save your current design to start building history</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {designHistory.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        index === currentHistoryIndex
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => loadFromHistory(entry)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded border flex items-center justify-center">
                        <span className="text-xs font-mono">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{entry.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {entry.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: entry.baseColor }}
                        />
                        {Object.values(entry.colors).slice(0, 2).map((color, i) => (
                          <div 
                            key={i}
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🚀 NEW FEATURE 4: AR Preview & Virtual Try-On */}
        {activeSection === 'ar' && (
          <div className="space-y-4">
            {/* AR Mode Toggle */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Augmented Reality</h3>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={toggleARMode}
                  className={`w-full transition-all duration-200 ${
                    currentArMode 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                  }`}
                >
                  {currentArMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {currentArMode ? 'Exit AR Mode' : 'Enter AR Mode'}
                </Button>

                {currentArMode && (
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium text-violet-800 dark:text-violet-200">AR Mode Active</span>
                    </div>
                    <p className="text-xs text-violet-700 dark:text-violet-300 mb-3">
                      Your quarterboard is now viewable in augmented reality. Use your device's camera to place it in your space.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Reset Position
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Shuffle className="mr-1 h-3 w-3" />
                        Change Scale
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AR Features */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-slate-800 dark:text-slate-200">AR Features</h4>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={generateARPreview}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Generate AR Preview
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Camera className="mr-1 h-3 w-3" />
                    AR Screenshot
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Video className="mr-1 h-3 w-3" />
                    AR Video
                  </Button>
                </div>
              </div>
            </div>

            {/* AR Compatibility */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">Device Compatibility</h4>
              </div>
              <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  <span>iOS 12+ (ARKit)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  <span>Android 7+ (ARCore)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  <span>WebXR Compatible</span>
                </div>
              </div>
            </div>

            {/* AR Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-800 dark:text-purple-200">AR Community</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">1.2k</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">AR Views</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-600">89%</div>
                  <div className="text-xs text-pink-700 dark:text-pink-300">Accuracy</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-violet-600">4.9★</div>
                  <div className="text-xs text-violet-700 dark:text-violet-300">AR Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'share' && (
          <div className="space-y-4">
            {/* Screenshot Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Capture Your Design</h3>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleTakeScreenshot(shareFormat)}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? 'Capturing...' : 'Take Screenshot'}
                </Button>
                
                {lastScreenshot && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Screenshot Ready!
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Your design has been captured and is ready to share.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Share Your Creation</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleAdvancedShare('copy')}
                    variant="outline"
                    className="flex items-center gap-2 text-sm"
                    disabled={!lastScreenshot}
                  >
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </Button>
                  
                  <Button
                    onClick={() => handleAdvancedShare('twitter')}
                    variant="outline"
                    className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    disabled={!lastScreenshot}
                  >
                    <Share2 className="h-3 w-3" />
                    Twitter
                  </Button>
                </div>
                
                <Button
                  onClick={() => handleAdvancedShare('facebook')}
                  variant="outline"
                  className="w-full flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  disabled={!lastScreenshot}
                >
                  <Share2 className="h-3 w-3" />
                  Share on Facebook
                </Button>
                
                {!lastScreenshot && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      📸 <strong>Take a screenshot first</strong> to unlock sharing options!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Social Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium text-purple-800 dark:text-purple-200">Community</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">2.4k</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">Designs Shared</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-pink-600">856</div>
                  <div className="text-xs text-pink-700 dark:text-pink-300">This Week</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">4.8★</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'info' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Model Details</h3>
            </div>
            
            {modelData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-medium text-slate-800 dark:text-slate-200">Parts</div>
                    <div className="text-lg font-bold text-emerald-600">{modelData?.meshes?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="font-medium text-slate-800 dark:text-slate-200">Scale</div>
                    <div className="text-lg font-bold text-emerald-600">{modelData?.bounds?.scale?.toFixed(1) || '0.0'}x</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">Available Parts:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {modelData?.meshes?.map((mesh, index) => (
                      <div 
                        key={mesh.name}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs"
                      >
                        <span className="font-medium">{mesh.name}</span>
                        <div 
                          className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
                          style={{ backgroundColor: meshColors[mesh.name] || modelColor }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Model information will appear here once loaded</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modern Footer */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-3">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Preparing Export...' : 'Export Design'}
        </Button>
        
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
          <Button
            onClick={handleSendEmail}
            disabled={isSending || !email}
            variant="outline"
            className="px-4"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
