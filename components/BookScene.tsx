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

  // Loading state tracking
  const loadingRef = useRef({
    total: 0,
    loaded: 0
  })

  const checkLoading = () => {
    loadingRef.current.loaded++
    const percentage = Math.round((loadingRef.current.loaded / loadingRef.current.total) * 100)
    onProgress?.(percentage)
    
    if (loadingRef.current.loaded >= loadingRef.current.total) {
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

      loadingRef.current.total = config.pageCount * 2
      loadingRef.current.loaded = 0
      onProgress?.(0)

      const imageUrls = [
        "/pages/1.webp",
        "/pages/2.webp",
        "/pages/3.webp",
        "/pages/4.webp",
        "/pages/5.webp",
        "/pages/6.webp",
        "/pages/7.webp",
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
      dirLight.shadow.mapSize.width = 1024
      dirLight.shadow.mapSize.height = 1024
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

      const drawLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(scale, scale)
        ctx.fillStyle = "black"
        const p1 = new Path2D("M0 15C0 6.37255 7.06748 0 15.6074 0C24.1472 0 31.2147 6.37255 31.2147 15C31.2147 23.6275 24.1472 30 15.6074 30C7.06748 30 0 23.6275 0 15ZM6.57669 15.098C6.57669 20.2941 10.6994 24.2157 15.6074 24.2157C20.6135 24.2157 24.638 20.1961 24.638 15C24.638 9.80392 20.5153 5.88235 15.6074 5.88235C10.6994 5.88235 6.57669 9.90196 6.57669 15.098Z")
        ctx.fill(p1)
        const p2 = new Path2D("M57.7178 0.784317V19.8039L42.2086 0.784317H36.2209V29.3137H42.4049V10.098L58.1105 29.3137H63.9019V0.784317H57.7178Z")
        ctx.fill(p2)
        const p3 = new Path2D("M89.3251 0.784317L81.5705 14.3137L73.7178 0.784317H67.1411L78.4294 20V29.4118H84.7116V20L96 0.784317H89.3251Z")
        ctx.fill(p3)
        ctx.restore()
      }

      const createPlaceholderTexture = (number: number, color: string, isCover = false, isBack = false) => {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 768
        const ctx = canvas.getContext("2d")
        if (!ctx) return new THREE.CanvasTexture(canvas)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        
        if (isBack) {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }

        ctx.fillStyle = color
        ctx.fillRect(0, 0, 512, 768)
        if (isCover) {
          ctx.fillStyle = "black"
          drawLogo(ctx, 256 - (96 * 1.5) / 2, 100, 1.5)
          ctx.font = "30px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.fillText("2025", 256, 360)
          ctx.font = "bold 16px Helvetica, Arial"
          ctx.fillText("LIMITED EDITION", 256, 600)
        } else {
          ctx.fillStyle = "#333"
          ctx.font = "bold 140px Helvetica, Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(number.toString(), 256, 384)
        }
        const spineGradient = ctx.createLinearGradient(0, 0, 40, 0)
        spineGradient.addColorStop(0, "rgba(0,0,0,0.15)")
        spineGradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = spineGradient
        ctx.fillRect(0, 0, 512, 768)
        const imageData = ctx.getImageData(0, 0, 512, 768)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 5
          data[i] += noise
          data[i + 1] += noise
          data[i + 2] += noise
        }
        ctx.putImageData(imageData, 0, 0)
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

        constructor(index: number) {
          this.index = index
          this.group = new THREE.Group()
          this.zOffset = -index * 0.02
          this.group.position.z = this.zOffset
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
          const imgIndexFront = (index * 2) % imageUrls.length
          const imgIndexBack = (index * 2 + 1) % imageUrls.length
          const frontImgUrl = imageUrls[imgIndexFront]
          const backImgUrl = imageUrls[imgIndexBack]
          const isCover = index === 0
          const isBackCover = index === config.pageCount - 1
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

          const handleTextureLoad = (tex: THREE.Texture, mat: THREE.MeshPhysicalMaterial, isBack = false) => {
            const canvas = document.createElement("canvas")
            canvas.width = 1024
            canvas.height = 1536
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            
            if (isBack) {
              ctx.translate(canvas.width, 0)
              ctx.scale(-1, 1)
            }

            ctx.fillStyle = "#fff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            const pageAspect = config.pageWidth / config.pageHeight
            const image = tex.image as any
            const imgW = image?.width || 1024
            const imgH = image?.height || 1024
            const safeH = imgH === 0 ? 1 : imgH
            const imgAspect = imgW / safeH
            if (imgAspect > pageAspect) {
              const drawW = canvas.height * imgAspect
              ctx.drawImage(image, (canvas.width - drawW) / 2, 0, drawW, canvas.height)
            } else {
              const drawH = canvas.width / imgAspect
              ctx.drawImage(image, 0, (canvas.height - drawH) / 2, canvas.width, drawH)
            }
            const newTex = new THREE.CanvasTexture(canvas)
            newTex.colorSpace = THREE.SRGBColorSpace
            mat.map = newTex
            mat.needsUpdate = true
          }

          if (frontImgUrl) {
            textureLoader.load(frontImgUrl, (tex) => {
              handleTextureLoad(tex, matFront, false)
              checkLoading()
            }, undefined, () => checkLoading())
          } else { checkLoading() }

          if (backImgUrl) {
            textureLoader.load(backImgUrl, (tex) => {
              handleTextureLoad(tex, matBack, true)
              if (isBackCover) {
                const canvas = matBack.map?.image as HTMLCanvasElement
                if (canvas?.getContext) {
                  const ctx = canvas.getContext("2d")
                  if (ctx) drawLogo(ctx, canvas.width / 2 - (96 * 2) / 2, 150, 2)
                  matBack.map!.needsUpdate = true
                }
              }
              checkLoading()
            }, undefined, () => checkLoading())
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
        pagesRef.current.forEach((page, i) => {
          const pageState = Math.max(0, Math.min(1, pagesToFlip - i))
          page.updateCurl(pageState)

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
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener("resize", handleResize)

      cleanup = () => {
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
