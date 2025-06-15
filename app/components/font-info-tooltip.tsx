"use client";

import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FontInfoTooltipProps {
  fontName: string;
  children: React.ReactNode;
}

export function FontInfoTooltip({ fontName, children }: FontInfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const getFontDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      "helvetiker_regular.typeface.json": "A clean, versatile sans-serif font similar to Helvetica. Great for modern, minimalist designs.",
      "EBGaramond-Regular.ttf": "An elegant serif font with classical proportions, perfect for traditional and formal text.",
      "EBGaramond-Bold.ttf": "A bold version of EB Garamond, offering stronger emphasis while maintaining its elegant character.",
      "EBGaramond-Italic.ttf": "An italic version of EB Garamond, adding a flowing, graceful quality to the text.",
      "EBGaramond-BoldItalic.ttf": "Combines the strength of bold with the grace of italic for maximum emphasis with elegance.",
      "CopperplateCC-Bold.ttf": "A classic engraved style typeface with distinct capital letters, ideal for formal headings and titles.",
      "CopperplateCC-Heavy.ttf": "A heavier version of Copperplate with stronger impact, perfect for prominent display text.",
      "Bookman Old Style Regular.ttf": "A readable serif font with a distinctive character, good for extended text.",
      "Bookman Old Style Bold.ttf": "A bold version of Bookman with increased weight for emphasis and headers.",
      "Bookman Old Style Italic.ttf": "An italic version of Bookman, adding a formal, flowing quality to the text.",
      "Bookman Old Style Bold Italic.ttf": "Combines bold weight with italic style for maximum visual distinction and emphasis.",
    };
    
    return descriptions[name] || "A font suitable for 3D text rendering.";
  };

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p className="text-xs">{getFontDescription(fontName)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
