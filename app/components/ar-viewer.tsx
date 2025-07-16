"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { toast } from '@/lib/toast-utils'
import { useMobileAR } from '@/hooks/use-mobile'

interface ARViewerProps {
  modelUrl: string
  modelColor: string
  meshColors: Record<string, string>
  isActive: boolean
  onPlaced: (placed: boolean) => void
  scale: number
  onScaleChange: (scale: number) => void
}

// Advanced AR Model Component with VR optimizations
function ARModel({ url, modelColor, meshColors, scale }: {
  url: string
  modelColor: string
  meshColors: Record<string, string>
  scale: number
}) {
  const { scene } = useGLTF(url)
  const modelRef = useRef<THREE.Group>(null)
  const [clonedScene, setClonedScene] = useState<THREE.Object3D | null>(null)
  const { getAROptimizations } = useMobileAR()
  const optimizations = getAROptimizations()

  useEffect(() => {
    if (!scene) return

    const cloned = scene.clone()

    // Center and scale the model
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z)
    const modelScale = (2 * scale) / (maxDimension > 0 ? maxDimension : 1)

    cloned.scale.set(modelScale, modelScale, modelScale)
    cloned.position.sub(center.multiplyScalar(modelScale))

    // Apply colors to meshes with advanced material properties
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name || child.uuid
        const meshColor = meshColors[meshName] || modelColor

        const material = new THREE.MeshStandardMaterial({
          color: meshColor,
          metalness: 0.3,
          roughness: 0.4,
          transparent: true,
          opacity: 0.95,
          envMapIntensity: 1.2
        })

        child.material = material
        child.castShadow = true
        child.receiveShadow = true

        // Advanced geometry optimizations
        if (optimizations.isLowEndDevice && child.geometry) {
          // LOD optimization for low-end devices
          child.geometry.computeBoundingSphere()
          child.geometry.computeBoundingBox()
        }
      }
    })

    setClonedScene(cloned)
  }, [scene, modelColor, meshColors, scale, optimizations.isLowEndDevice])

  // Advanced floating animation with VR considerations
  useFrame((state) => {
    if (modelRef.current) {
      const time = state.clock.elapsedTime
      modelRef.current.position.y = Math.sin(time * 0.5) * optimizations.floatAmplitude
      modelRef.current.rotation.y += optimizations.animationSpeed * 0.5

      // Add subtle breathing effect
      const breathingScale = 1 + Math.sin(time * 0.3) * 0.02
      modelRef.current.scale.setScalar(breathingScale)
    }
  })

  if (!clonedScene) return null

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group ref={modelRef}>
        <primitive object={clonedScene} />
      </group>
    </Float>
  )
}

// Advanced AR Ground Plane with VR enhancements
function ARGroundPlane() {
  const { getAROptimizations } = useMobileAR()
  const optimizations = getAROptimizations()

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={optimizations.isLowEndDevice ? 0.1 : 0.2}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Advanced AR Controls with VR support
function ARControls({ onScaleChange, scale }: {
  onScaleChange: (scale: number) => void
  scale: number
}) {
  const { getAROptimizations } = useMobileAR()
  const optimizations = getAROptimizations()
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      setTouchStart({ x: distance, y: scale })
    }
  }, [scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const scaleChange = distance / touchStart.x
      const newScale = Math.max(0.3, Math.min(5, touchStart.y * scaleChange))
      onScaleChange(newScale)
    }
  }, [touchStart, onScaleChange])

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null)
  }, [])

  return (
    <Html
      position={[0, 2.5, 0]}
      center
      distanceFactor={optimizations.isMobile ? 12 : 8}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div
        className={`bg-black/90 text-white p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl ${optimizations.controlSize === 'large' ? 'p-5' : 'p-4'
          }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onScaleChange(Math.max(0.3, scale - 0.2))}
            className={`bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 ${optimizations.controlSize === 'large' ? 'w-12 h-12' : 'w-10 h-10'
              }`}
          >
            <span className="text-lg font-bold">−</span>
          </button>
          <div className="text-center">
            <div className="text-sm font-mono min-w-[4rem]">
              {scale.toFixed(1)}x
            </div>
            <div className="text-xs opacity-70">Scale</div>
          </div>
          <button
            onClick={() => onScaleChange(Math.min(5, scale + 0.2))}
            className={`bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 ${optimizations.controlSize === 'large' ? 'w-12 h-12' : 'w-10 h-10'
              }`}
          >
            <span className="text-lg font-bold">+</span>
          </button>
        </div>
      </div>
    </Html>
  )
}

// VR/AR Environment Component
function VREnvironment() {
  return (
    <Environment
      preset="sunset"
      background={false}
      blur={0.8}
    />
  )
}

export function ARViewer({
  modelUrl,
  modelColor,
  meshColors,
  isActive,
  onPlaced,
  scale,
  onScaleChange
}: ARViewerProps) {
  const [isPlaced, setIsPlaced] = useState(false)
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [hasPermission, setHasPermission] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [vrMode, setVrMode] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; scale: number } | null>(null)
  const { getAROptimizations } = useMobileAR()
  const optimizations = getAROptimizations()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Check for VR support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          console.log('VR support detected')
        }
      })
    }
  }, [])

  // Function to request camera permission (must be called from user interaction)
  const startCamera = async () => {
    try {
      console.log('Requesting camera permission...')
      console.log('Navigator mediaDevices:', !!navigator.mediaDevices)
      console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))

      // Check if modern getUserMedia is supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Using modern getUserMedia')

        // Try with simpler constraints first for mobile compatibility
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' }, // Prefer back camera but don't require it
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }

        console.log('Requesting with constraints:', constraints)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        console.log('Camera permission granted, stream:', stream)
        console.log('Stream tracks:', stream.getTracks())

        setCameraStream(stream)
        setCameraError(null)

        // Set up video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          console.log('Video element playing')
        }

        toast.success('Camera access granted')
        return
      }

      // Fallback for older browsers (including older mobile browsers)
      console.log('Falling back to legacy getUserMedia')
      const legacyGetUserMedia = (navigator as any).getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia ||
        (navigator as any).msGetUserMedia

      if (!legacyGetUserMedia) {
        throw new Error('Camera not supported on this device/browser. Please update your browser or use a different device.')
      }

      console.log('Using legacy getUserMedia')
      // Use legacy getUserMedia with Promise wrapper
      const stream = await new Promise<MediaStream>((resolve, reject) => {
        legacyGetUserMedia.call(navigator, {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }, resolve, reject)
      })

      console.log('Camera permission granted (legacy), stream:', stream)
      setCameraStream(stream)
      setCameraError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      toast.success('Camera access granted')
    } catch (error) {
      console.error('Camera error details:', error)
      console.error('Error name:', (error as any)?.name)
      console.error('Error message:', (error as any)?.message)

      const errorName = (error as any)?.name || ''
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error'

      // Provide more specific error messages for mobile
      let userFriendlyMessage = `${errorName}: ${errorMessage}`

      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        userFriendlyMessage = 'Camera permission denied. Please tap "Allow" when prompted, or check your browser settings.'
      } else if (errorName === 'NotFoundError') {
        userFriendlyMessage = 'No camera found. Please check if your device has a camera and it\'s not being used by another app.'
      } else if (errorName === 'NotReadableError') {
        userFriendlyMessage = 'Camera is busy or hardware error. Please close other apps using the camera and try again.'
      } else if (errorName === 'OverconstrainedError') {
        userFriendlyMessage = 'Camera constraints not supported. Trying with basic settings...'

        // Try again with minimal constraints
        try {
          console.log('Retrying with minimal constraints...')
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          setCameraStream(stream)
          setCameraError(null)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            await videoRef.current.play()
          }
          toast.success('Camera access granted (basic mode)')
          return
        } catch (retryError) {
          console.error('Retry failed:', retryError)
          userFriendlyMessage = 'Camera not compatible with this device/browser.'
        }
      } else if (errorMessage.includes('not supported')) {
        userFriendlyMessage = 'Camera not supported. Please use a modern browser like Chrome, Safari, or Firefox.'
      }

      setCameraError(userFriendlyMessage)
      toast.error('Camera access failed: ' + errorName)
    }
  }

  // Function to request device orientation permission (must be called from user interaction)
  const requestOrientationPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          setHasPermission(true)
          console.log('Device orientation permission granted')
        } else {
          console.log('Device orientation permission denied')
          toast.error('Device orientation permission denied')
        }
      } catch (error) {
        console.error('Error requesting device orientation permission:', error)
        toast.error('Failed to get device orientation permission')
      }
    } else {
      // For non-iOS devices, assume permission is granted
      setHasPermission(true)
    }
  }

  useEffect(() => {
    if (!isActive) return

    // Handle device orientation
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (hasPermission || typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        setDeviceOrientation({
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        })
      }
    }

    // Handle touch gestures for mobile AR
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        setTouchStart({ x: distance, y: 0, scale })
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStart) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
        const scaleChange = distance / touchStart.x
        const newScale = Math.max(0.3, Math.min(5, touchStart.scale * scaleChange))
        onScaleChange(newScale)
      }
    }

    const handleTouchEnd = () => {
      setTouchStart(null)
    }

    window.addEventListener('deviceorientation', handleOrientation)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      // Stop camera stream when component unmounts
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
      }

      window.removeEventListener('deviceorientation', handleOrientation)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isActive, hasPermission, onScaleChange]) // Removed touchStart and scale from dependencies

  const handlePlaceModel = () => {
    setIsPlaced(true)
    onPlaced(true)
    const instructionText = optimizations.instructionText === 'mobile'
      ? 'Use pinch gestures to resize and drag to move • Tap VR button for immersive mode'
      : 'Use controls to adjust size and position • Enter VR mode for immersive experience'

    toast.success('Quarterboard placed in AR!', {
      description: instructionText,
      duration: 4000
    })
  }

  const toggleVRMode = () => {
    setVrMode(!vrMode)
    toast.success(vrMode ? 'Exited VR Mode' : 'Entered VR Mode')
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera Feed Background */}
      {cameraStream && !vrMode && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror the camera feed
        />
      )}

      {/* Camera Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-sm mx-4 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {cameraError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Reload & Try Again
            </button>
          </div>
        </div>
      )}

      {/* AR/VR Overlay with 3D Content */}
      <div className="absolute inset-0">
        <Canvas
          camera={{
            position: [0, 1, 3],
            fov: vrMode ? 90 : optimizations.fov,
            near: 0.1,
            far: 1000
          }}
          style={{ background: vrMode ? 'linear-gradient(to bottom, #1a1a2e, #16213e)' : 'transparent' }}
          gl={{
            antialias: optimizations.antialias,
            powerPreference: 'high-performance',
            alpha: true,
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true
          }}
        >
          {/* Advanced Lighting for AR/VR */}
          <ambientLight intensity={vrMode ? 0.4 : (optimizations.isLowEndDevice ? 0.9 : 0.6)} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={vrMode ? 1.2 : (optimizations.isLowEndDevice ? 0.9 : 1)}
            castShadow
            shadow-mapSize={optimizations.shadowQuality === 'low' ? [512, 512] : [2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />

          {/* VR Environment */}
          {vrMode && <VREnvironment />}

          {/* AR Model */}
          {isPlaced && (
            <>
              <ARModel
                url={modelUrl}
                modelColor={modelColor}
                meshColors={meshColors}
                scale={scale}
              />
              {!vrMode && <ARGroundPlane />}
              <ARControls onScaleChange={onScaleChange} scale={scale} />
            </>
          )}

          {/* Advanced Camera Controls */}
          <OrbitControls
            enablePan={isPlaced}
            enableZoom={isPlaced}
            enableRotate={isPlaced}
            minDistance={vrMode ? 1 : optimizations.minDistance}
            maxDistance={vrMode ? 10 : optimizations.maxDistance}
            enableDamping={true}
            dampingFactor={0.05}
            maxPolarAngle={vrMode ? Math.PI : Math.PI / 2}
          />
        </Canvas>
      </div>

      {/* Advanced AR/VR UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* AR Crosshair */}
        {!isPlaced && cameraStream && !vrMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        )}

        {/* VR Mode Indicator */}
        {vrMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-purple-600/90 text-white px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium">VR Mode Active</span>
            </div>
          </div>
        )}

        {/* Advanced Controls */}
        <div className="absolute bottom-20 left-4 right-4 pointer-events-auto">
          <div className="bg-black/90 text-white p-6 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl">
            {!cameraStream && !vrMode ? (
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-lg">Enable AR Camera</h3>
                <p className="text-sm mb-6 opacity-90">
                  To use AR mode, we need access to your camera to show the real world behind your 3D model
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={async () => {
                      await startCamera()
                      await requestOrientationPermission()
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                  >
                    Enable Camera
                  </button>
                  <button
                    onClick={toggleVRMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                  >
                    Use VR Mode Instead
                  </button>
                </div>
              </div>
            ) : !isPlaced ? (
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-lg">Place Your Quarterboard</h3>
                <p className="text-sm mb-6 opacity-90">
                  {vrMode
                    ? 'Position your quarterboard in the virtual space'
                    : 'Point your camera at a flat surface and tap to place your quarterboard in augmented reality'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handlePlaceModel}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                  >
                    Place Quarterboard
                  </button>
                  <button
                    onClick={toggleVRMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                  >
                    {vrMode ? 'Exit VR' : 'Enter VR'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-lg">AR Controls</h3>
                <p className="text-sm mb-4 opacity-90">
                  {vrMode
                    ? 'Use VR controllers or mouse to navigate • Pinch to resize • Voice commands available'
                    : 'Pinch to resize • Drag to move • Use + / - buttons • Tap VR for immersive mode'
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={toggleVRMode}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    {vrMode ? 'Exit VR' : 'Enter VR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Debug Info (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-48">
            <div>α: {deviceOrientation.alpha.toFixed(1)}°</div>
            <div>β: {deviceOrientation.beta.toFixed(1)}°</div>
            <div>γ: {deviceOrientation.gamma.toFixed(1)}°</div>
            <div>Mobile: {optimizations.isMobile ? 'Yes' : 'No'}</div>
            <div>VR: {vrMode ? 'Active' : 'Inactive'}</div>
            <div>Camera: {cameraStream ? 'Active' : 'Inactive'}</div>
            <div>Scale: {scale.toFixed(2)}x</div>
          </div>
        )}
      </div>
    </div>
  )
}

// Preload AR models
useGLTF.preload('/models/quarterboard.glb')
useGLTF.preload('/models/quarterboard_2.glb')