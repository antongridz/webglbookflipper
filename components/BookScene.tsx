"use client"
import type React from "react"
import { useEffect, useRef } from "react"

// Types for configuration
interface BookConfig {
  pageCount: number
  pageWidth: number
  pageHeight: number
  pageSegments: number
  duration: number
  roughness: number
  metalness: number
  envPreset: string
  holographic: boolean
  tiltSensitivity: number
  // Lighting controls
  lightX: number
  lightY: number
  lightZ: number
  lightIntensity: number
  shadowRadius: number
}

const BookScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const guiRef = useRef<any | null>(null)

  // Mouse state for tilt effect
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!mountRef.current) return

    let mounted = true
    let cleanup: (() => void) | null = null

    const initScene = async () => {
      const THREE = await import("three")
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js")
      const GUI = (await import("lil-gui")).default

      if (!mounted || !mountRef.current) return

      // --- CONFIGURATION ---
      const config: BookConfig = {
        pageCount: 16,
        pageWidth: 4,
        pageHeight: 6,
        pageSegments: 30,
        duration: 1,
        roughness: 0.2,
        metalness: 0.1,
        envPreset: "Studio",
        holographic: true,
        tiltSensitivity: 0.15,
        // Light defaults - Adjusted to center shadow
        lightX: 0,
        lightY: 10,
        lightZ: 10,
        lightIntensity: 1.5,
        shadowRadius: 3,
      }

      const imageUrls = [
        "https://cdn.midjourney.com/22ef6ad1-0d1d-49a8-994e-1a177897b195/0_2.png",
        "https://cdn.midjourney.com/1d9f5d10-124b-4c9c-b3c4-7bebd12d400c/0_0.png",
        "https://cdn.midjourney.com/92da42b7-16ea-47f0-bd2c-5fc5feef5e39/0_0.png",
        "https://cdn.midjourney.com/b52a02a8-bdd5-4403-bf79-9fb55cc3d12b/0_2.png",
        "https://cdn.midjourney.com/2763e026-f7d4-4a04-92ce-80e996d78195/0_2.png",
        "https://cdn.midjourney.com/44af601d-1b64-467e-bfe5-c72e28a09079/0_2.png",
        "https://cdn.midjourney.com/4dc4046e-70b1-4a44-a099-932871f53447/0_2.png",
        "https://cdn.midjourney.com/4dc4046e-70b1-4a44-a099-932871f53447/0_1.png",
        "https://cdn.midjourney.com/4dc4046e-70b1-4a44-a099-932871f53447/0_0.png",
        "https://cdn.midjourney.com/b4d7d71f-880b-403e-b0f4-349ceac0e425/0_0.png",
        "https://cdn.midjourney.com/f4dad782-4a42-43e4-974c-a3666c3c40d3/0_1.png",
        "https://cdn.midjourney.com/f697594b-dab7-41c6-a178-644ea8fe0e6c/0_0.png",
        "https://cdn.midjourney.com/7536c700-e8df-436c-a969-81c3077f1803/0_2.png",
        "https://cdn.midjourney.com/7536c700-e8df-436c-a969-81c3077f1803/0_0.png",
        "https://cdn.midjourney.com/23f922a5-b4b5-4856-9dc3-c24372b32beb/0_1.png",
        "https://cdn.midjourney.com/d72cb5f7-bcf1-438e-bfd6-22e141fe6dd0/0_2.png",
        "https://cdn.midjourney.com/2f99d6a7-462c-4628-8cd5-4b0ed074f6e3/0_0.png",
      ]

      const envPresets: Record<string, { bg: number; light: number; ground: number; dir: number }> = {
        Studio: { bg: 0xeeeeee, light: 0xffffff, ground: 0xffffff, dir: 0xffffff },
        Dark: { bg: 0x222222, light: 0x444444, ground: 0x111111, dir: 0xaaaaaa },
        Warm: { bg: 0xf5e6d3, light: 0xffecd2, ground: 0xd2b48c, dir: 0xffd1b3 },
        Cyber: { bg: 0x050510, light: 0x00ffff, ground: 0xff00ff, dir: 0x0000ff },
      }

      // --- SCENE SETUP ---
      const scene = new THREE.Scene()
      // Background is null to allow transparency and see the text behind
      scene.background = null

      // --- CAMERA ---
      let aspect = window.innerWidth / window.innerHeight
      const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 100)
      camera.position.set(0, 0, 18)
      camera.lookAt(0, 0, 0)

      // RENDERER
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0

      mountRef.current.appendChild(renderer.domElement)

      // --- LIGHTING ---
      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

      const hemiLight = new THREE.HemisphereLight(envPresets["Studio"].light, envPresets["Studio"].ground, 0.8)
      scene.add(hemiLight)

      const dirLight = new THREE.DirectionalLight(envPresets["Studio"].dir, config.lightIntensity)
      dirLight.position.set(config.lightX, config.lightY, config.lightZ)
      dirLight.castShadow = true

      dirLight.shadow.mapSize.width = 1024
      dirLight.shadow.mapSize.height = 1024
      dirLight.shadow.bias = -0.0005
      dirLight.shadow.normalBias = 0.02

      const d = 8
      dirLight.shadow.camera.left = -d
      dirLight.shadow.camera.right = d
      dirLight.shadow.camera.top = d
      dirLight.shadow.camera.bottom = -d
      dirLight.shadow.radius = 12

      scene.add(dirLight)

      const spotLight = new THREE.SpotLight(0xffffff, 8)
      spotLight.position.set(-5, 10, 5)
      spotLight.angle = Math.PI / 4
      spotLight.penumbra = 0.5
      scene.add(spotLight)

      // Background Plane - Now a Shadow Catcher
      const planeGeometry = new THREE.PlaneGeometry(100, 100)
      const planeMaterial = new THREE.ShadowMaterial({
        opacity: 0.1 // This makes the shadow visible but the plane itself transparent
      })
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.receiveShadow = true

      // ADJUSTMENT: Balanced distance for soft but present shadows
      plane.position.z = -0.7
      scene.add(plane)

      // --- SHARED TEXTURE LOADER ---
      const textureLoader = new THREE.TextureLoader()
      textureLoader.crossOrigin = "anonymous"

      // --- HELPER FUNCTIONS ---
      // Creates a placeholder texture with the number (Canvas-based)
      const createPlaceholderTexture = (number: number, color: string, isCover = false) => {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 768
        const ctx = canvas.getContext("2d")
        if (!ctx) return new THREE.CanvasTexture(canvas)

        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace

        // 1. Fill Background
        ctx.fillStyle = color
        ctx.fillRect(0, 0, 512, 768)

        // 2. Text / Number
        if (isCover) {
          ctx.fillStyle = "white"
          ctx.font = "bold 60px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("PORTFOLIO", 256, 300)
          ctx.font = "30px Helvetica, Arial"
          ctx.fillText("2024", 256, 360)
          ctx.font = "bold 16px Helvetica, Arial"
          ctx.fillText("LIMITED EDITION", 256, 600)
        } else {
          ctx.fillStyle = "#333"
          ctx.font = "bold 140px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(number.toString(), 256, 384)
        }

        // 3. Baked Spine Shadow
        const spineGradient = ctx.createLinearGradient(0, 0, 40, 0)
        spineGradient.addColorStop(0, "rgba(0,0,0,0.15)")
        spineGradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = spineGradient
        ctx.fillRect(0, 0, 512, 768)

        // 4. Noise
        const imageData = ctx.getImageData(0, 0, 512, 768)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 5
          data[i] += noise
          data[i + 1] += noise
          data[i + 2] += noise
        }
        ctx.putImageData(imageData, 0, 0)

        // 5. Border
        ctx.strokeStyle = "rgba(0,0,0,0.05)"
        ctx.lineWidth = 20
        ctx.strokeRect(0, 0, 512, 768)

        return texture
      }

      // --- PAGE CLASS ---
      class Page {
        index: number
        group: THREE.Group
        zOffset: number
        meshFront: THREE.Mesh
        meshBack: THREE.Mesh
        basePositionAttribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute

        constructor(index: number) {
          this.index = index
          this.group = new THREE.Group()
          this.zOffset = -index * 0.02
          this.group.position.z = this.zOffset

          // Geometry shifted so x=0 is the spine
          const geometry = new THREE.PlaneGeometry(config.pageWidth, config.pageHeight, config.pageSegments, 1)
          geometry.translate(config.pageWidth / 2, 0, 0)
          this.basePositionAttribute = geometry.attributes.position.clone()

          // Colors
          const palette = ["#2c3e50", "#e74c3c", "#3498db", "#27ae60", "#f1c40f", "#8e44ad"]
          const coverColor = "#1a1a1a"
          const pageColor = palette[index % palette.length]

          // Image Logic
          const imgIndexFront = (index * 2) % imageUrls.length
          const imgIndexBack = (index * 2 + 1) % imageUrls.length

          const frontImgUrl = imageUrls[imgIndexFront]
          const backImgUrl = imageUrls[imgIndexBack]

          const isCover = index === 0
          const color = index === 0 ? coverColor : pageColor

          // Initial Textures (Placeholder)
          const frontTexPlaceholder = createPlaceholderTexture(index + 1, color, isCover)
          const backTexPlaceholder = createPlaceholderTexture(index + 2, "#fcfcfc", false)

          // Materials
          const matFront = new THREE.MeshPhysicalMaterial({
            map: frontTexPlaceholder,
            roughness: config.roughness,
            metalness: config.metalness,
            side: THREE.FrontSide,
            iridescence: config.holographic ? 1.0 : 0.0,
            iridescenceIOR: 1.6,
            iridescenceThicknessRange: [100, 400],
            clearcoat: config.holographic ? 1.0 : 0.0,
            clearcoatRoughness: 0.1,
          })

          const matBack = new THREE.MeshPhysicalMaterial({
            map: backTexPlaceholder,
            roughness: config.roughness + 0.1,
            metalness: config.metalness,
            side: THREE.BackSide,
            iridescence: 0,
            clearcoat: 0,
          })

          const handleTextureLoad = (tex: THREE.Texture, mat: THREE.MeshPhysicalMaterial) => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.minFilter = THREE.LinearFilter

            const pageAspect = config.pageWidth / config.pageHeight

            // Cast to any to safely access image properties without TS errors
            const image = tex.image as any
            const imgW = image && image.width ? image.width : 1024
            const imgH = image && image.height ? image.height : 1024

            // Guard against division by zero
            const safeH = imgH === 0 ? 1 : imgH
            const imgAspect = imgW / safeH

            tex.wrapS = THREE.ClampToEdgeWrapping
            tex.wrapT = THREE.ClampToEdgeWrapping
            tex.center.set(0.5, 0.5)

            if (imgAspect > pageAspect) {
              tex.repeat.set(pageAspect / imgAspect, 1)
              tex.offset.set((1 - pageAspect / imgAspect) / 2, 0)
            } else {
              tex.repeat.set(1, imgAspect / pageAspect)
              tex.offset.set(0, (1 - imgAspect / pageAspect) / 2)
            }

            mat.map = tex
            mat.needsUpdate = true
          }

          // Load Real Texture if exists (DIRECT LOADING, No Proxy)
          if (frontImgUrl) {
            textureLoader.load(
              frontImgUrl,
              (tex) => handleTextureLoad(tex, matFront),
              undefined,
              (err) => console.warn("Failed to load front texture", frontImgUrl),
            )
          }

          if (backImgUrl) {
            textureLoader.load(
              backImgUrl,
              (tex) => handleTextureLoad(tex, matBack),
              undefined,
              (err) => console.warn("Failed to load back texture", backImgUrl),
            )
          }

          this.meshFront = new THREE.Mesh(geometry, matFront)
          this.meshBack = new THREE.Mesh(geometry, matBack)

          // --- PHYSICAL THICKNESS OFFSET ---
          // Gap of 0.0005 per side = 0.001 total thickness.
          this.meshFront.position.z = 0.0005
          this.meshBack.position.z = -0.0005

          // Shadows
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

      // --- BOOK MANAGEMENT ---
      const bookGroup = new THREE.Group()
      // Initial position: book is at the bottom edge, half visible
      // Calculate screen height in world units
      const fov = 30 * (Math.PI / 180) // Convert to radians
      const screenHeight = 2 * Math.tan(fov / 2) * camera.position.z
      const halfScreenHeight = screenHeight / 2
      // Set initial Y position to be exactly at the bottom edge of the screen
      bookGroup.position.y = -halfScreenHeight
      scene.add(bookGroup)
      let pages: Page[] = []

      const initBook = () => {
        pages.forEach((p) => bookGroup.remove(p.group))
        pages = []
        for (let i = 0; i < config.pageCount; i++) {
          const page = new Page(i)
          pages.push(page)
          bookGroup.add(page.group)
        }
        bookGroup.rotation.y = 0
      }

      const updateMaterials = () => {
        pages.forEach((p) => p.updateMaterial())
      }

      const updateEnvironment = () => {
        const preset = envPresets[config.envPreset]
        if (preset) {
          // Keep background null for transparency even when changing themes
          hemiLight.color.setHex(preset.light)
          hemiLight.groundColor.setHex(preset.ground)
          dirLight.color.setHex(preset.dir)
          // Background plane is now a ShadowMaterial, so we don't need to change its color
        }
      }

      const updateLight = () => {
        dirLight.position.set(config.lightX, config.lightY, config.lightZ)
        dirLight.intensity = config.lightIntensity
        dirLight.shadow.radius = config.shadowRadius
      }

      initBook()

      // --- GUI ---
      if (!guiRef.current) {
        guiRef.current = new GUI({ title: "Config" })
        guiRef.current.domElement.style.position = "absolute"
        guiRef.current.domElement.style.top = "100px"
        guiRef.current.domElement.style.right = "20px"

        const folderGeneral = guiRef.current.addFolder("General")
        folderGeneral.add(config, "pageCount", 2, 50, 1).name("Page Count").onFinishChange(initBook)

        const folderMaterial = guiRef.current.addFolder("Holographic & Material")
        folderMaterial.add(config, "holographic").name("Holographic Effect").onChange(updateMaterials)
        folderMaterial.add(config, "roughness", 0, 1).name("Roughness").onChange(updateMaterials)
        folderMaterial.add(config, "metalness", 0, 1).name("Metalness").onChange(updateMaterials)
        folderMaterial.add(config, "tiltSensitivity", 0, 2).name("Tilt Sensitivity")

        const folderLight = guiRef.current.addFolder("Lighting & Shadows")
        folderLight.add(config, "lightX", -20, 20).name("Light X").onChange(updateLight)
        folderLight.add(config, "lightY", 0, 30).name("Light Y").onChange(updateLight)
        folderLight.add(config, "lightZ", -20, 20).name("Light Z").onChange(updateLight)
        folderLight.add(config, "lightIntensity", 0, 5).name("Intensity").onChange(updateLight)
        folderLight.add(config, "shadowRadius", 0, 10).name("Shadow Softness").onChange(updateLight)

        const folderEnv = guiRef.current.addFolder("Environment")
        folderEnv.add(config, "envPreset", Object.keys(envPresets)).name("Theme").onChange(updateEnvironment)
      }

      // --- INTERACTION ---
      const handleMouseMove = (e: MouseEvent) => {
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
        mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      }
      window.addEventListener("mousemove", handleMouseMove)

      // --- ANIMATION ---
      const getScrollProgress = () => {
        const scrollHeight = document.body.scrollHeight - window.innerHeight
        if (scrollHeight <= 0) return 0
        return window.scrollY / scrollHeight
      }

      const animateBook = () => {
        const progress = getScrollProgress()

        // Calculate screen height in world units
        const fov = 30 * (Math.PI / 180) // Convert to radians
        const screenHeight = 2 * Math.tan(fov / 2) * camera.position.z
        const halfScreenHeight = screenHeight / 2

        // --- PHASE DEFINITIONS ---
        // Phase 1: Book lifting (0.0 -> 0.3) - Book moves up from bottom edge to center (1/2 from top)
        // Phase 2: Book opening (0.3 -> 0.4) - Book opens at the center position
        // Phase 3: Page flipping (0.4 -> 0.9) - Pages flip
        // Phase 4: Book closing (0.9 -> 1.0) - Book closes

        const liftPhaseEnd = 0.3
        const openPhaseStart = 0.3
        const openPhaseEnd = 0.4
        const flipPhaseStart = 0.4
        const flipPhaseEnd = 0.9
        const closePhaseStart = 0.9

        // --- VERTICAL POSITION LOGIC ---
        // Center of the screen (1/2 height from top) in world units
        const triggerY = 0 
        const initialY = -halfScreenHeight
        
        let targetY = initialY
        if (progress < liftPhaseEnd) {
          // Lifting phase: book moves up to the trigger position (center)
          const liftProgress = progress / liftPhaseEnd
          targetY = initialY + (triggerY - initialY) * liftProgress
        } else {
          // Stay at the trigger position while opening/flipping
          targetY = triggerY
        }
        bookGroup.position.y += (targetY - bookGroup.position.y) * 0.1

        // --- CENTER SHIFT LOGIC (Phase 2: Opening, Phase 4: Closing) ---
        // Book stays closed during lift phase, then opens, then closes at the end
        let targetX = -config.pageWidth / 2 // Default: closed position

        if (progress < openPhaseStart) {
          // Phase 1: Book stays closed during lifting
          targetX = -config.pageWidth / 2
        } else if (progress >= openPhaseStart && progress < openPhaseEnd) {
          // Phase 2: Opening - Book opens from closed to centered
          const openProgress = (progress - openPhaseStart) / (openPhaseEnd - openPhaseStart)
          targetX = (-config.pageWidth / 2) * (1 - openProgress)
        } else if (progress >= openPhaseEnd && progress < closePhaseStart) {
          // Phase 3: Reading - Book stays centered
          targetX = 0
        } else {
          // Phase 4: Closing - Book closes
          const closeProgress = (progress - closePhaseStart) / (1 - closePhaseStart)
          targetX = (config.pageWidth / 2) * closeProgress
        }

        // Smooth lerp for position X
        bookGroup.position.x += (targetX - bookGroup.position.x) * 0.1

        // Mouse Tilt Logic
        const tiltTargetX = mouseRef.current.y * config.tiltSensitivity * 0.5
        const tiltTargetY = mouseRef.current.x * config.tiltSensitivity * 0.5

        bookGroup.rotation.x += (tiltTargetX - bookGroup.rotation.x) * 0.1
        bookGroup.rotation.y += (tiltTargetY - bookGroup.rotation.y) * 0.1

        // Lift Logic:
        const liftAmount = Math.abs(bookGroup.rotation.x) * 1.5 + Math.abs(bookGroup.rotation.y) * 1.0
        bookGroup.position.z = liftAmount * 0.5

        // --- FLIP LOGIC (Phase 3: Page Flipping) ---
        // Pages only flip during the flip phase (after book is opened)
        let flipProgress = 0
        if (progress >= flipPhaseStart && progress < flipPhaseEnd) {
          const flipDuration = flipPhaseEnd - flipPhaseStart
          const rawFlip = (progress - flipPhaseStart) / flipDuration
          flipProgress = Math.max(0, Math.min(1, rawFlip))
        } else if (progress >= flipPhaseEnd) {
          flipProgress = 1 // All pages flipped
        }

        const pagesToFlip = flipProgress * pages.length

        pages.forEach((page, i) => {
          let pageState = pagesToFlip - i
          pageState = Math.max(0, Math.min(1, pageState))

          // 1. Curl
          page.updateCurl(pageState)

          // 2. Z-Index (Stacking) - Improved to prevent gaps
          // Use minimal spacing - only page thickness, no extra gap
          const pageThickness = 0.001 // Total thickness per page (0.0005 per side)
          
          // Right stack: pages go deeper (negative Z)
          // Use only page thickness for spacing to ensure tight packing
          const rightStackZ = -i * pageThickness
          
          // Left stack: pages come forward
          // When flipped, pages stack on left with same tight spacing
          const leftStackZ = i * pageThickness

          // Smooth interpolation - pages stay tightly packed during flip
          const targetZ = rightStackZ * (1 - pageState) + leftStackZ * pageState
          page.group.position.z = targetZ
        })
      }

      let reqId: number
      const animate = () => {
        reqId = requestAnimationFrame(animate)
        animateBook()
        // Camera stays fixed looking forward, so book moves relative to screen
        camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
      }
      animate()

      const handleResize = () => {
        aspect = window.innerWidth / window.innerHeight
        camera.aspect = aspect
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener("resize", handleResize)

      cleanup = () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("resize", handleResize)
        cancelAnimationFrame(reqId)
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
        renderer.dispose()
        if (guiRef.current) {
          guiRef.current.destroy()
          guiRef.current = null
        }
      }
    }

    initScene()

    return () => {
      mounted = false
      if (cleanup) cleanup()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full block" />
}

export default BookScene
