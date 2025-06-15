"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { preloadFonts } from "@/lib/font-converter";
import { FontInfoTooltip } from "./font-info-tooltip";

interface FontPreviewerProps {
  fonts: string[];
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  previewText?: string;
}

export function FontPreviewer({
  fonts,
  selectedFont,
  setSelectedFont,
  previewText = "Sample Text"
}: FontPreviewerProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Preload all fonts for faster previewing

  // Load fonts when component mounts
  useEffect(() => {
    const loadAllFonts = async () => {
      try {
        setError(null);
        const loadedFonts = await preloadFonts(fonts);
        
        // Check if we have at least one valid font
        if (Object.keys(loadedFonts).length > 0) {
          setFontsLoaded(true);
          
          // If the currently selected font failed to load, switch to default
          if (!loadedFonts[selectedFont] && loadedFonts['helvetiker_regular.typeface.json']) {
            console.log('Selected font failed to load, falling back to default');
            setSelectedFont('helvetiker_regular.typeface.json');
          }
        } else {
          setError("Failed to load any fonts. Please try refreshing the page.");
        }
      } catch (error) {
        console.error("Error preloading fonts:", error);
        setError("Error loading fonts: " + (error instanceof Error ? error.message : String(error)));
      }
    };
    
    loadAllFonts();
  }, [fonts, selectedFont, setSelectedFont]);

  const getFontDisplayName = (fontName: string) => {
    return fontName
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace('.ttf', '')
      .replace('.typeface.json', '');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="font-select" className="text-xs">Font Style</Label>
        <Select value={selectedFont} onValueChange={setSelectedFont}>
          <SelectTrigger id="font-select" className="h-8 text-sm">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>          <SelectContent>
            {fonts.map((font) => (
              <FontInfoTooltip key={font} fontName={font}>
                <SelectItem value={font} className="text-sm">
                  {getFontDisplayName(font)}
                </SelectItem>
              </FontInfoTooltip>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs">Font Preview</Label>
        <Card>
          <CardContent className="p-3 overflow-hidden">            {error ? (
              <div className="text-sm text-red-500 h-20 flex items-center justify-center">
                {error}
              </div>
            ) : fontsLoaded ? (
              <div className="grid grid-cols-1 gap-2">
                {/* Current font preview */}
                <div className="flex flex-col space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {getFontDisplayName(selectedFont)}
                  </div>
                  <div 
                    className="font-preview p-2 border rounded-md"
                    style={{
                      fontFamily: selectedFont.includes("EBGaramond") 
                        ? "'EB Garamond'" 
                        : selectedFont.includes("Copperplate") 
                          ? "Copperplate" 
                          : selectedFont.includes("Bookman") 
                            ? "Bookman Old Style"
                            : "Arial" 
                    }}
                  >
                    {previewText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground h-20 flex items-center justify-center">
                Loading font previews...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
