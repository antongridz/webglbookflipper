export interface BookConfig {
  pageCount: number
  pageWidth: number
  pageHeight: number
  pageSegments: number
  duration: number
  roughness: number
  metalness: number
  envPreset: string
  holographic: boolean
  isDarkMode: boolean
  tiltSensitivity: number
  // Lighting controls
  lightX: number
  lightY: number
  lightZ: number
  lightIntensity: number
  shadowRadius: number
}

export const DEFAULT_BOOK_CONFIG: BookConfig = {
  pageCount: 9, // 9 листов = 18 страниц (17 изображений + 1 шейдер)
  pageWidth: 4,
  pageHeight: 6,
  pageSegments: 30,
  duration: 1,
  roughness: 0.2,
  metalness: 0.1,
  envPreset: "Studio",
  holographic: true,
  isDarkMode: false,
  tiltSensitivity: 0.15,
  lightX: 0,
  lightY: 10,
  lightZ: 10,
  lightIntensity: 1.5,
  shadowRadius: 3,
}

