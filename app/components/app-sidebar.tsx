"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Type, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"

interface AppSidebarProps {
  modelColor: string
  setModelColor: (color: string) => void
  text3D: string
  setText3D: (text: string) => void
  textColor: string
  setTextColor: (color: string) => void
  textPosition: { x: number; y: number; z: number }
  setTextPosition: (position: { x: number; y: number; z: number }) => void
  textScale: { x: number; y: number; z: number }
  setTextScale: (scale: { x: number; y: number; z: number }) => void
}

export function AppSidebar({
  modelColor,
  setModelColor,
  text3D,
  setText3D,
  textColor,
  setTextColor,
  textPosition,
  setTextPosition,
  textScale,
  setTextScale
}: AppSidebarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Type className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">3D Editor</h1>
            <p className="text-xs text-muted-foreground">Model Customization</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modelColor">Model Color</Label>
                <Input
                  id="modelColor"
                  type="color"
                  value={modelColor}
                  onChange={(e) => setModelColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Text Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Input
                  id="text"
                  value={text3D}
                  onChange={(e) => setText3D(e.target.value)}
                  placeholder="Enter text..."
                  className="font-sans"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <Input
                  id="textColor"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>

              <div className="space-y-2">
                <Label>Text Position</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="textX">X</Label>
                    <Input
                      id="textX"
                      type="number"
                      value={textPosition.x}
                      onChange={(e) => setTextPosition({ ...textPosition, x: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textY">Y</Label>
                    <Input
                      id="textY"
                      type="number"
                      value={textPosition.y}
                      onChange={(e) => setTextPosition({ ...textPosition, y: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textZ">Z</Label>
                    <Input
                      id="textZ"
                      type="number"
                      value={textPosition.z}
                      onChange={(e) => setTextPosition({ ...textPosition, z: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Text Scale</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scaleX">X</Label>
                    <Input
                      id="scaleX"
                      type="number"
                      value={textScale.x}
                      onChange={(e) => setTextScale({ ...textScale, x: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scaleY">Y</Label>
                    <Input
                      id="scaleY"
                      type="number"
                      value={textScale.y}
                      onChange={(e) => setTextScale({ ...textScale, y: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scaleZ">Z</Label>
                    <Input
                      id="scaleZ"
                      type="number"
                      value={textScale.z}
                      onChange={(e) => setTextScale({ ...textScale, z: parseFloat(e.target.value) })}
                      step={0.1}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
