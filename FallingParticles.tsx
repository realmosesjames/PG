/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 600
 */

import React, {
    useRef,
    useEffect,
    useCallback,
    useMemo,
    useState,
} from "react"
import { addPropertyControls, ControlType } from "framer"

// ─── Presets ─────────────────────────────────────────────────────────────────

interface PresetEntry {
    emojis: string[]
    gravity: number
    windX: number
    windVariance: number
    speedMin: number
    speedMax: number
    rotationSpeed: number
    driftAmount: number
}

const PRESET_MAP: Record<string, PresetEntry> = {
    snow:         { emojis: ["❄️","🌨","❅","❆","✦"],          gravity:0.03, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.3, driftAmount:0.8 },
    leaves:       { emojis: ["🍂","🍁","🍃","🌿"],             gravity:0.05, windX:0.2,  windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:1.2 },
    confetti:     { emojis: ["🎊","🎉","🎈","✨","⭐"],         gravity:0.08, windX:0,    windVariance:0.5, speedMin:1,   speedMax:4,   rotationSpeed:3,   driftAmount:0.5 },
    hearts:       { emojis: ["❤️","🧡","💛","💚","💙","💜","🩷"], gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.5, speedMax:1.5, rotationSpeed:0.5, driftAmount:1.5 },
    stars:        { emojis: ["⭐","🌟","✨","💫","🌠"],          gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:2,   driftAmount:0.6 },
    cherryBlossom:{ emojis: ["🌸","🌺","🌹","🏵️"],             gravity:0.03, windX:0.15, windVariance:0.3, speedMin:0.5, speedMax:1.5, rotationSpeed:0.8, driftAmount:1.0 },
    money:        { emojis: ["💵","💴","💶","💸","💰"],          gravity:0.07, windX:0,    windVariance:0.3, speedMin:1,   speedMax:3,   rotationSpeed:2,   driftAmount:0.4 },
    emoji:        { emojis: ["😀","🎯","🔥","💎","🎸"],          gravity:0.06, windX:0,    windVariance:0.4, speedMin:1,   speedMax:3,   rotationSpeed:2.5, driftAmount:0.7 },
    easter:       { emojis: ["🐣","🥚","🐇","🌷","🌸"],          gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:1,   driftAmount:1.2 },
    mothersDay:   { emojis: ["💐","🌷","🌹","❤️","💝"],          gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.5, speedMax:1.5, rotationSpeed:0.5, driftAmount:1.5 },
    halloween:    { emojis: ["🎃","👻","🕷️","🦇","🕸️"],         gravity:0.05, windX:0,    windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:0.8 },
    christmas:    { emojis: ["🎄","🎅","🎁","⭐","🦌"],           gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.8, driftAmount:0.9 },
    glitter:      { emojis: ["✨","💫","⭐","🌟","💎","🔮"],      gravity:0.03, windX:0,    windVariance:0.5, speedMin:0.3, speedMax:1.5, rotationSpeed:3,   driftAmount:2.0 },
    custom:       { emojis: [],                                   gravity:0.05, windX:0,    windVariance:0.3, speedMin:0.8, speedMax:2.5, rotationSpeed:1,   driftAmount:1.0 },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
    x: number; y: number
    vx: number; vy: number
    angle: number; angularVelocity: number
    scale: number; opacity: number
    emoji: string
    wobble: number; wobbleSpeed: number; wobbleAmplitude: number
    lifespan: number; age: number
    isBurst: boolean
    circleRadius: number; circleAngle: number; circleSpeed: number; circleBaseX: number
}

interface Props {
    // ── Default view ──────────────────────────────
    preset: string
    advanced: boolean
    preview: boolean
    particleCount: number
    background: string

    // ── Advanced: particle ─────────────────────────
    particleType: "emoji" | "image" | "color"
    customEmojis: string
    imageUrl: string          // fed by ControlType.Image
    particleColor: string
    particleShape: "circle" | "square"
    particleSize: number

    // ── Advanced: motion ───────────────────────────
    animationStyle: "falling" | "circular"
    direction: "down" | "up"

    // ── Advanced: physics ──────────────────────────
    gravity: number
    speedMin: number; speedMax: number
    wind: number; windVariance: number
    turbulence: number
    drift: number; rotation: number
    sizeVariance: number

    // ── Advanced: appearance ───────────────────────
    maxOpacity: number
    fadeIn: boolean; fadeOut: boolean
    spawnEdge: "top" | "random"

    // ── Advanced: interaction ──────────────────────
    clickInteraction: boolean; burstCount: number
    trigger: boolean; triggerCount: number

    // ── Advanced: schedule ─────────────────────────
    scheduleEnabled: boolean
    scheduleStartMonth: number; scheduleStartDay: number
    scheduleEndMonth: number;  scheduleEndDay: number

    style?: React.CSSProperties
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) { return min + Math.random() * (max - min) }

function resolveEmojis(p: Partial<Props>): string[] {
    if (p.preset === "custom") {
        const parsed = (p.customEmojis ?? "").split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
        return parsed.length > 0 ? parsed : PRESET_MAP.snow.emojis
    }
    return PRESET_MAP[p.preset ?? "snow"]?.emojis ?? PRESET_MAP.snow.emojis
}

function isWithinSchedule(enabled: boolean, sm: number, sd: number, em: number, ed: number): boolean {
    if (!enabled) return true
    const now = new Date()
    const cur  = (now.getMonth() + 1) * 100 + now.getDate()
    const start = sm * 100 + sd, end = em * 100 + ed
    return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end
}

function spawnParticle(
    canvasW: number, canvasH: number, emojis: string[],
    p: Partial<Props>, staggerY = false
): Particle {
    const preset   = PRESET_MAP[p.preset ?? "snow"] ?? PRESET_MAP.snow
    const goingUp  = p.direction === "up"
    const rawSpeed = rand(p.speedMin ?? preset.speedMin, p.speedMax ?? preset.speedMax)
    const vy       = goingUp ? -rawSpeed : rawSpeed
    const lifespan = Math.ceil((canvasH + 100) / rawSpeed) + rand(0, 60)

    const xPos = p.spawnEdge === "random" ? rand(0, canvasW) : rand(-40, canvasW + 40)
    const yPos = staggerY
        ? rand(goingUp ? 0 : -canvasH, goingUp ? canvasH * 1.5 : canvasH)
        : goingUp
        ? canvasH + (p.particleSize ?? 24) + rand(0, 40)
        : p.spawnEdge === "random"
        ? rand(-canvasH, canvasH)
        : -(p.particleSize ?? 24) - rand(0, 40)

    const isCircular = p.animationStyle === "circular"
    return {
        x: xPos, y: yPos,
        vx: (p.wind ?? preset.windX) + rand(-(p.windVariance ?? preset.windVariance), p.windVariance ?? preset.windVariance),
        vy,
        angle: rand(0, Math.PI * 2),
        angularVelocity: rand(-(p.rotation ?? preset.rotationSpeed), p.rotation ?? preset.rotationSpeed) * 0.05,
        scale: rand(1 - (p.sizeVariance ?? 0.5) * 0.5, 1 + (p.sizeVariance ?? 0.5) * 0.5),
        opacity: staggerY ? 1 : 0,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.02, 0.06),
        wobbleAmplitude: (p.drift ?? preset.driftAmount) * rand(0.5, 1.5),
        lifespan, age: staggerY ? rand(0, lifespan * 0.6) : 0,
        isBurst: false,
        circleRadius: isCircular ? rand(20, 60) : 0,
        circleAngle:  isCircular ? rand(0, Math.PI * 2) : 0,
        circleSpeed:  isCircular ? rand(0.03, 0.09) * (Math.random() < 0.5 ? 1 : -1) : 0,
        circleBaseX: xPos,
    }
}

function spawnBurstParticle(x: number, y: number, emojis: string[], p: Partial<Props>): Particle {
    const angle = rand(0, Math.PI * 2), speed = rand(2, 7)
    return {
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
        angle: rand(0, Math.PI * 2), angularVelocity: rand(-0.15, 0.15),
        scale: rand(0.8, 1.4), opacity: 1,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(0.04, 0.1), wobbleAmplitude: rand(0.5, 1.5),
        lifespan: rand(60, 120), age: 0, isBurst: true,
        circleRadius: 0, circleAngle: 0, circleSpeed: 0, circleBaseX: x,
    }
}

function updateParticle(particle: Particle, canvasW: number, canvasH: number, p: Props): void {
    const preset   = PRESET_MAP[p.preset] ?? PRESET_MAP.snow
    const gravDir  = p.direction === "up" ? -1 : 1
    particle.age++

    particle.vy    += (p.gravity ?? preset.gravity) * 0.5 * gravDir
    particle.angle += particle.angularVelocity

    // Turbulence — random per-frame velocity nudge
    if (p.turbulence > 0) {
        particle.vx += (Math.random() - 0.5) * p.turbulence
        particle.vy += (Math.random() - 0.5) * p.turbulence * 0.3
    }

    if (p.animationStyle === "circular" && !particle.isBurst) {
        particle.circleAngle  += particle.circleSpeed
        particle.circleBaseX  += particle.vx
        particle.x = particle.circleBaseX + Math.cos(particle.circleAngle) * particle.circleRadius
    } else {
        particle.wobble += particle.wobbleSpeed
        particle.x += particle.vx + Math.sin(particle.wobble) * particle.wobbleAmplitude
    }
    particle.y += particle.vy

    // Opacity envelope
    const maxOp      = p.maxOpacity ?? 1
    const fadeInEnd  = particle.lifespan * 0.1
    const fadeOutStart = particle.lifespan * 0.8
    if (p.fadeIn && particle.age < fadeInEnd) {
        particle.opacity = (particle.age / fadeInEnd) * maxOp
    } else if (p.fadeOut && particle.age > fadeOutStart) {
        particle.opacity = ((particle.lifespan - particle.age) / (particle.lifespan - fadeOutStart)) * maxOp
    } else {
        particle.opacity = maxOp
    }
    particle.opacity = Math.max(0, Math.min(1, particle.opacity))
}

function drawParticle(
    ctx: CanvasRenderingContext2D, particle: Particle,
    size: number, pType: "emoji" | "image" | "color",
    img: HTMLImageElement | null, imgSize: number,
    color: string, shape: "circle" | "square"
): void {
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.angle)
    ctx.scale(particle.scale, particle.scale)

    if (pType === "image" && img?.complete && img.naturalWidth > 0) {
        const half = imgSize / 2
        ctx.drawImage(img, -half, -half, imgSize, imgSize)
    } else if (pType === "color") {
        ctx.fillStyle = color || "#ffffff"
        const r = size * 0.4
        if (shape === "square") {
            ctx.fillRect(-r, -r, r * 2, r * 2)
        } else {
            ctx.beginPath()
            ctx.arc(0, 0, r, 0, Math.PI * 2)
            ctx.fill()
        }
    } else {
        ctx.font = `${size}px serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(particle.emoji, 0, 0)
    }
    ctx.restore()
}

function isOffScreen(
    particle: Particle, canvasW: number, canvasH: number,
    animStyle: "falling" | "circular", dir: "down" | "up"
): boolean {
    const refX = animStyle === "circular" && !particle.isBurst ? particle.circleBaseX : particle.x
    const offVert = dir === "up" ? particle.y < -80 : particle.y > canvasH + 80
    return offVert || refX < -180 || refX > canvasW + 180 || particle.age >= particle.lifespan
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 600
 */
export default function FallingParticles(props: Props) {
    const {
        preview, background,
        particleType, imageUrl, particleColor, particleShape, particleSize,
        animationStyle, direction,
        particleCount, preset, customEmojis,
        clickInteraction, burstCount,
        trigger, triggerCount,
        scheduleEnabled, scheduleStartMonth, scheduleStartDay,
        scheduleEndMonth, scheduleEndDay,
        style,
    } = props

    const canvasRef      = useRef<HTMLCanvasElement>(null)
    const particlesRef   = useRef<Particle[]>([])
    const rafRef         = useRef<number>(0)
    const propsRef       = useRef<Props>(props)
    const imageRef       = useRef<HTMLImageElement | null>(null)
    const prevTriggerRef = useRef<boolean>(false)

    const [imageStatus, setImageStatus] = useState<"idle"|"loading"|"loaded"|"error">("idle")

    propsRef.current = props

    // Image loading
    useEffect(() => {
        if (particleType !== "image" || !imageUrl) {
            imageRef.current = null
            setImageStatus("idle")
            return
        }
        setImageStatus("loading")
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload  = () => { imageRef.current = img; setImageStatus("loaded") }
        img.onerror = () => { imageRef.current = null; setImageStatus("error") }
        img.src = imageUrl
    }, [particleType, imageUrl])

    // Wired trigger — fires on rising edge
    useEffect(() => {
        if (trigger && !prevTriggerRef.current) {
            const canvas = canvasRef.current
            if (canvas) {
                const rect = canvas.getBoundingClientRect()
                const p    = propsRef.current
                const emojis = resolveEmojis(p)
                particlesRef.current.push(
                    ...Array.from({ length: p.triggerCount ?? 60 }, () =>
                        spawnBurstParticle(rand(0, rect.width), rand(0, rect.height * 0.4), emojis, p)
                    )
                )
            }
        }
        prevTriggerRef.current = trigger
    }, [trigger])

    const scheduled = useMemo(
        () => isWithinSchedule(scheduleEnabled, scheduleStartMonth, scheduleStartDay, scheduleEndMonth, scheduleEndDay),
        [scheduleEnabled, scheduleStartMonth, scheduleStartDay, scheduleEndMonth, scheduleEndDay]
    )

    // Main RAF loop
    useEffect(() => {
        if (!preview || !scheduled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const syncSize = (): { cssW: number; cssH: number; dpr: number } => {
            const rect = canvas.getBoundingClientRect()
            const dpr  = window.devicePixelRatio || 1
            const cssW = Math.round(rect.width)  || 1
            const cssH = Math.round(rect.height) || 1
            const physW = Math.round(rect.width  * dpr) || 1
            const physH = Math.round(rect.height * dpr) || 1
            if (canvas.width !== physW || canvas.height !== physH) {
                canvas.width = physW; canvas.height = physH
            }
            return { cssW, cssH, dpr }
        }

        const { cssW: initW, cssH: initH } = syncSize()
        particlesRef.current = Array.from({ length: particleCount }, () =>
            spawnParticle(initW, initH, resolveEmojis(props), props, true)
        )

        function tick() {
            const { cssW, cssH, dpr } = syncSize()
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx!.clearRect(0, 0, cssW, cssH)

            const p        = propsRef.current
            const safeEmojis = resolveEmojis(p)
            const aStyle   = p.animationStyle ?? "falling"
            const dir      = p.direction ?? "down"
            const pType    = p.particleType ?? "emoji"
            const img      = imageRef.current
            const imgSize  = p.particleSize ?? 40
            const color    = p.particleColor ?? "#ffffff"
            const shape    = p.particleShape ?? "circle"
            const size     = p.particleSize ?? 24

            const pool = particlesRef.current
            for (let i = 0; i < pool.length; i++) {
                updateParticle(pool[i], cssW, cssH, p)
                drawParticle(ctx!, pool[i], size, pType, img, imgSize, color, shape)
                if (isOffScreen(pool[i], cssW, cssH, aStyle, dir) && !pool[i].isBurst) {
                    Object.assign(pool[i], spawnParticle(cssW, cssH, safeEmojis, p, false))
                }
            }
            particlesRef.current = pool.filter(pt => !(pt.isBurst && isOffScreen(pt, cssW, cssH, aStyle, dir)))
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => { cancelAnimationFrame(rafRef.current) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [particleCount, preset, customEmojis, animationStyle, direction, particleType, preview, scheduled])

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!clickInteraction) return
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const p = propsRef.current
        particlesRef.current.push(
            ...Array.from({ length: burstCount ?? 20 }, () =>
                spawnBurstParticle(e.clientX - rect.left, e.clientY - rect.top, resolveEmojis(p), p)
            )
        )
    }, [clickInteraction, burstCount])

    return (
        <div style={{ width:"100%", height:"100%", position:"relative", overflow:"hidden", background: background || "transparent", ...style }}>
            {preview && scheduled && (
                <canvas
                    ref={canvasRef}
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents: clickInteraction ? "auto" : "none" }}
                    onClick={handleClick}
                />
            )}
            {particleType === "image" && imageStatus === "error" && (
                <div style={{ position:"absolute", bottom:8, left:8, right:8, background:"rgba(220,53,53,0.92)", color:"#fff", padding:"6px 10px", borderRadius:6, fontSize:11, lineHeight:1.4, pointerEvents:"none", zIndex:10 }}>
                    ⚠️ Image failed to load — check the URL or try re-uploading.
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

const adv = (props: Partial<Props>) => !props.advanced

addPropertyControls(FallingParticles, {

    // ── Default view ──────────────────────────────────────────────────────────
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "snow",
        options: ["snow","leaves","confetti","hearts","stars","cherryBlossom","money","emoji","easter","mothersDay","halloween","christmas","glitter","custom"],
        optionTitles: ["❄️ Snow","🍂 Leaves","🎊 Confetti","❤️ Hearts","⭐ Stars","🌸 Cherry Blossom","💵 Money","😀 Emoji Mix","🐣 Easter","💐 Mother's Day","🎃 Halloween","🎄 Christmas","✨ Glitter","🎨 Custom"],
        hidden: (props) => props.advanced,
    },
    advanced: {
        type: ControlType.Boolean,
        title: "Custom",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Count",
        defaultValue: 80,
        min: 5, max: 400, step: 5,
        displayStepper: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },

    // ── Advanced: Particle ────────────────────────────────────────────────────
    particleType: {
        type: ControlType.Enum,
        title: "Use",
        defaultValue: "emoji",
        options: ["emoji","image","color"],
        optionTitles: ["Emoji","Image / Logo","Color"],
        hidden: adv,
    },
    customEmojis: {
        type: ControlType.String,
        title: "Emojis",
        defaultValue: "🎯 🔥 💎 🎸 🌈",
        placeholder: "Space-separated emojis",
        hidden: (props) => adv(props) || props.particleType !== "emoji" || props.preset !== "custom",
    },
    imageUrl: {
        type: ControlType.Image,
        title: "Image / Logo",
        hidden: (props) => adv(props) || props.particleType !== "image",
    },
    particleColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ffffff",
        hidden: (props) => adv(props) || props.particleType !== "color",
    },
    particleShape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "circle",
        options: ["circle","square"],
        optionTitles: ["Circle","Square"],
        hidden: (props) => adv(props) || props.particleType !== "color",
    },
    particleSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 24,
        min: 8, max: 80, step: 1, unit: "px",
        displayStepper: true,
        hidden: adv,
    },

    // ── Advanced: Motion ──────────────────────────────────────────────────────
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "falling",
        options: ["falling","circular"],
        optionTitles: ["Falling","Circular"],
        hidden: adv,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "down",
        options: ["down","up"],
        optionTitles: ["Down","Up"],
        hidden: adv,
    },
    spawnEdge: {
        type: ControlType.Enum,
        title: "Spawn From",
        defaultValue: "top",
        options: ["top","random"],
        optionTitles: ["Top Edge","Random"],
        hidden: (props) => adv(props) || props.direction === "up",
    },

    // ── Advanced: Physics ─────────────────────────────────────────────────────
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 0.05,
        min: 0, max: 1, step: 0.01,
        hidden: adv,
    },
    speedMin: {
        type: ControlType.Number,
        title: "Speed Min",
        defaultValue: 0.8,
        min: 0.1, max: 10, step: 0.1,
        hidden: adv,
    },
    speedMax: {
        type: ControlType.Number,
        title: "Speed Max",
        defaultValue: 2.5,
        min: 0.1, max: 10, step: 0.1,
        hidden: adv,
    },
    wind: {
        type: ControlType.Number,
        title: "Wind",
        defaultValue: 0,
        min: -3, max: 3, step: 0.05,
        hidden: adv,
    },
    windVariance: {
        type: ControlType.Number,
        title: "Wind Variance",
        defaultValue: 0.3,
        min: 0, max: 2, step: 0.05,
        hidden: adv,
    },
    turbulence: {
        type: ControlType.Number,
        title: "Turbulence",
        defaultValue: 0.1,
        min: 0, max: 1, step: 0.01,
        hidden: adv,
    },
    drift: {
        type: ControlType.Number,
        title: "Drift / Wobble",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        hidden: adv,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        hidden: adv,
    },
    sizeVariance: {
        type: ControlType.Number,
        title: "Size Variance",
        defaultValue: 0.5,
        min: 0, max: 1, step: 0.05,
        hidden: adv,
    },

    // ── Advanced: Appearance ──────────────────────────────────────────────────
    maxOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1.0,
        min: 0.1, max: 1.0, step: 0.05,
        hidden: adv,
    },
    fadeIn: {
        type: ControlType.Boolean,
        title: "Fade In",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    fadeOut: {
        type: ControlType.Boolean,
        title: "Fade Out",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },

    // ── Advanced: Interaction ─────────────────────────────────────────────────
    clickInteraction: {
        type: ControlType.Boolean,
        title: "Click Burst",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    burstCount: {
        type: ControlType.Number,
        title: "Burst Amount",
        defaultValue: 20,
        min: 5, max: 100, step: 5,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.clickInteraction,
    },
    trigger: {
        type: ControlType.Boolean,
        title: "Trigger",
        defaultValue: false,
        enabledTitle: "Fire", disabledTitle: "Ready",
        hidden: adv,
    },
    triggerCount: {
        type: ControlType.Number,
        title: "Trigger Count",
        defaultValue: 60,
        min: 10, max: 300, step: 10,
        displayStepper: true,
        hidden: adv,
    },

    // ── Advanced: Schedule ────────────────────────────────────────────────────
    scheduleEnabled: {
        type: ControlType.Boolean,
        title: "Date Schedule",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    scheduleStartMonth: {
        type: ControlType.Number,
        title: "Start Month",
        defaultValue: 12,
        min: 1, max: 12, step: 1,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleStartDay: {
        type: ControlType.Number,
        title: "Start Day",
        defaultValue: 1,
        min: 1, max: 31, step: 1,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleEndMonth: {
        type: ControlType.Number,
        title: "End Month",
        defaultValue: 12,
        min: 1, max: 12, step: 1,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleEndDay: {
        type: ControlType.Number,
        title: "End Day",
        defaultValue: 31,
        min: 1, max: 31, step: 1,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
})
