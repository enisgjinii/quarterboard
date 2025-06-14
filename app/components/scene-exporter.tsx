"use client"

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import emailjs from 'emailjs-com'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

interface SceneExporterProps {
  onExport?: (data: any) => void
  scene: THREE.Scene
  gl: THREE.WebGLRenderer
}

export function SceneExporterContent({ onExport }: Partial<SceneExporterProps>) {
  const { scene, gl } = useThree();
  return <SceneExporter scene={scene} gl={gl} onExport={onExport} />;
}

export function SceneExporter({ onExport, scene, gl }: SceneExporterProps) {
  const [email, setEmail] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [models] = useState<string[]>([
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
  ])
  const [selectedModel, setSelectedModel] = useState<string>('')

  const captureScene = async () => {
    setIsExporting(true)
    try {
      // Capture the current view as an image
      const screenshot = gl.domElement.toDataURL('image/png')
      
      // Get scene data
      const sceneData = {
        objects: [],
        materials: [],
        textures: []
      }

      // Traverse scene and collect data
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const geometry = object.geometry
          const material = object.material

          // Collect geometry data
          const geometryData = {
            type: geometry.type,
            attributes: {
              position: geometry.attributes.position?.array,
              normal: geometry.attributes.normal?.array,
              uv: geometry.attributes.uv?.array
            },
            index: geometry.index?.array
          }

          // Collect material data
          const materialData = Array.isArray(material) 
            ? material.map(m => ({
                type: m.type,
                color: m.color?.getHexString(),
                metalness: m.metalness,
                roughness: m.roughness,
                map: m.map?.source?.data?.src
              }))
            : [{
                type: material.type,
                color: material.color?.getHexString(),
                metalness: material.metalness,
                roughness: material.roughness,
                map: material.map?.source?.data?.src
              }]

          sceneData.objects.push({
            name: object.name,
            type: object.type,
            position: object.position.toArray(),
            rotation: object.rotation.toArray(),
            scale: object.scale.toArray(),
            geometry: geometryData,
            material: materialData
          })
        }
      })

      const exportData = {
        screenshot,
        sceneData,
        timestamp: new Date().toISOString()
      }

      onExport?.(exportData)
      return exportData
    } catch (error) {
      console.error('Error capturing scene:', error)
      toast.error('Failed to capture scene')
      return null
    } finally {
      setIsExporting(false)
    }
  }

  const sendEmail = async (data: any) => {
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    setIsSending(true)
    try {
      // Replace these with your actual EmailJS credentials
      const templateParams = {
        to_email: email,
        scene_data: JSON.stringify(data.sceneData),
        screenshot: data.screenshot,
        timestamp: data.timestamp
      }

      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        templateParams,
        'YOUR_USER_ID'
      )

      toast.success('Scene data sent successfully')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const handleExport = async () => {
    const data = await captureScene()
    if (data) {
      if (email) {
        await sendEmail(data)
      } else {
        // Download the data as a JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `scene-export-${new Date().toISOString()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }
  }

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value)
  }

  return (
    <Html style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
      <div className="space-y-4 p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email to receive scene data"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model-select">Select a Model</Label>
          {/* Dropdown menu for selecting models */}
          <select
            id="model-select"
            value={selectedModel}
            onChange={handleModelChange}
            title="Select a model"
            className="w-full p-2 border rounded bg-background"
          >
            <option value="" disabled>Select a model</option>
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || isSending}
          className="w-full"
        >
          {isExporting ? 'Capturing Scene...' : isSending ? 'Sending Email...' : 'Export Scene'}
        </Button>
      </div>
    </Html>
  )
}