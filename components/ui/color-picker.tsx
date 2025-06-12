"use client"

import * as React from "react"
import { EyeDropperIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Slider } from "./slider"
import { cn } from "@/lib/utils"

interface ColorPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  background: string
  setBackground: (background: string) => void
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }).join("")
}

export function ColorPicker({
  background,
  setBackground,
  className,
  ...props
}: ColorPickerProps) {
  const [red, setRed] = React.useState(parseInt(background.slice(1, 3), 16))
  const [green, setGreen] = React.useState(parseInt(background.slice(3, 5), 16))
  const [blue, setBlue] = React.useState(parseInt(background.slice(5, 7), 16))

  React.useEffect(() => {
    setBackground(rgbToHex(red, green, blue))
  }, [red, green, blue, setBackground])

  React.useEffect(() => {
    // Update RGB values when background prop changes
    setRed(parseInt(background.slice(1, 3), 16))
    setGreen(parseInt(background.slice(3, 5), 16))
    setBlue(parseInt(background.slice(5, 7), 16))
  }, [background])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "w-12 h-9 rounded-md border border-input cursor-pointer",
            className
          )}
          style={{ background }}
          {...props}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="h-24 rounded-md border" style={{ background }} />
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Red
                </label>
                <span className="text-sm text-muted-foreground">{red}</span>
              </div>
              <Slider
                max={255}
                step={1}
                defaultValue={[red]}
                value={[red]}
                className="[&_[role=slider]]:bg-red-500"
                onValueChange={([value]) => setRed(value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Green
                </label>
                <span className="text-sm text-muted-foreground">{green}</span>
              </div>
              <Slider
                max={255}
                step={1}
                defaultValue={[green]}
                value={[green]}
                className="[&_[role=slider]]:bg-green-500"
                onValueChange={([value]) => setGreen(value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Blue
                </label>
                <span className="text-sm text-muted-foreground">{blue}</span>
              </div>
              <Slider
                max={255}
                step={1}
                defaultValue={[blue]}
                value={[blue]}
                className="[&_[role=slider]]:bg-blue-500"
                onValueChange={([value]) => setBlue(value)}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
