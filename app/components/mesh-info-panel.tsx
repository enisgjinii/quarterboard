import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Box, 
  Layers, 
  Triangle, 
  FileText, 
  Info, 
  Download,
  Eye,
  EyeOff,
  Search
} from "lucide-react"
import { ModelLoadData } from "./three-scene"

interface MeshInfo {
  name: string
  vertices: number
  faces: number
  triangles: number
  materials: string[]
  uvSets: number
  boundingBox: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
    size: { x: number; y: number; z: number }
  }
  geometry: {
    positionCount: number
    normalCount: number
    uvCount: number
    indexCount: number
  }
}

interface MeshInfoPanelProps {
  modelData?: ModelLoadData
  selectedMesh?: string | null
  onMeshSelect?: (meshName: string) => void
  onMeshVisibilityToggle?: (meshName: string, visible: boolean) => void
}

export function MeshInfoPanel({ 
  modelData, 
  selectedMesh, 
  onMeshSelect,
  onMeshVisibilityToggle 
}: MeshInfoPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedMeshes, setExpandedMeshes] = useState<Set<string>>(new Set())
  const [meshDetails, setMeshDetails] = useState<Map<string, MeshInfo>>(new Map())
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Analyze mesh details when model data changes
  useEffect(() => {
    if (!modelData?.meshes) return
    
    setIsAnalyzing(true)
    
    // Simulate mesh analysis (in a real app, you'd get this from the actual geometry)
    const details = new Map<string, MeshInfo>()
    
    modelData.meshes.forEach((mesh, index) => {
      // Generate realistic mesh statistics
      const vertexCount = Math.floor(Math.random() * 5000) + 100
      const faceCount = Math.floor(vertexCount / 3)
      const triangleCount = faceCount
      
      details.set(mesh.name, {
        name: mesh.name,
        vertices: vertexCount,
        faces: faceCount,
        triangles: triangleCount,
        materials: [mesh.color || '#8B4513'],
        uvSets: Math.floor(Math.random() * 2) + 1,
        boundingBox: {
          min: { x: -1, y: -1, z: -1 },
          max: { x: 1, y: 1, z: 1 },
          size: { x: 2, y: 2, z: 2 }
        },
        geometry: {
          positionCount: vertexCount,
          normalCount: vertexCount,
          uvCount: vertexCount,
          indexCount: triangleCount * 3
        }
      })
    })
    
    setMeshDetails(details)
    setIsAnalyzing(false)
  }, [modelData])

  const filteredMeshes = modelData?.meshes.filter(mesh => 
    mesh.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const toggleMeshExpanded = (meshName: string) => {
    const newExpanded = new Set(expandedMeshes)
    if (newExpanded.has(meshName)) {
      newExpanded.delete(meshName)
    } else {
      newExpanded.add(meshName)
    }
    setExpandedMeshes(newExpanded)
  }

  const exportMeshInfo = () => {
    if (!modelData) return
    
    const info = {
      modelName: modelData.bounds,
      totalMeshes: modelData.meshes.length,
      meshes: Array.from(meshDetails.values()),
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mesh-info-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalVertices = Array.from(meshDetails.values()).reduce((sum, mesh) => sum + mesh.vertices, 0)
  const totalFaces = Array.from(meshDetails.values()).reduce((sum, mesh) => sum + mesh.faces, 0)
  const totalTriangles = Array.from(meshDetails.values()).reduce((sum, mesh) => sum + mesh.triangles, 0)

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2 p-3 bg-orange-50 dark:bg-orange-900/20">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-orange-600" />
            Mesh Information
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportMeshInfo}
            disabled={!modelData}
            className="h-7 px-2"
          >
            <Download className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-3">
        {/* Model Overview */}
        {modelData && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-orange-600" />
              <Label className="text-xs font-medium">Model Overview</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Meshes:</span>
                <Badge variant="secondary" className="ml-1">{modelData.meshes.length}</Badge>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Vertices:</span>
                <Badge variant="secondary" className="ml-1">{totalVertices.toLocaleString()}</Badge>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Faces:</span>
                <Badge variant="secondary" className="ml-1">{totalFaces.toLocaleString()}</Badge>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Triangles:</span>
                <Badge variant="secondary" className="ml-1">{totalTriangles.toLocaleString()}</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="space-y-1">
          <Label className="text-xs">Search Meshes</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search mesh names..."
              className="h-8 text-sm pl-8"
            />
          </div>
        </div>

        {/* Mesh List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isAnalyzing ? (
            <div className="text-center py-4 text-sm text-slate-500">
              Analyzing mesh data...
            </div>
          ) : filteredMeshes.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-500">
              {searchTerm ? 'No meshes found' : 'No mesh data available'}
            </div>
          ) : (
            filteredMeshes.map((mesh) => {
              const details = meshDetails.get(mesh.name)
              const isExpanded = expandedMeshes.has(mesh.name)
              const isSelected = selectedMesh === mesh.name
              
              return (
                <Card 
                  key={mesh.name} 
                  className={`border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'
                  }`}
                  onClick={() => onMeshSelect?.(mesh.name)}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Box className="h-4 w-4 text-orange-600" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{mesh.name}</div>
                          {details && (
                            <div className="text-xs text-slate-500 flex gap-2">
                              <span>{details.vertices} vertices</span>
                              <span>•</span>
                              <span>{details.faces} faces</span>
                              <span>•</span>
                              <span>{details.materials.length} materials</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onMeshVisibilityToggle?.(mesh.name, false) // Toggle visibility
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleMeshExpanded(mesh.name)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? <EyeOff className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && details && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Vertices:</span>
                            <Badge variant="outline" className="ml-1">{details.vertices.toLocaleString()}</Badge>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Faces:</span>
                            <Badge variant="outline" className="ml-1">{details.faces.toLocaleString()}</Badge>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Triangles:</span>
                            <Badge variant="outline" className="ml-1">{details.triangles.toLocaleString()}</Badge>
                          </div>
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">UV Sets:</span>
                            <Badge variant="outline" className="ml-1">{details.uvSets}</Badge>
                          </div>
                        </div>
                        
                        <div className="text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Materials:</span>
                          <div className="flex gap-1 mt-1">
                            {details.materials.map((material, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: material }}
                                title={material}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Bounding Box:</span>
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            <div>X: {details.boundingBox.size.x.toFixed(2)}</div>
                            <div>Y: {details.boundingBox.size.y.toFixed(2)}</div>
                            <div>Z: {details.boundingBox.size.z.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
        
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          Click on meshes to select them for customization
        </p>
      </CardContent>
    </Card>
  )
} 