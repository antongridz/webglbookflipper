"use client"
import type React from "react"
import { useEffect, useRef } from "react"
import { BookConfig } from "@/types/book"

interface BookSceneProps {
  config: BookConfig
  onLoad?: () => void
  onProgress?: (progress: number) => void
}

const BookScene: React.FC<BookSceneProps> = ({ config, onLoad, onProgress }) => {
  const mountRef = useRef<HTMLDivElement>(null)
  
  // Refs for Three.js objects to allow updates from props
  const sceneRef = useRef<any>(null)
  const bookGroupRef = useRef<any>(null)
  const pagesRef = useRef<any[]>([])
  const hemiLightRef = useRef<any>(null)
  const dirLightRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const envPresetsRef = useRef<any>(null)
  const timeRef = useRef(0)

  // Loading state tracking
  const loadingRef = useRef({
    total: 0,
    loaded: 0,
    timeoutId: null as NodeJS.Timeout | null
  })

  const checkLoading = () => {
    loadingRef.current.loaded++
    const percentage = Math.round((loadingRef.current.loaded / loadingRef.current.total) * 100)
    onProgress?.(percentage)
    
    if (loadingRef.current.loaded >= loadingRef.current.total) {
      // Clear timeout if all loaded
      if (loadingRef.current.timeoutId) {
        clearTimeout(loadingRef.current.timeoutId)
        loadingRef.current.timeoutId = null
      }
      setTimeout(() => onLoad?.(), 600)
    }
  }

  const mouseRef = useRef({ x: 0, y: 0 })

  // Effect to handle prop changes (Lighting, Materials, Environment)
  useEffect(() => {
    if (!sceneRef.current) return

    // Update Lighting
    if (dirLightRef.current) {
      dirLightRef.current.position.set(config.lightX, config.lightY, config.lightZ)
      dirLightRef.current.intensity = config.lightIntensity
      dirLightRef.current.shadow.radius = config.shadowRadius
    }

    // Handle Dark Mode in 3D Scene
    if (sceneRef.current) {
      // We can adjust global scene parameters here if needed
    }

    // Update Environment
    if (envPresetsRef.current && hemiLightRef.current && dirLightRef.current) {
      const preset = envPresetsRef.current[config.envPreset]
      if (preset) {
        hemiLightRef.current.color.setHex(preset.light)
        hemiLightRef.current.groundColor.setHex(preset.ground)
        dirLightRef.current.color.setHex(preset.dir)
      }
    }

    // Update Materials
    pagesRef.current.forEach(page => {
      if (page.updateMaterial) page.updateMaterial()
    })

  }, [config])

  useEffect(() => {
    if (!mountRef.current) return

    let mounted = true
    let cleanup: (() => void) | null = null

    const initScene = async () => {
      const THREE = await import("three")
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js")

      if (!mounted || !mountRef.current) return

      // Detect mobile device once for optimization (used throughout the function)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768

      loadingRef.current.total = config.pageCount * 2
      loadingRef.current.loaded = 0
      onProgress?.(0)
      
      // Set timeout to prevent infinite loading (30 seconds for mobile, 60 for desktop)
      const timeoutDuration = isMobile ? 30000 : 60000
      loadingRef.current.timeoutId = setTimeout(() => {
        if (loadingRef.current.loaded < loadingRef.current.total) {
          console.warn(`Loading timeout after ${timeoutDuration}ms. Loaded ${loadingRef.current.loaded}/${loadingRef.current.total}`)
          // Force completion to prevent hanging
          loadingRef.current.loaded = loadingRef.current.total
          onProgress?.(100)
          setTimeout(() => onLoad?.(), 100)
        }
      }, timeoutDuration)

      const imageUrls = [
        "/pages/1.webp",
        "/pages/2.webp",
        "/pages/3.webp",
        "/pages/4.webp",
        "/pages/5.webp",
        "/pages/spread-billboard.png?spread", // Page 2 back (left half) - Billboard spread
        "/pages/spread-billboard.png?spread", // Page 3 front (right half) - Billboard spread
        "/pages/8.webp",
        "/pages/9.webp",
        "/pages/10.webp",
        "/pages/11.webp",
        "/pages/12.webp",
        "/pages/13.webp",
        "/pages/14.webp",
        "/pages/15.webp",
        "/pages/16.webp",
        "https://workers.paper.design/file-assets/01K7VHW3XKP45M25KKCKB4HQJZ/01KCWBJEFDAW0WNN4RVAHDPAYC.png", // Halftone image (теперь на 17-й странице)
        "/pages/17.webp", // Back Cover (теперь на 18-й странице)
      ]
      
      // Spread images: one image across two pages (spread)
      // To create a spread across pages N and N+1:
      // 1. Put the image URL with "?spread" marker in position (N*2+1) for back of page N (left half)
      // 2. Put the same URL with "?spread" marker in position ((N+1)*2) for front of page N+1 (right half)
      // Example for spread on pages 2 and 3:
      //   imageUrls[5] = "/spread-image.jpg?spread"  // back of page 2 (left half)
      //   imageUrls[6] = "/spread-image.jpg?spread"  // front of page 3 (right half)
      // Or use object format: {url: "/spread-image.jpg", spread: true}

      const envPresets = {
        Studio: { bg: 0xeeeeee, light: 0xffffff, ground: 0xffffff, dir: 0xffffff },
        Dark: { bg: 0x222222, light: 0x444444, ground: 0x111111, dir: 0xaaaaaa },
        Warm: { bg: 0xf5e6d3, light: 0xffecd2, ground: 0xd2b48c, dir: 0xffd1b3 },
        Cyber: { bg: 0x050510, light: 0x00ffff, ground: 0xff00ff, dir: 0x0000ff },
      }
      envPresetsRef.current = envPresets

      const scene = new THREE.Scene()
      scene.background = null
      sceneRef.current = scene

      let aspect = window.innerWidth / window.innerHeight
      const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 100)
      camera.position.set(0, 0, 18)
      camera.lookAt(0, 0, 0)
      cameraRef.current = camera

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      // Support retina/high DPI displays - lower cap for mobile devices
      const maxPixelRatio = isMobile ? 2 : 3 // Cap at 2x for mobile, 3x for desktop
      const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0
      rendererRef.current = renderer

      mountRef.current.appendChild(renderer.domElement)

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

      const hemiLight = new THREE.HemisphereLight(envPresets["Studio"].light, envPresets["Studio"].ground, 0.8)
      scene.add(hemiLight)
      hemiLightRef.current = hemiLight

      const dirLight = new THREE.DirectionalLight(envPresets["Studio"].dir, config.lightIntensity)
      dirLight.position.set(config.lightX, config.lightY, config.lightZ)
      dirLight.castShadow = true
      // Scale shadow map resolution for high DPI displays
      const shadowMapSize = Math.floor(1024 * pixelRatio)
      dirLight.shadow.mapSize.width = shadowMapSize
      dirLight.shadow.mapSize.height = shadowMapSize
      dirLight.shadow.bias = -0.0001
      dirLight.shadow.normalBias = 0.005
      const d = 8
      dirLight.shadow.camera.left = -d
      dirLight.shadow.camera.right = d
      dirLight.shadow.camera.top = d
      dirLight.shadow.camera.bottom = -d
      dirLight.shadow.radius = 12
      scene.add(dirLight)
      dirLightRef.current = dirLight

      const spotLight = new THREE.SpotLight(0xffffff, 8)
      spotLight.position.set(-5, 10, 5)
      spotLight.angle = Math.PI / 4
      spotLight.penumbra = 0.5
      scene.add(spotLight)

      const planeGeometry = new THREE.PlaneGeometry(100, 100)
      const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.1 })
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.receiveShadow = true
      plane.position.z = -0.7
      scene.add(plane)

      const textureLoader = new THREE.TextureLoader()
      textureLoader.crossOrigin = "anonymous"

      // Load Grain Texture
      let grainImg: HTMLImageElement | null = null
      textureLoader.load("/textures/grain.png", (tex) => {
        grainImg = tex.image as HTMLImageElement
      })

      const drawLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color = "black") => {
        ctx.save()
        // Ensure high quality rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.translate(x, y)
        ctx.scale(scale, scale)
        ctx.fillStyle = color
        // Use even-odd fill rule for cleaner rendering
        ctx.fillRule = "evenodd"
        const p1 = new Path2D("M0 15C0 6.37255 7.06748 0 15.6074 0C24.1472 0 31.2147 6.37255 31.2147 15C31.2147 23.6275 24.1472 30 15.6074 30C7.06748 30 0 23.6275 0 15ZM6.57669 15.098C6.57669 20.2941 10.6994 24.2157 15.6074 24.2157C20.6135 24.2157 24.638 20.1961 24.638 15C24.638 9.80392 20.5153 5.88235 15.6074 5.88235C10.6994 5.88235 6.57669 9.90196 6.57669 15.098Z")
        ctx.fill(p1)
        const p2 = new Path2D("M57.7178 0.784317V19.8039L42.2086 0.784317H36.2209V29.3137H42.4049V10.098L58.1105 29.3137H63.9019V0.784317H57.7178Z")
        ctx.fill(p2)
        const p3 = new Path2D("M89.3251 0.784317L81.5705 14.3137L73.7178 0.784317H67.1411L78.4294 20V29.4118H84.7116V20L96 0.784317H89.3251Z")
        ctx.fill(p3)
        ctx.restore()
      }

      const createPlaceholderTexture = (number: number, color: string, isCover = false, isBack = false) => {
        // Support retina/high DPI displays - lower cap for mobile devices (isMobile defined in outer scope)
        const maxPixelRatio = isMobile ? 2 : 3
        const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
        // Adaptive base resolution: lower for mobile
        const baseWidth = isMobile ? 512 : 1024
        const baseHeight = isMobile ? 768 : 1536
        const canvas = document.createElement("canvas")
        canvas.width = baseWidth * pixelRatio
        canvas.height = baseHeight * pixelRatio
        const ctx = canvas.getContext("2d")
        if (!ctx) return new THREE.CanvasTexture(canvas)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        
        // Scale context for high DPI
        ctx.scale(pixelRatio, pixelRatio)
        
        if (isBack) {
          ctx.translate(baseWidth, 0) // Use logical width, not canvas.width
          ctx.scale(-1, 1)
        }

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        
        ctx.fillStyle = color
        ctx.fillRect(0, 0, baseWidth, baseHeight)
        if (isCover) {
          ctx.fillStyle = "black"
          const centerX = baseWidth / 2
          drawLogo(ctx, centerX - (96 * 1.5) / 2, 100, 1.5)
          ctx.font = "30px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.fillText("2025", centerX, 360)
          ctx.font = "bold 16px Helvetica, Arial"
          ctx.fillText("LIMITED EDITION", centerX, 600)
        } else {
          ctx.fillStyle = "#333"
          ctx.font = "bold 140px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(number.toString(), baseWidth / 2, baseHeight / 2)
        }
        const spineGradient = ctx.createLinearGradient(0, 0, 40, 0)
        spineGradient.addColorStop(0, "rgba(0,0,0,0.15)")
        spineGradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = spineGradient
        ctx.fillRect(0, 0, baseWidth, baseHeight)
        // Get image data at actual canvas resolution (scaled)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 5
          data[i] += noise
          data[i + 1] += noise
          data[i + 2] += noise
        }
        ctx.putImageData(imageData, 0, 0)
        
        // Add Grain
        if (grainImg) {
          ctx.save()
          ctx.globalAlpha = 0.15
          ctx.globalCompositeOperation = "overlay"
          const pattern = ctx.createPattern(grainImg, "repeat")
          if (pattern) {
            ctx.fillStyle = pattern
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          ctx.restore()
        }

        ctx.strokeStyle = "rgba(0,0,0,0.05)"
        ctx.lineWidth = 20
        ctx.strokeRect(0, 0, 512, 768)
        return texture
      }

      class Page {
        index: number
        group: THREE.Group
        zOffset: number
        meshFront: THREE.Mesh
        meshBack: THREE.Mesh
        basePositionAttribute: any
        halftoneUniforms: any = null
        frontStickers: any[] = []
        backStickers: any[] = []

        constructor(index: number) {
          this.index = index
          this.group = new THREE.Group()
          this.zOffset = -index * 0.02
          this.group.position.z = this.zOffset
          
          // Define stickers for this page
          if (index === 0) {
            // No stickers on cover for now, we have logo there
          } else if (index === 2) {
            this.frontStickers.push({ type: "ONY", x: 750, y: 50, size: 200 })
          } else if (index === 5) {
            this.frontStickers.push({ type: "ONY", x: 100, y: 1300, size: 250 })
          }

          const geometry = new THREE.PlaneGeometry(config.pageWidth, config.pageHeight, config.pageSegments, 1)
          geometry.translate(config.pageWidth / 2, 0, 0)
          const position = geometry.attributes.position
          const colors = new Float32Array(position.count * 3)
          for (let i = 0; i < position.count; i++) {
            const x = position.getX(i)
            const nx = x / config.pageWidth
            const shadow = 0.5 + Math.pow(nx, 0.15) * 0.5
            colors[i * 3] = shadow
            colors[i * 3 + 1] = shadow
            colors[i * 3 + 2] = shadow
          }
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
          this.basePositionAttribute = geometry.attributes.position.clone()
          const palette = ["#2c3e50", "#e74c3c", "#3498db", "#27ae60", "#f1c40f", "#8e44ad"]
          const coverColor = "#1a1a1a"
          const pageColor = palette[index % palette.length]
          // Helper to get URL and check if it's a spread
          const getImageInfo = (imgIndex: number) => {
            const item = imageUrls[imgIndex % imageUrls.length]
            if (typeof item === 'string') {
              // Remove spread marker from URL for actual loading
              const cleanUrl = item.replace(/\?spread.*$/, '').replace(/#spread.*$/, '')
              return { url: cleanUrl, spread: item.includes('?spread') || item.includes('#spread') }
            } else if (item && typeof item === 'object' && 'url' in item) {
              return { url: item.url, spread: item.spread === true }
            }
            return { url: item, spread: false }
          }
          
          const imgIndexFront = (index * 2) % imageUrls.length
          const imgIndexBack = (index * 2 + 1) % imageUrls.length
          const frontImgInfo = getImageInfo(imgIndexFront)
          const backImgInfo = getImageInfo(imgIndexBack)
          
          const frontImgUrl = frontImgInfo.url
          const backImgUrl = backImgInfo.url
          
          // Determine spread sides:
          // - If back is spread: it shows left half of the spread (back of current page)
          // - If front is spread: it shows right half of the spread (front of current page)
          const isBackSpread = backImgInfo.spread
          const isFrontSpread = frontImgInfo.spread
          
          // Determine which side of spread to show
          // For back: always left half (if it's a spread)
          // For front: always right half (if it's a spread)
          const backSpreadSide: 'left' | 'right' = 'left'
          const frontSpreadSide: 'left' | 'right' = 'right'
          
          const isCover = index === 0
          const isBackCover = index === config.pageCount - 1
          const isONYPatternPage = index === 4
          const isHalftonePage = index === config.pageCount - 1
          const color = index === 0 || isBackCover ? coverColor : pageColor

          // Initial Textures (Placeholder)
          const frontTexPlaceholder = createPlaceholderTexture(index + 1, color, isCover)
          const backTexPlaceholder = createPlaceholderTexture(index + 2, isBackCover ? coverColor : "#fcfcfc", isBackCover, isBackCover)

          // Materials
          const matFront = new THREE.MeshPhysicalMaterial({
            map: frontTexPlaceholder,
            roughness: config.roughness,
            metalness: config.metalness,
            side: THREE.FrontSide,
            vertexColors: true,
            iridescence: config.holographic ? 1.0 : 0.0,
            iridescenceIOR: 1.6,
            iridescenceThicknessRange: [100, 400],
            clearcoat: config.holographic ? 1.0 : 0.0,
            clearcoatRoughness: 0.1,
          })

          if (isHalftonePage) {
            this.halftoneUniforms = {
              uSize: { value: 0.1 },
              uContrast: { value: 0.29 },
              uRadius: { value: 1.39 },
              uColorFront: { value: new THREE.Color("#506C78") },
              uColorBack: { value: new THREE.Color("#F2F1E8") }
            }

            matFront.onBeforeCompile = (shader) => {
              shader.uniforms.uSize = this.halftoneUniforms.uSize
              shader.uniforms.uContrast = this.halftoneUniforms.uContrast
              shader.uniforms.uRadius = this.halftoneUniforms.uRadius
              shader.uniforms.uColorFront = this.halftoneUniforms.uColorFront
              shader.uniforms.uColorBack = this.halftoneUniforms.uColorBack

              shader.fragmentShader = `
                uniform float uSize;
                uniform float uContrast;
                uniform float uRadius;
                uniform vec3 uColorFront;
                uniform vec3 uColorBack;
                ${shader.fragmentShader}
              `.replace(
                `#include <map_fragment>`,
                `
                #include <map_fragment>
                
                // Halftone Logic
                float aspect = 4.0 / 6.0;
                vec2 halftoneUV = vMapUv * 60.0; // Высокая плотность для детализации картинки
                halftoneUV.y /= aspect;
                
                vec2 grid = fract(halftoneUV) - 0.5;
                float dist = length(grid);
                
                // Sample brightness from the original map
                float brightness = (diffuseColor.r + diffuseColor.g + diffuseColor.b) / 3.0;
                
                // Strict Halftone Size Logic
                // Чем темнее область (меньше brightness), тем больше точка
                float dotSize = (1.0 - brightness) * uRadius * uSize;
                float gooey = smoothstep(dotSize, dotSize - 0.1, dist);
                
                vec3 halftoneColor = mix(uColorBack, uColorFront, gooey);
                diffuseColor.rgb = halftoneColor;
                `
              )
            }
          }
          
          const matBack = new THREE.MeshPhysicalMaterial({
            map: backTexPlaceholder,
            roughness: config.roughness + 0.1,
            metalness: config.metalness,
            side: THREE.BackSide,
            vertexColors: true,
            iridescence: 0,
            clearcoat: 0,
          })

          const handleTextureLoad = (tex: THREE.Texture, mat: THREE.MeshPhysicalMaterial, isBack = false, stickers: any[] = [], isSpread = false, spreadSide: 'left' | 'right' = 'left', isPatternPage = false, isHalftone = false) => {
            // Support retina/high DPI displays - lower cap for mobile devices (isMobile defined in outer scope)
            const maxPixelRatio = isMobile ? 2 : 3 // Cap at 2x for mobile, 3x for desktop
            const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
            // Adaptive base resolution: lower for mobile to save memory
            const baseWidth = isMobile ? 1024 : 2048
            const baseHeight = isMobile ? 1536 : 3072
            // Reduced sticker scale for mobile
            const stickerScale = stickers.length > 0 ? (isMobile ? 1.2 : 1.5) : 1
            const scale = Math.max(pixelRatio * stickerScale, 1) // Ensure at least 1x
            const canvas = document.createElement("canvas")
            canvas.width = baseWidth * scale
            canvas.height = baseHeight * scale
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            
            // Enable highest quality rendering
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            
            // Holo Mask Canvas (same high resolution)
            const holoCanvas = document.createElement("canvas")
            holoCanvas.width = 1024 * scale
            holoCanvas.height = 1536 * scale
            const holoCtx = holoCanvas.getContext("2d")
            if (holoCtx) {
              holoCtx.fillStyle = "black"
              holoCtx.fillRect(0, 0, holoCanvas.width, holoCanvas.height)
              holoCtx.imageSmoothingEnabled = true
              holoCtx.imageSmoothingQuality = "high"
            }

            if (isBack) {
              ctx.translate(canvas.width, 0)
              ctx.scale(-1, 1)
              if (holoCtx) {
                holoCtx.translate(canvas.width, 0)
                holoCtx.scale(-1, 1)
              }
            }

            ctx.fillStyle = "#fff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Draw image first (if not ONY pattern page or if it's back side)
            if (!(isPatternPage && !isBack)) {
              // Draw image for normal pages or back side of pattern page
              const pageAspect = config.pageWidth / config.pageHeight
              const image = tex.image as any
              const imgW = image?.width || 1024
              const imgH = image?.height || 1024
              const safeH = imgH === 0 ? 1 : imgH
              const imgAspect = imgW / safeH
              
              if (isSpread) {
                // For spread: draw only half of the image
                // spreadSide='left' means left half of the spread (back of left page)
                // spreadSide='right' means right half of the spread (front of right page)
                //
                // IMPORTANT: Canvas transformation for back pages happens BEFORE this code
                // Back pages: translate(width,0) + scale(-1,1) flips the canvas horizontally
                // This means coordinates are mirrored: x=0 becomes x=width, x=width becomes x=0
                //
                // Key insight: When canvas is flipped, we need to think about what we want to SEE,
                // not what we DRAW. The drawImage coordinates are in the flipped coordinate system.
                //
                // For back pages (isBack=true, canvas is flipped):
                // - To SEE left half of spread: we DRAW right half of image (sourceX = imgW/2)
                //   Because: right half (imgW/2 to imgW) drawn at x=0 on flipped canvas → appears on left
                // - To SEE right half of spread: we DRAW left half of image (sourceX = 0)
                //   Because: left half (0 to imgW/2) drawn at x=0 on flipped canvas → appears on right
                //
                // For front pages (isBack=false, canvas is normal):
                // - To SEE left half of spread: we DRAW left half of image (sourceX = 0)
                // - To SEE right half of spread: we DRAW right half of image (sourceX = imgW/2)
                let sourceX: number
                if (isBack) {
                  // Back page: canvas is flipped horizontally
                  // When canvas is flipped: what we draw at x=0 appears at x=width in final image
                  // So to show LEFT half visually, we need to draw it at the RIGHT side of flipped canvas
                  // But wait - we're selecting which HALF of the SOURCE image to draw, not where to draw it
                  // 
                  // Actually, let's think differently:
                  // - Canvas flip mirrors everything horizontally
                  // - If we draw LEFT half of image (0 to imgW/2) at x=0 on flipped canvas → appears on RIGHT
                  // - If we draw RIGHT half of image (imgW/2 to imgW) at x=0 on flipped canvas → appears on LEFT
                  //
                  // So for back pages:
                  // - spreadSide='left' (want to SEE left) → DRAW right half (imgW/2) so it appears on left
                  // - spreadSide='right' (want to SEE right) → DRAW left half (0) so it appears on right
                  //
                  // BUT: The user reports seeing the same half on both pages, which suggests this logic might be inverted
                  // Let's try the opposite:
                  sourceX = spreadSide === 'left' ? 0 : imgW / 2  // INVERTED: try drawing left half for left side
                } else {
                  // Front page: canvas is normal
                  // spreadSide='left' means DRAW left half
                  // spreadSide='right' means DRAW right half
                  sourceX = spreadSide === 'left' ? 0 : imgW / 2
                }
                
                const sourceWidth = imgW / 2
                const sourceHeight = imgH
                
                // Calculate destination to fill the page
                // For spread: align halves to meet in the center
                // - Left half (back page): align to RIGHT edge visually (closer to center)
                // - Right half (front page): align to LEFT edge visually (closer to center)
                // 
                // IMPORTANT: For back pages, canvas is flipped (translate + scale -1)
                // On flipped canvas: x=0 appears on RIGHT, x=width appears on LEFT
                // So to align visually to RIGHT edge: draw at x=0 on flipped canvas
                // To align visually to LEFT edge: draw at x=width-drawW on flipped canvas
                if (imgAspect / 2 > pageAspect) {
                  // Image is wider than page - fit to height
                  const drawW = canvas.height * (imgAspect / 2)
                  let drawX: number
                  if (isBack) {
                    // Back page (left half): align to RIGHT edge visually
                    // On flipped canvas: to appear on right, draw at right side of flipped canvas
                    // Right side of flipped canvas = canvas.width - drawW
                    drawX = canvas.width - drawW
                  } else {
                    // Front page (right half): align to LEFT edge visually
                    // On normal canvas: draw at x=0 to appear on left
                    drawX = 0
                  }
                  ctx.drawImage(
                    image,
                    sourceX, 0, sourceWidth, sourceHeight, // Source rectangle: half of image
                    drawX, 0, drawW, canvas.height // Destination rectangle: full page
                  )
                } else {
                  // Image is taller - fit to width (fills entire width)
                  const drawH = canvas.width / (imgAspect / 2)
                  const drawY = (canvas.height - drawH) / 2
                  // Image fills entire width, so it's already aligned correctly
                  ctx.drawImage(
                    image,
                    sourceX, 0, sourceWidth, sourceHeight, // Source rectangle: half of image
                    0, drawY, canvas.width, drawH // Destination rectangle: full page width
                  )
                }
              } else {
                // Normal single-page image
                if (imgAspect > pageAspect) {
                  const drawW = canvas.height * imgAspect
                  ctx.drawImage(image, (canvas.width - drawW) / 2, 0, drawW, canvas.height)
                } else {
                  const drawH = canvas.width / imgAspect
                  ctx.drawImage(image, 0, (canvas.height - drawH) / 2, canvas.width, drawH)
                }
              }
            }

            // Draw ONY Pattern for pattern page (front side only)
            if (isPatternPage && !isBack) {
              // Draw ONY Pattern with high quality
              ctx.fillStyle = "#1a1a1a"
              ctx.fillRect(0, 0, canvas.width, canvas.height)
              
              const cols = 4
              const rows = 8
              const spacingX = canvas.width / cols
              const spacingY = canvas.height / rows
              
              for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                  const x = (i * spacingX + spacingX / 2 - (96 * 0.5 * scale) / 2)
                  const y = (j * spacingY + spacingY / 2 - (30 * 0.5 * scale) / 2)
                  
                  // Watermark on page
                  ctx.save()
                  ctx.globalAlpha = 0.2
                  drawLogo(ctx, x, y, 0.5 * scale, "rgba(255,255,255,0.2)")
                  ctx.restore()
                  
                  // Holographic effect on each logo in pattern - clean edges
                  if (holoCtx) {
                    holoCtx.save()
                    holoCtx.fillStyle = "white"
                    holoCtx.globalCompositeOperation = "source-over"
                    // No shadow blur - clean sharp edges
                    drawLogo(holoCtx, x, y, 0.5 * scale, "white")
                    holoCtx.restore()
                  }
                }
              }
            }

            // Add Grain FIRST (before logos, so logos cover it cleanly)
            if (grainImg) {
              ctx.save()
              ctx.globalAlpha = stickers.length > 0 ? 0.1 : 0.2
              ctx.globalCompositeOperation = "overlay"
              const pattern = ctx.createPattern(grainImg, "repeat")
              if (pattern) {
                ctx.fillStyle = pattern
                ctx.fillRect(0, 0, canvas.width, canvas.height)
              }
              ctx.restore()
            }

            // Draw Stickers AFTER grain (so they cover grain cleanly)
            stickers.forEach(sticker => {
              if (sticker.type === "ONY") {
                ctx.save()
                // Scale coordinates for higher resolution
                const scaledX = sticker.x * scale
                const scaledY = sticker.y * scale
                const scaledSize = sticker.size * scale
                
                // Draw logo as watermark - fully opaque to cover grain underneath
                ctx.globalAlpha = 1.0 // Fully opaque to cover grain
                ctx.globalCompositeOperation = "source-over"
                drawLogo(ctx, scaledX, scaledY, scaledSize / 100)
                ctx.restore()
              }

              if (holoCtx) {
                // Draw only the logo shape in white on the holo mask - clean sharp edges
                holoCtx.save()
                holoCtx.fillStyle = "white"
                holoCtx.globalCompositeOperation = "source-over"
                const scaledX = sticker.x * scale
                const scaledY = sticker.y * scale
                const scaledSize = sticker.size * scale
                
                // Clean sharp edges - no shadow blur, no white border
                drawLogo(holoCtx, scaledX, scaledY, scaledSize / 100, "white")
                holoCtx.restore()
              }
            })
            
            // Update textures after all drawing is complete
            // Update for pages with stickers OR pattern page
            if (stickers.length > 0 || (isPatternPage && !isBack)) {
              const newTex = new THREE.CanvasTexture(canvas)
              newTex.colorSpace = THREE.SRGBColorSpace
              // High-quality filtering for crisp logos
              newTex.minFilter = THREE.LinearFilter
              newTex.magFilter = THREE.LinearFilter
              newTex.generateMipmaps = false // Disable mipmaps for sharp logos
              mat.map = newTex
              if (holoCtx) {
                const holoTex = new THREE.CanvasTexture(holoCanvas)
                holoTex.colorSpace = THREE.SRGBColorSpace
                holoTex.minFilter = THREE.LinearFilter
                holoTex.magFilter = THREE.LinearFilter
                holoTex.generateMipmaps = false
                mat.iridescenceThicknessMap = holoTex
                if (mat.userData.shader) {
                  mat.userData.shader.uniforms.uHoloMap.value = holoTex
                }
              }
              mat.needsUpdate = true
            } else {
              // Update texture for normal pages without stickers
              const newTex = new THREE.CanvasTexture(canvas)
              newTex.colorSpace = THREE.SRGBColorSpace
              mat.map = newTex
              mat.needsUpdate = true
            }
            
            // Apply holo effect for pages with stickers OR pattern page
            if (holoCtx && (stickers.length > 0 || (isPatternPage && !isBack))) {
              const holoTex = new THREE.CanvasTexture(holoCanvas)
              mat.iridescenceThicknessMap = holoTex
              mat.iridescence = 1.0

              // Custom holo shader (only if not halftone page)
              if (!isHalftone) {
                mat.onBeforeCompile = (shader) => {
                  shader.uniforms.uTime = { value: 0 }
                  shader.uniforms.uMouse = { value: new THREE.Vector2(0, 0) }
                  shader.uniforms.uHoloMap = { value: mat.iridescenceThicknessMap }
                  
                  shader.fragmentShader = `
                    uniform float uTime;
                    uniform vec2 uMouse;
                    uniform sampler2D uHoloMap;

                    // Smoother spectral color approximation
                    vec3 spectral_color(float w) {
                      float r = smoothstep(400.0, 450.0, w) - smoothstep(550.0, 650.0, w);
                      float g = smoothstep(450.0, 550.0, w) - smoothstep(600.0, 700.0, w);
                      float b = smoothstep(400.0, 500.0, w) - smoothstep(500.0, 600.0, w);
                      return clamp(vec3(r, g, b), 0.0, 1.0);
                    }

                    float hash(vec2 p) {
                      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    ${shader.fragmentShader}
                  `.replace(
                    `#include <map_fragment>`,
                    `
                    #include <map_fragment>
                    
                    float holoMask = texture2D(uHoloMap, vMapUv).r;
                    // Sharper mask edge for cleaner logo boundaries
                    float holoMaskSmooth = smoothstep(0.02, 0.08, holoMask);
                    
                    if (holoMaskSmooth > 0.01) {
                      vec3 viewDir = normalize(vViewPosition);
                      vec3 normal = normalize(vNormal);
                      float dotNV = dot(normal, viewDir);
                      vec2 tilt = uMouse * 0.25;
                      
                      // Very smooth wavelength shift - no harsh transitions
                      float shift = dotNV * 2.0 + (vMapUv.x - 0.5) * tilt.x * 6.0 + (vMapUv.y - 0.5) * tilt.y * 6.0;
                      float wavelength = 400.0 + mod(shift * 70.0, 300.0);
                      vec3 rainbow = spectral_color(wavelength);
                      
                      // Minimal sparkle - only subtle highlights, not noise
                      float sparkleNoise = hash(vMapUv * 256.0 + uTime * 0.5); // Very low frequency
                      float sparkle = pow(sparkleNoise, 80.0) * 1.5 * max(0.0, dot(normal, vec3(tilt, 1.0))) * holoMaskSmooth;
                      
                      // Clean foil effect - smooth rainbow with subtle highlights
                      vec3 foil = rainbow * 0.4 + vec3(sparkle * 0.3) + vec3(pow(1.0 - abs(dotNV), 5.0) * 0.25);
                      
                      // Blend smoothly with original color
                      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb + foil, 0.6 * holoMaskSmooth);
                      
                      // Clean specular highlight - smooth and controlled
                      float spec = pow(max(0.0, dot(reflect(-viewDir, normal), normalize(vec3(tilt, 1.0)))), 30.0);
                      diffuseColor.rgb += spec * 0.35 * holoMaskSmooth;
                    }
                    `
                  )
                  mat.userData.shader = shader
                }
              }
            }

            mat.needsUpdate = true
          }

          if (frontImgUrl) {
            // Load front texture with error handling
            const frontIsSpread = isFrontSpread
            const frontSide = frontSpreadSide
            textureLoader.load(
              frontImgUrl, 
              (tex) => {
                try {
                  handleTextureLoad(tex, matFront, false, this.frontStickers, frontIsSpread, frontSide, isONYPatternPage, isHalftonePage)
                  checkLoading()
                } catch (error) {
                  console.error(`Error processing front texture for page ${this.index}:`, error)
                  checkLoading() // Still count as loaded to prevent hanging
                }
              }, 
              undefined, 
              (error) => {
                console.error(`Error loading front texture for page ${this.index}:`, error)
                checkLoading() // Count as loaded to prevent hanging
              }
            )
          } else {
            // No image URL - create empty texture for pattern page or use placeholder
            if (isONYPatternPage) {
              // For pattern page, create empty texture and draw pattern
              const emptyTex = new THREE.Texture()
              emptyTex.image = new Image()
              emptyTex.image.width = 1024
              emptyTex.image.height = 1536
              handleTextureLoad(emptyTex, matFront, false, this.frontStickers, false, 'left', isONYPatternPage, isHalftonePage)
            }
            checkLoading()
          }

          if (backImgUrl) {
            // Load back texture with error handling
            const backIsSpread = isBackSpread
            const backSide = backSpreadSide
            textureLoader.load(
              backImgUrl, 
              (tex) => {
                try {
                  handleTextureLoad(tex, matBack, true, this.backStickers, backIsSpread, backSide, isONYPatternPage, isHalftonePage)
                  if (isBackCover) {
                    const canvas = matBack.map?.image as HTMLCanvasElement
                    if (canvas?.getContext) {
                      const ctx = canvas.getContext("2d")
                      if (ctx) drawLogo(ctx, canvas.width / 2 - (96 * 2) / 2, 150, 2)
                      matBack.map!.needsUpdate = true
                    }
                  }
                  checkLoading()
                } catch (error) {
                  console.error(`Error processing back texture for page ${this.index}:`, error)
                  checkLoading() // Still count as loaded to prevent hanging
                }
              }, 
              undefined, 
              (error) => {
                console.error(`Error loading back texture for page ${this.index}:`, error)
                checkLoading() // Count as loaded to prevent hanging
              }
            )
          } else { 
            if (isBackCover) {
              const canvas = matBack.map?.image as HTMLCanvasElement
              if (canvas?.getContext) {
                const ctx = canvas.getContext("2d")
                if (ctx) drawLogo(ctx, canvas.width / 2 - (96 * 2) / 2, 150, 2)
                matBack.map!.needsUpdate = true
              }
            }
            checkLoading() 
          }

          this.meshFront = new THREE.Mesh(geometry, matFront)
          this.meshBack = new THREE.Mesh(geometry, matBack)
          this.meshFront.position.z = 0.0005
          this.meshBack.position.z = -0.0005
          this.meshFront.castShadow = true
          this.meshFront.receiveShadow = true
          this.meshBack.castShadow = true
          this.meshBack.receiveShadow = true
          this.group.add(this.meshFront)
          this.group.add(this.meshBack)
        }

        updateCurl(rotationFactor: number) {
          const position = this.meshFront.geometry.attributes.position
          const basePos = this.basePositionAttribute
          const currentAngle = rotationFactor * Math.PI
          const bendAmount = Math.sin(currentAngle) * 1.0
          for (let i = 0; i < position.count; i++) {
            const x = basePos.getX(i)
            const y = basePos.getY(i)
            const z = basePos.getZ(i)
            const normalizedX = x / config.pageWidth
            const displacement = Math.pow(normalizedX, 2) * bendAmount
            position.setZ(i, z + displacement)
            position.setY(i, y - Math.abs(displacement) * 0.2)
          }
          position.needsUpdate = true
          this.group.rotation.y = -currentAngle
        }

        updateMaterial() {
          const matFront = this.meshFront.material as THREE.MeshPhysicalMaterial
          matFront.roughness = config.roughness
          matFront.metalness = config.metalness
          matFront.iridescence = config.holographic ? 1.0 : 0.0
          matFront.clearcoat = config.holographic ? 1.0 : 0.0
          const matBack = this.meshBack.material as THREE.MeshPhysicalMaterial
          matBack.roughness = Math.min(1, config.roughness + 0.1)
          matBack.metalness = config.metalness
        }
      }

      const bookGroup = new THREE.Group()
      const fov = 30 * (Math.PI / 180)
      const screenHeight = 2 * Math.tan(fov / 2) * camera.position.z
      const halfScreenHeight = screenHeight / 2
      bookGroup.position.y = -halfScreenHeight
      scene.add(bookGroup)
      bookGroupRef.current = bookGroup

      const initBook = () => {
        pagesRef.current.forEach((p) => bookGroup.remove(p.group))
        pagesRef.current = []
        for (let i = 0; i < config.pageCount; i++) {
          const page = new Page(i)
          pagesRef.current.push(page)
          bookGroup.add(page.group)
        }
        bookGroup.rotation.y = 0
      }

      initBook()

      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      }
      window.addEventListener("mousemove", handleMouseMove)

      const animateBook = () => {
        const scrollHeight = document.body.scrollHeight - window.innerHeight
        const progress = scrollHeight <= 0 ? 0 : window.scrollY / scrollHeight

        const liftPhaseEnd = 0.3
        const openPhaseStart = 0.3
        const openPhaseEnd = 0.4
        const flipPhaseStart = 0.4
        const flipPhaseEnd = 0.9
        const closePhaseStart = 0.9

        const triggerY = 0 
        const initialY = -halfScreenHeight
        let targetY = progress < liftPhaseEnd ? initialY + (triggerY - initialY) * (progress / liftPhaseEnd) : triggerY
        bookGroup.position.y += (targetY - bookGroup.position.y) * 0.1

        let targetX = -config.pageWidth / 2
        if (progress >= openPhaseStart && progress < openPhaseEnd) {
          targetX = (-config.pageWidth / 2) * (1 - (progress - openPhaseStart) / (openPhaseEnd - openPhaseStart))
        } else if (progress >= openPhaseEnd && progress < closePhaseStart) {
          targetX = 0
        } else if (progress >= closePhaseStart) {
          targetX = (config.pageWidth / 2) * ((progress - closePhaseStart) / (1 - closePhaseStart))
        }
        bookGroup.position.x += (targetX - bookGroup.position.x) * 0.1

        const tiltTargetX = mouseRef.current.y * config.tiltSensitivity * 0.5
        const tiltTargetY = mouseRef.current.x * config.tiltSensitivity * 0.5
        bookGroup.rotation.x += (tiltTargetX - bookGroup.rotation.x) * 0.1
        bookGroup.rotation.y += (tiltTargetY - bookGroup.rotation.y) * 0.1
        bookGroup.position.z = (Math.abs(bookGroup.rotation.x) * 1.5 + Math.abs(bookGroup.rotation.y) * 1.0) * 0.5

        let flipProgress = progress >= flipPhaseStart && progress < flipPhaseEnd ? (progress - flipPhaseStart) / (flipPhaseEnd - flipPhaseStart) : progress >= flipPhaseEnd ? 1 : 0
        const pagesToFlip = flipProgress * pagesRef.current.length
        
        timeRef.current += 0.01

        pagesRef.current.forEach((page, i) => {
          const pageState = Math.max(0, Math.min(1, pagesToFlip - i))
          page.updateCurl(pageState)

          // Update Holo Uniforms
          const updateHolo = (mat: THREE.MeshPhysicalMaterial) => {
            if (mat.userData.shader) {
              mat.userData.shader.uniforms.uTime.value = timeRef.current
              mat.userData.shader.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
            }
          }
          updateHolo(page.meshFront.material as THREE.MeshPhysicalMaterial)
          updateHolo(page.meshBack.material as THREE.MeshPhysicalMaterial)

          // Update Halftone Size Animation
          if (page.halftoneUniforms) {
            // Линейно от 0.1 (справа) до 0.4 (слева)
            page.halftoneUniforms.uSize.value = 0.3 + (pageState * 0.6)
          }

          const pageThickness = 0.001
          page.group.position.z = (-i * pageThickness) * (1 - pageState) + (i * pageThickness) * pageState
        })
      }

      let reqId: number
      const animate = () => {
        reqId = requestAnimationFrame(animate)
        animateBook()
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
      }
      animate()

      const handleResize = () => {
        aspect = window.innerWidth / window.innerHeight
        camera.aspect = aspect
        camera.updateProjectionMatrix()
        // Update pixel ratio on resize (in case user changes display or zooms)
        // Re-detect mobile on resize as window size may have changed
        const isMobileNow = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
        const maxPixelRatio = isMobileNow ? 2 : 3
        const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
        renderer.setPixelRatio(pixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener("resize", handleResize)

      cleanup = () => {
        // Clear loading timeout
        if (loadingRef.current.timeoutId) {
          clearTimeout(loadingRef.current.timeoutId)
          loadingRef.current.timeoutId = null
        }
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("resize", handleResize)
        cancelAnimationFrame(reqId)
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) mountRef.current.removeChild(renderer.domElement)
        renderer.dispose()
      }
    }

    initScene()
    return () => { mounted = false; if (cleanup) cleanup() }
  }, [config.pageCount]) // Only re-init when page count changes

  return <div ref={mountRef} className="w-full h-full" />
}

export default BookScene
