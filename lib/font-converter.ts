"use client";

import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';

// Global font cache to avoid reloading the same fonts
const fontCache: Record<string, Font> = {};

/**
 * A utility function to load fonts in different formats.
 * Automatically detects file format and uses appropriate loader.
 * Includes caching for better performance.
 * 
 * @param fontPath The path to the font file
 * @returns A promise that resolves to a Three.js Font
 */
export const loadFont = (fontPath: string): Promise<Font> => {
  // Return from cache if available
  if (fontCache[fontPath]) {
    console.log(`Using cached font: ${fontPath}`);
    return Promise.resolve(fontCache[fontPath]);
  }
  
  console.log(`Loading font: ${fontPath}`);
  
  return new Promise((resolve, reject) => {    // Check if it's a .typeface.json or .ttf file
    if (fontPath.endsWith('.typeface.json')) {
      // Use FontLoader for .typeface.json files
      const loader = new FontLoader();
      loader.load(
        fontPath,
        (font) => {
          try {
            // Store in cache for future use
            console.log(`Successfully loaded typeface.json font: ${fontPath}`);
            fontCache[fontPath] = font;
            resolve(font);
          } catch (parseError) {
            console.error(`Error parsing font data: ${parseError}`);
            reject(new Error(`Failed to parse font ${fontPath}: ${parseError}`));
          }
        },
        (xhr) => {
          console.log(`${fontPath} loading: ${(xhr.loaded / xhr.total * 100)}%`);
        },        (error: unknown) => {
          console.error(`Error loading font: ${fontPath}`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Failed to load font ${fontPath}: ${errorMessage}`));
        }
      );
    } else if (fontPath.endsWith('.ttf') || fontPath.endsWith('.otf')) {
      // Use TTFLoader for .ttf files, which converts to typeface.json format
      const loader = new TTFLoader();
      loader.load(
        fontPath,        (json) => {
          try {
            // Convert the TTF data to a Three.js Font
            console.log(`Successfully loaded TTF font: ${fontPath}`);
            console.log(`Converting TTF to typeface format...`);
            
            // Make sure the JSON data is valid
            if (!json || typeof json !== 'object') {
              throw new Error('Invalid JSON data from TTF loader');
            }
            
            // Validate the JSON structure to ensure it's compatible with FontLoader
            if (!json.glyphs) {
              throw new Error('TTF conversion did not produce valid font data (missing glyphs)');
            }
            
            const font = new FontLoader().parse(json);
            
            // Store in cache for future use
            fontCache[fontPath] = font;
            console.log(`Font conversion successful`);
            resolve(font);
          } catch (parseError) {
            console.error(`Error parsing TTF font data:`, parseError);
            // Use default font instead
            console.log(`Falling back to default font due to TTF parsing error`);
            loadFont('/fonts/helvetiker_regular.typeface.json')
              .then(defaultFont => {
                fontCache[fontPath] = defaultFont; // Cache under the original path
                resolve(defaultFont);
              })
              .catch(fallbackError => {
                console.error(`Even fallback font failed:`, fallbackError);
                reject(new Error(`Failed to parse TTF font ${fontPath} and fallback failed: ${fallbackError}`));
              });
          }
        },
        (xhr) => {
          console.log(`${fontPath} loading: ${(xhr.loaded / xhr.total * 100)}%`);
        },
        (error) => {          console.error(`Error loading TTF font: ${fontPath}`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Failed to load TTF font ${fontPath}: ${errorMessage}`));
        }
      );    } else {
      console.error(`Unsupported font format: ${fontPath}`);
      // Fallback to default font if format is unsupported
      console.log(`Falling back to default font: helvetiker_regular.typeface.json`);
      const fallbackPath = '/fonts/helvetiker_regular.typeface.json';
      const loader = new FontLoader();
      loader.load(
        fallbackPath,
        (font) => {
          console.log(`Loaded fallback font`);
          fontCache[fontPath] = font; // Cache under original requested path
          resolve(font);
        },
        undefined,
        (error) => {          console.error(`Even fallback font failed to load: ${error}`);
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Unsupported font format: ${fontPath} and fallback failed: ${errorMessage}`));
        }
      );
    }
  });
};

/**
 * Preloads all available fonts to cache them for faster use
 * 
 * @param fontFiles Array of font file names
 * @returns A promise that resolves to an object with font names as keys and Font objects as values
 */
export const preloadFonts = async (fontFiles: string[]): Promise<Record<string, Font>> => {
  const localFontCache: Record<string, Font> = {};
  
  console.log(`Preloading ${fontFiles.length} fonts...`);
  
  // First load the default font to ensure we have at least one working font
  try {
    console.log(`Preloading default font first...`);
    const defaultFont = await loadFont(`/fonts/helvetiker_regular.typeface.json`);
    localFontCache['helvetiker_regular.typeface.json'] = defaultFont;
    console.log(`Default font loaded successfully`);
  } catch (error) {
    console.error(`Failed to load default font:`, error);
    // Continue anyway, we'll try the rest of the fonts
  }
  
  // Now load the rest of the fonts
  const promises = fontFiles
    .filter(font => font !== 'helvetiker_regular.typeface.json') // Skip default font as we already loaded it
    .map(async (fontFile) => {
      try {
        console.log(`Preloading font: ${fontFile}`);
        const font = await loadFont(`/fonts/${fontFile}`);
        localFontCache[fontFile] = font;
        console.log(`Preloaded font: ${fontFile}`);
      } catch (error) {
        console.error(`Failed to preload font ${fontFile}:`, error);
        // Don't rethrow, just log the error and continue with other fonts
      }
    });
  
  // Wait for all font loading to complete, whether successfully or not
  await Promise.allSettled(promises);
  console.log(`Finished preloading fonts. Successfully loaded: ${Object.keys(localFontCache).length} fonts`);
  
  return localFontCache;
};
