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
    shape: string      // SVG shape used in preset mode
    color: string      // fill/stroke color used in preset mode
    emojis: string[]   // used in custom/emoji mode only
    gravity: number
    windX: number
    windVariance: number
    speedMin: number
    speedMax: number
    rotationSpeed: number
    driftAmount: number
}

const PRESET_MAP: Record<string, PresetEntry> = {
    christmas:    { shape:"snowflake", color:"#FFFFFF", emojis:[], gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.8, driftAmount:0.9 },
    newYear:      { shape:"firework",  color:"#FFD700", emojis:[], gravity:0.06, windX:0,    windVariance:0.5, speedMin:1,   speedMax:3,   rotationSpeed:2.5, driftAmount:0.8 },
    valentines:   { shape:"heart",     color:"#FF1493", emojis:[], gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.5, speedMax:1.5, rotationSpeed:0.5, driftAmount:1.5 },
    stPatricks:   { shape:"shamrock",  color:"#00C853", emojis:[], gravity:0.04, windX:0.1,  windVariance:0.3, speedMin:0.8, speedMax:2,   rotationSpeed:1.2, driftAmount:1.1 },
    easter:       { shape:"star",      color:"#FFB6C1", emojis:[], gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:1,   driftAmount:1.2 },
    ramadan:      { shape:"star",      color:"#FFD700", emojis:[], gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.3, speedMax:1.5, rotationSpeed:0.8, driftAmount:1.0 },
    halloween:    { shape:"leaf",      color:"#FF8C00", emojis:[], gravity:0.05, windX:0,    windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:0.8 },
    thanksgiving: { shape:"leaf",      color:"#D2691E", emojis:[], gravity:0.05, windX:0.15, windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:1.2 },
    blackFriday:  { shape:"confetti",  color:"#111111", emojis:[], gravity:0.07, windX:0,    windVariance:0.3, speedMin:1,   speedMax:3,   rotationSpeed:2,   driftAmount:0.5 },
    winter:       { shape:"snowflake", color:"#87CEEB", emojis:[], gravity:0.03, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.3, driftAmount:0.8 },
    autumn:       { shape:"leaf",      color:"#FF8C00", emojis:[], gravity:0.05, windX:0.2,  windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:1.2 },
    confetti:     { shape:"confetti",  color:"#FF69B4", emojis:[], gravity:0.08, windX:0,    windVariance:0.5, speedMin:1,   speedMax:4,   rotationSpeed:3,   driftAmount:0.5 },
    glitter:      { shape:"sparkle",   color:"#FFD700", emojis:[], gravity:0.03, windX:0,    windVariance:0.5, speedMin:0.3, speedMax:1.5, rotationSpeed:3,   driftAmount:2.0 },
    fireworks:    { shape:"firework",  color:"#FF4500", emojis:[], gravity:0.04, windX:0,    windVariance:0.4, speedMin:1,   speedMax:4,   rotationSpeed:3,   driftAmount:0.6 },
    custom:       { shape:"snowflake", color:"#ffffff", emojis:[], gravity:0.05, windX:0,    windVariance:0.3, speedMin:0.8, speedMax:2.5, rotationSpeed:1,   driftAmount:1.0 },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
    x: number; y: number
    vx: number; vy: number
    angle: number; angularVelocity: number
    size: number        // per-particle px size
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
    imageUrl: string
    particleColor: string
    particleShape: "snowflake" | "leaf" | "heart" | "star" | "confetti" | "sparkle" | "firework" | "shamrock" | "circle" | "square" | "custom"
    customSvg: string
    sizeMin: number
    sizeMax: number

    // ── Advanced: motion ───────────────────────────
    animationStyle: "falling" | "circular"
    direction: "down" | "up"

    // ── Advanced: physics ──────────────────────────
    gravity: number
    speedMin: number; speedMax: number
    windSpeed: number; windDirection: number; windVariance: number
    turbulence: number
    drift: number; rotation: number
    realisticPhysics: boolean
    rotationEnabled: boolean
    driftEnabled: boolean

    // ── Advanced: circular ─────────────────────────
    circleRadiusMin: number; circleRadiusMax: number
    circleSpeedScale: number

    // ── Advanced: appearance ───────────────────────
    maxOpacity: number
    fadeIn: boolean; fadeOut: boolean
    spawnEdge: "top" | "random"

    // ── Advanced: visual layers ────────────────────
    backgroundEnabled: boolean
    backdropBlur: number
    overlayEnabled: boolean
    overlayColor: string
    overlayOpacity: number
    zIndex: number

    // ── Advanced: interaction ──────────────────────
    clickInteraction: boolean
    clickAction: "burst" | "disappear" | "changeDirection"
    burstCount: number
    burstSpeed: number
    trigger: boolean; triggerCount: number

    // ── Advanced: schedule ─────────────────────────
    scheduleEnabled: boolean
    scheduleStartMonth: number; scheduleStartDay: number
    scheduleEndMonth: number;   scheduleEndDay: number

    style?: React.CSSProperties
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) { return min + Math.random() * (max - min) }

const DEFAULT_EMOJIS = ["❄️", "⭐", "✨", "🎉", "🌟"]

function resolveEmojis(p: Partial<Props>): string[] {
    if (p.preset === "custom") {
        const parsed = (p.customEmojis ?? "").split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
        return parsed.length > 0 ? parsed : DEFAULT_EMOJIS
    }
    const presetEmojis = PRESET_MAP[p.preset ?? "christmas"]?.emojis
    return presetEmojis && presetEmojis.length > 0 ? presetEmojis : DEFAULT_EMOJIS
}

function isWithinSchedule(enabled: boolean, sm: number, sd: number, em: number, ed: number): boolean {
    if (!enabled) return true
    const now   = new Date()
    const cur   = (now.getMonth() + 1) * 100 + now.getDate()
    const start = sm * 100 + sd, end = em * 100 + ed
    return start <= end ? cur >= start && cur <= end : cur >= start || cur <= end
}

function spawnParticle(
    canvasW: number, canvasH: number, emojis: string[],
    p: Partial<Props>, staggerY = false
): Particle {
    const preset   = PRESET_MAP[p.preset ?? "winter"] ?? PRESET_MAP.winter
    const goingUp  = p.direction === "up"

    // Per-particle size
    const sMin = p.sizeMin ?? 12, sMax = p.sizeMax ?? 40
    const size = rand(sMin, sMax)

    // Mass-based speed: larger particles fall faster
    const massMultiplier = (p.realisticPhysics ?? true)
        ? 0.7 + (size / (sMin + sMax)) * 0.6
        : 1.0

    const rawSpeed = rand(p.speedMin ?? preset.speedMin, p.speedMax ?? preset.speedMax) * massMultiplier
    const vy       = goingUp ? -rawSpeed : rawSpeed
    const lifespan = Math.ceil((canvasH + 100) / rawSpeed) + rand(0, 60)

    // Wind decomposed from speed + direction angle (0=up,90=right,180=down,270=left)
    const windRad  = ((p.windDirection ?? 90) * Math.PI) / 180
    const windBase = Math.sin(windRad) * (p.windSpeed ?? preset.windX)
    const windVar  = p.windVariance ?? preset.windVariance
    const vx = windBase + rand(-windVar, windVar)

    const xPos = p.spawnEdge === "random" ? rand(0, canvasW) : rand(-40, canvasW + 40)
    const yPos = staggerY
        ? rand(goingUp ? 0 : -canvasH, goingUp ? canvasH * 1.5 : canvasH)
        : goingUp
        ? canvasH + size + rand(0, 40)
        : p.spawnEdge === "random"
        ? rand(-canvasH, canvasH)
        : -size - rand(0, 40)

    const isCircular  = p.animationStyle === "circular"
    const rMin        = p.circleRadiusMin ?? 20
    const rMax        = p.circleRadiusMax ?? 60
    const cSpeedScale = p.circleSpeedScale ?? 1.0

    return {
        x: xPos, y: yPos, vx, vy,
        size,
        angle: rand(0, Math.PI * 2),
        angularVelocity: (p.rotationEnabled ?? true)
            ? rand(-(p.rotation ?? preset.rotationSpeed), p.rotation ?? preset.rotationSpeed) * 0.05
            : 0,
        scale: 1,
        opacity: staggerY ? 1 : 0,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.02, 0.06),
        wobbleAmplitude: (p.driftEnabled ?? true)
            ? (p.drift ?? preset.driftAmount) * rand(0.5, 1.5)
            : 0,
        lifespan, age: staggerY ? rand(0, lifespan * 0.6) : 0,
        isBurst: false,
        circleRadius: isCircular ? rand(rMin, rMax) : 0,
        circleAngle:  isCircular ? rand(0, Math.PI * 2) : 0,
        circleSpeed:  isCircular ? rand(0.03, 0.09) * cSpeedScale * (Math.random() < 0.5 ? 1 : -1) : 0,
        circleBaseX: xPos,
    }
}

function spawnBurstParticle(x: number, y: number, emojis: string[], p: Partial<Props>): Particle {
    const maxSpd  = p.burstSpeed ?? 5
    const angle   = rand(0, Math.PI * 2)
    const speed   = rand(maxSpd * 0.4, maxSpd)
    const size    = rand(p.sizeMin ?? 12, p.sizeMax ?? 40)
    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size,
        angle: rand(0, Math.PI * 2), angularVelocity: rand(-0.15, 0.15),
        scale: 1, opacity: 1,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(0.04, 0.1), wobbleAmplitude: rand(0.5, 1.5),
        lifespan: rand(60, 120), age: 0, isBurst: true,
        circleRadius: 0, circleAngle: 0, circleSpeed: 0, circleBaseX: x,
    }
}

function applyClickAction(
    canvasX: number, canvasY: number,
    p: Props,
    emojis: string[],
    particlesRef: React.MutableRefObject<Particle[]>
): void {
    const action     = p.clickAction ?? "burst"
    const burstCount = p.burstCount  ?? 20
    const pool       = particlesRef.current

    if (action === "burst") {
        pool.push(...Array.from({ length: burstCount }, () =>
            spawnBurstParticle(canvasX, canvasY, emojis, p)
        ))
        return
    }

    const HIT_RADIUS = 48  // px — affects particles within this radius
    for (const pt of pool) {
        if (pt.isBurst) continue
        const dx = pt.x - canvasX, dy = pt.y - canvasY
        if (Math.hypot(dx, dy) > HIT_RADIUS) continue
        if (action === "disappear") {
            pt.age = pt.lifespan
        } else if (action === "changeDirection") {
            pt.vy = -pt.vy
            pt.vx = -pt.vx
        }
    }
}

function updateParticle(particle: Particle, canvasW: number, canvasH: number, p: Props): void {
    const preset  = PRESET_MAP[p.preset] ?? PRESET_MAP.winter
    const gravDir = p.direction === "up" ? -1 : 1
    particle.age++

    particle.vy    += (p.gravity ?? preset.gravity) * 0.5 * gravDir
    particle.angle += particle.angularVelocity

    if (p.turbulence > 0) {
        particle.vx += (Math.random() - 0.5) * p.turbulence
        particle.vy += (Math.random() - 0.5) * p.turbulence * 0.3
    }

    if (p.animationStyle === "circular" && !particle.isBurst) {
        particle.circleAngle += particle.circleSpeed
        particle.circleBaseX += particle.vx
        particle.x = particle.circleBaseX + Math.cos(particle.circleAngle) * particle.circleRadius
    } else {
        particle.wobble += particle.wobbleSpeed
        particle.x += particle.vx + Math.sin(particle.wobble) * particle.wobbleAmplitude
    }
    particle.y += particle.vy

    const maxOp       = p.maxOpacity ?? 1
    const fadeInEnd   = particle.lifespan * 0.1
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

// ─── Default Icons ────────────────────────────────────────────────────────────

const defaultIcons: Record<string, (ctx: CanvasRenderingContext2D, r: number, color: string) => void> = {
    snowflake: (ctx, r, color) => {
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, r * 0.1); ctx.lineCap = "round"
        for (let i = 0; i < 6; i++) {
            ctx.save(); ctx.rotate(i * Math.PI / 3)
            ctx.beginPath()
            ctx.moveTo(0, -r); ctx.lineTo(0, r)
            ctx.moveTo(0, -r*0.6); ctx.lineTo(-r*0.28, -r*0.35)
            ctx.moveTo(0, -r*0.6); ctx.lineTo( r*0.28, -r*0.35)
            ctx.moveTo(0, -r*0.3); ctx.lineTo(-r*0.22, -r*0.05)
            ctx.moveTo(0, -r*0.3); ctx.lineTo( r*0.22, -r*0.05)
            ctx.stroke(); ctx.restore()
        }
    },
    leaf: (ctx, r, color) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(0, -r)
        ctx.bezierCurveTo( r*0.8, -r*0.5,  r*0.8,  r*0.5, 0,  r)
        ctx.bezierCurveTo(-r*0.8,  r*0.5, -r*0.8, -r*0.5, 0, -r)
        ctx.fill()
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = Math.max(0.5, r*0.07); ctx.lineCap = "round"
        ctx.beginPath(); ctx.moveTo(0, -r*0.75); ctx.lineTo(0, r*0.75); ctx.stroke()
    },
    heart: (ctx, r, color) => {
        ctx.fillStyle = color
        const w = r * 0.9
        ctx.beginPath()
        ctx.moveTo(0, r*0.6)
        ctx.bezierCurveTo( w,  r*0.2,  w, -r*0.5, 0, -r*0.1)
        ctx.bezierCurveTo(-w, -r*0.5, -w,  r*0.2, 0,  r*0.6)
        ctx.fill()
    },
    // Four-pointed star/sparkle
    star: (ctx, r, color) => {
        ctx.fillStyle = color
        ctx.beginPath()
        for (let i = 0; i < 4; i++) {
            const oa = i * Math.PI / 2 - Math.PI / 2
            const ia = oa + Math.PI / 4
            if (i === 0) ctx.moveTo(r*Math.cos(oa), r*Math.sin(oa))
            else         ctx.lineTo(r*Math.cos(oa), r*Math.sin(oa))
            ctx.lineTo(r*0.2*Math.cos(ia), r*0.2*Math.sin(ia))
        }
        ctx.closePath(); ctx.fill()
    },
    // Jagged confetti streamer
    confetti: (ctx, r, color) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(-r*0.3, -r)
        ctx.lineTo( r*0.3, -r*0.85)
        ctx.lineTo( r*0.5, -r*0.4)
        ctx.lineTo( r*0.2,  0)
        ctx.lineTo( r*0.5,  r*0.4)
        ctx.lineTo( r*0.3,  r*0.85)
        ctx.lineTo(-r*0.2,  r)
        ctx.lineTo(-r*0.5,  r*0.5)
        ctx.lineTo(-r*0.3,  0)
        ctx.lineTo(-r*0.5, -r*0.5)
        ctx.closePath(); ctx.fill()
    },
    // Cross-shaped sparkle with small stars at diagonals
    sparkle: (ctx, r, color) => {
        ctx.fillStyle = color
        ctx.beginPath()
        for (let i = 0; i < 4; i++) {
            const oa = i * Math.PI / 2 - Math.PI / 4
            const ia = oa + Math.PI / 4
            if (i === 0) ctx.moveTo(r*Math.cos(oa), r*Math.sin(oa))
            else         ctx.lineTo(r*Math.cos(oa), r*Math.sin(oa))
            ctx.lineTo(r*0.12*Math.cos(ia), r*0.12*Math.sin(ia))
        }
        ctx.closePath(); ctx.fill()
        const sd = r * 0.6, sr = r * 0.18
        for (let d = 0; d < 4; d++) {
            const ba = d * Math.PI / 2
            const cx = sd * Math.cos(ba), cy = sd * Math.sin(ba)
            ctx.beginPath()
            for (let i = 0; i < 4; i++) {
                const oa = i * Math.PI / 2 - Math.PI / 4
                const ia = oa + Math.PI / 4
                const x1 = cx + sr * Math.cos(oa), y1 = cy + sr * Math.sin(oa)
                const x2 = cx + sr * 0.2 * Math.cos(ia), y2 = cy + sr * 0.2 * Math.sin(ia)
                if (i === 0) ctx.moveTo(x1, y1)
                else         ctx.lineTo(x1, y1)
                ctx.lineTo(x2, y2)
            }
            ctx.closePath(); ctx.fill()
        }
    },
    firework: (ctx, r, color) => {
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, r*0.09); ctx.lineCap = "round"
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI * 2 / 8
            ctx.beginPath()
            ctx.moveTo(r*0.18*Math.cos(a), r*0.18*Math.sin(a))
            ctx.lineTo(r*Math.cos(a), r*Math.sin(a)); ctx.stroke()
        }
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r*0.18, 0, Math.PI*2); ctx.fill()
    },
    shamrock: (ctx, r, color) => {
        ctx.fillStyle = color
        const lr = r * 0.46
        for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2 / 3) - Math.PI / 2
            ctx.beginPath()
            ctx.arc(lr*0.75*Math.cos(a), lr*0.75*Math.sin(a), lr, 0, Math.PI*2)
            ctx.fill()
        }
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, r*0.1); ctx.lineCap = "round"
        ctx.beginPath(); ctx.moveTo(0, lr*0.4); ctx.lineTo(0, r); ctx.stroke()
    },
}

// ─── Draw Particle ────────────────────────────────────────────────────────────

function drawParticle(
    ctx: CanvasRenderingContext2D, particle: Particle,
    pType: "emoji" | "image" | "color",
    img: HTMLImageElement | null,
    color: string, shape: string
): void {
    const size = particle.size, r = size / 2
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.angle)
    ctx.scale(particle.scale, particle.scale)

    if (pType === "image" && img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -r, -r, size, size)
    } else if (pType === "color") {
        const drawFn = defaultIcons[shape]
        if (drawFn) {
            drawFn(ctx, r, color)
        } else if (shape === "custom") {
            if (img?.complete && img.naturalWidth > 0)
                ctx.drawImage(img, -r, -r, size, size)
            else { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,r*0.8,0,Math.PI*2); ctx.fill() }
        } else if (shape === "square") {
            ctx.fillStyle = color; ctx.fillRect(-r*0.8, -r*0.8, r*1.6, r*1.6)
        } else {
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0,0,r*0.8,0,Math.PI*2); ctx.fill()
        }
    } else if (particle.emoji) {
        ctx.font = `${size}px serif`
        ctx.textAlign = "center"; ctx.textBaseline = "middle"
        ctx.fillText(particle.emoji, 0, 0)
    }
    ctx.restore()
}

function isOffScreen(
    particle: Particle, canvasW: number, canvasH: number,
    animStyle: "falling" | "circular", dir: "down" | "up"
): boolean {
    const refX    = animStyle === "circular" && !particle.isBurst ? particle.circleBaseX : particle.x
    const offVert = dir === "up" ? particle.y < -80 : particle.y > canvasH + 80
    return offVert || refX < -180 || refX > canvasW + 180 || particle.age >= particle.lifespan
}

// ─── SVG Color Injection ──────────────────────────────────────────────────────

function injectSvgColor(svg: string, color: string): string {
    const style = `<style>* { fill: ${color} !important; stroke: ${color} !important; }</style>`
    return svg.replace(/(<svg\b[^>]*)>/, `$1>${style}`)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FallingParticles(props: Props) {
    const {
        preview, background,
        particleType, imageUrl, particleColor, particleShape, customSvg,
        animationStyle, direction,
        particleCount, preset, customEmojis,
        clickInteraction,
        trigger, triggerCount,
        scheduleEnabled, scheduleStartMonth, scheduleStartDay,
        scheduleEndMonth, scheduleEndDay,
        backgroundEnabled, backdropBlur,
        overlayEnabled, overlayColor, overlayOpacity,
        zIndex,
        style,
    } = props

    const canvasRef      = useRef<HTMLCanvasElement>(null)
    const particlesRef   = useRef<Particle[]>([])
    const rafRef         = useRef<number>(0)
    const propsRef       = useRef<Props>(props)
    const imageRef       = useRef<HTMLImageElement | null>(null)
    const svgImageRef    = useRef<HTMLImageElement | null>(null)
    const prevTriggerRef = useRef<boolean>(false)
    const pausedRef      = useRef<boolean>(false)

    const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")

    propsRef.current = props

    // Image loading (Image Flakes mode OR Color Flakes Custom upload)
    useEffect(() => {
        const needsImage = particleType === "image" || (particleType === "color" && particleShape === "custom")
        if (!needsImage || !imageUrl) {
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
    }, [particleType, particleShape, imageUrl])

    // Custom SVG paste → rasterised image (color injected)
    useEffect(() => {
        if (particleType !== "color" || particleShape !== "custom" || !customSvg?.trim()) {
            svgImageRef.current = null
            return
        }
        const colored = injectSvgColor(customSvg, particleColor ?? "#ffffff")
        const blob = new Blob([colored], { type: "image/svg+xml;charset=utf-8" })
        const url  = URL.createObjectURL(blob)
        const img  = new Image()
        img.onload  = () => { svgImageRef.current = img; URL.revokeObjectURL(url) }
        img.onerror = () => { svgImageRef.current = null; URL.revokeObjectURL(url) }
        img.src = url
    }, [particleType, particleShape, customSvg, particleColor])

    // Wired trigger — fires on rising edge (false → true)
    useEffect(() => {
        if (trigger && !prevTriggerRef.current) {
            const canvas = canvasRef.current
            if (canvas) {
                const rect   = canvas.getBoundingClientRect()
                const p      = propsRef.current
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

    // Viewport detection — pause RAF when canvas is off-screen
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const obs = new IntersectionObserver(
            ([entry]) => { pausedRef.current = !entry.isIntersecting },
            { threshold: 0 }
        )
        obs.observe(canvas)
        return () => obs.disconnect()
    }, [preview, scheduled])

    // Main RAF loop
    useEffect(() => {
        if (!preview || !scheduled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const syncSize = (): { cssW: number; cssH: number; dpr: number } => {
            const rect  = canvas.getBoundingClientRect()
            const dpr   = window.devicePixelRatio || 1
            const cssW  = Math.round(rect.width)  || 1
            const cssH  = Math.round(rect.height) || 1
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
            if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return }

            const { cssW, cssH, dpr } = syncSize()
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx!.clearRect(0, 0, cssW, cssH)

            const p           = propsRef.current
            const presetEntry  = PRESET_MAP[p.preset ?? "christmas"] ?? PRESET_MAP.christmas
            const isPresetMode = !p.advanced
            const emojis = isPresetMode ? [] : resolveEmojis(p)
            const aStyle = p.animationStyle ?? "falling"
            const dir    = p.direction     ?? "down"
            const pType  = isPresetMode ? "color" : (p.particleType  ?? "emoji")
            const shape  = isPresetMode ? presetEntry.shape : (p.particleShape ?? "snowflake")
            const color  = isPresetMode ? presetEntry.color : (p.particleColor ?? "#ffffff")
            const img    = pType === "image"
                ? imageRef.current
                : (pType === "color" && shape === "custom")
                ? (imageRef.current ?? svgImageRef.current)
                : null

            const pool = particlesRef.current
            for (let i = 0; i < pool.length; i++) {
                updateParticle(pool[i], cssW, cssH, p)
                drawParticle(ctx!, pool[i], pType, img, color, shape)
                if (isOffScreen(pool[i], cssW, cssH, aStyle, dir) && !pool[i].isBurst) {
                    Object.assign(pool[i], spawnParticle(cssW, cssH, emojis, p, false))
                }
            }
            particlesRef.current = pool.filter(
                pt => !(pt.isBurst && isOffScreen(pt, cssW, cssH, aStyle, dir))
            )
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => { cancelAnimationFrame(rafRef.current) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [particleCount, preset, customEmojis, animationStyle, direction, particleType, preview, scheduled])

    // Shared interaction logic
    const handleInteraction = useCallback((canvasX: number, canvasY: number) => {
        if (!clickInteraction) return
        const p      = propsRef.current
        const emojis = resolveEmojis(p)
        applyClickAction(canvasX, canvasY, p, emojis, particlesRef)
    }, [clickInteraction])

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        handleInteraction(e.clientX - rect.left, e.clientY - rect.top)
    }, [handleInteraction])

    const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const rect = canvasRef.current!.getBoundingClientRect()
        const t    = e.changedTouches[0]
        handleInteraction(t.clientX - rect.left, t.clientY - rect.top)
    }, [handleInteraction])

    return (
        <div style={{
            width: "100%", height: "100%", position: "relative", overflow: "hidden",
            background: background || "transparent",
            zIndex: zIndex ?? undefined,
            ...style,
        }}>
            {/* Backdrop blur layer */}
            {backgroundEnabled && (
                <div style={{
                    position: "absolute", inset: 0,
                    backdropFilter: `blur(${backdropBlur ?? 8}px)`,
                    WebkitBackdropFilter: `blur(${backdropBlur ?? 8}px)`,
                    pointerEvents: "none",
                }} />
            )}

            {/* Particle canvas */}
            {preview && scheduled && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        pointerEvents: clickInteraction ? "auto" : "none",
                    }}
                    onClick={handleClick}
                    onTouchStart={handleTouch}
                />
            )}

            {/* Color overlay */}
            {overlayEnabled && (
                <div style={{
                    position: "absolute", inset: 0,
                    background: overlayColor ?? "#000000",
                    opacity: (overlayOpacity ?? 20) / 100,
                    pointerEvents: "none",
                }} />
            )}

            {/* Image CORS error banner */}
            {particleType === "image" && imageStatus === "error" && (
                <div style={{
                    position: "absolute", bottom: 8, left: 8, right: 8,
                    background: "rgba(220,53,53,0.92)", color: "#fff",
                    padding: "6px 10px", borderRadius: 6,
                    fontSize: 11, lineHeight: 1.4,
                    pointerEvents: "none", zIndex: 10,
                }}>
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
        defaultValue: "christmas",
        options: ["christmas","newYear","valentines","stPatricks","easter","ramadan","halloween","thanksgiving","blackFriday","winter","autumn","confetti","glitter","fireworks","custom"],
        optionTitles: ["🎄 Christmas","🎆 New Year","❤️ Valentine's Day","☘️ St. Patrick's","🐣 Easter","🌙 Ramadan","🎃 Halloween","🦃 Thanksgiving","🛍️ Black Friday","❄️ Winter","🍂 Autumn","🎊 Confetti","✨ Glitter","🎇 Fireworks","🎨 Custom"],
        description: "Choose a ready-made holiday theme. Each preset sets the right particles, speed, and physics automatically.",
        hidden: (props) => !!props.advanced,
    },
    advanced: {
        type: ControlType.Boolean,
        title: "Custom Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Switch to Custom mode to choose your own particle type, shape, physics, and more.",
    },
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Show or hide the particle effect in the editor canvas.",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Count",
        defaultValue: 80,
        min: 5, max: 400, step: 5,
        displayStepper: true,
        description: "Total number of particles on screen at once. Higher values are denser but use more CPU.",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
        description: "Optional solid or semi-transparent background color behind the particles.",
    },

    // ── Advanced: Particle ────────────────────────────────────────────────────
    particleType: {
        type: ControlType.Enum,
        title: "Particle Type",
        defaultValue: "emoji",
        options: ["emoji","image","color"],
        optionTitles: ["Emoji Flakes","Image / Logo","Color Flakes"],
        description: "Emoji Flakes: any emoji character. Image/Logo: upload a PNG or SVG. Color Flakes: filled vector shapes.",
        hidden: adv,
    },
    customEmojis: {
        type: ControlType.String,
        title: "Emojis",
        defaultValue: "🎯 🔥 💎 🎸 🌈",
        placeholder: "Space-separated emojis e.g. ❄️ ⭐ 🎁",
        description: "Space-separated emoji characters to use as particles.",
        hidden: (props) => adv(props) || props.particleType !== "emoji",
    },
    imageUrl: {
        type: ControlType.Image,
        title: "Upload Image",
        description: "Upload a PNG, JPG, or SVG file. Transparent PNGs and SVGs look best.",
        hidden: (props) => adv(props) || (props.particleType !== "image" && !(props.particleType === "color" && props.particleShape === "custom")),
    },
    particleColor: {
        type: ControlType.Color,
        title: "Flake Color",
        defaultValue: "#ffffff",
        description: "Fill color applied to all Color Flakes particles.",
        hidden: (props) => adv(props) || props.particleType !== "color",
    },
    particleShape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "snowflake",
        options: ["snowflake","leaf","heart","star","confetti","sparkle","firework","shamrock","circle","square","custom"],
        optionTitles: ["❄ Snowflake","🍃 Leaf","♥ Heart","★ Star","◆ Confetti","✦ Sparkle","✸ Firework","☘ Shamrock","● Circle","■ Square","Custom SVG"],
        description: "Choose one of 8 preset vector shapes, or select Custom SVG to use your own icon.",
        hidden: (props) => adv(props) || props.particleType !== "color",
    },
    customSvg: {
        type: ControlType.String,
        title: "SVG Code",
        placeholder: "Paste <svg>…</svg> markup here",
        displayTextArea: true,
        description: "Paste raw SVG markup to use as a custom particle shape. Use the Upload field above to upload an SVG file instead.",
        hidden: (props) => adv(props) || props.particleType !== "color" || props.particleShape !== "custom",
    },
    sizeMin: {
        type: ControlType.Number,
        title: "Size Min",
        defaultValue: 12,
        min: 4, max: 100, step: 1, unit: "px",
        displayStepper: true,
        description: "Smallest particle size. Each particle gets a random size between Min and Max.",
        hidden: adv,
    },
    sizeMax: {
        type: ControlType.Number,
        title: "Size Max",
        defaultValue: 40,
        min: 4, max: 100, step: 1, unit: "px",
        displayStepper: true,
        description: "Largest particle size. A wider range creates more natural variation.",
        hidden: adv,
    },

    // ── Advanced: Motion ──────────────────────────────────────────────────────
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "falling",
        options: ["falling","circular"],
        optionTitles: ["Falling","Circular"],
        description: "Falling: particles drift downward. Circular: particles orbit in arcs while drifting across the screen.",
        hidden: adv,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "down",
        options: ["down","up"],
        optionTitles: ["Down","Up"],
        description: "Down: particles fall from the top. Up: particles rise from the bottom (bubbles, balloons).",
        hidden: adv,
    },
    spawnEdge: {
        type: ControlType.Enum,
        title: "Spawn From",
        defaultValue: "top",
        options: ["top","random"],
        optionTitles: ["Top Edge","Random"],
        description: "Top Edge: particles always enter from the top. Random: particles can appear anywhere on screen.",
        hidden: (props) => adv(props) || props.direction === "up",
    },

    // ── Advanced: Circular ────────────────────────────────────────────────────
    circleRadiusMin: {
        type: ControlType.Number,
        title: "Radius Min",
        defaultValue: 20,
        min: 5, max: 120, step: 5,
        displayStepper: true,
        description: "Minimum orbit radius for Circular mode.",
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },
    circleRadiusMax: {
        type: ControlType.Number,
        title: "Radius Max",
        defaultValue: 60,
        min: 5, max: 120, step: 5,
        displayStepper: true,
        description: "Maximum orbit radius for Circular mode. A wider range creates more visual depth.",
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },
    circleSpeedScale: {
        type: ControlType.Number,
        title: "Circle Speed",
        defaultValue: 1,
        min: 0.2, max: 3, step: 0.1,
        description: "How fast particles orbit in Circular mode. 1 = default, 2 = double speed.",
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },

    // ── Advanced: Physics ─────────────────────────────────────────────────────
    realisticPhysics: {
        type: ControlType.Boolean,
        title: "Realistic",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "When On, larger particles fall faster due to simulated mass. When Off, all particles move at the same speed.",
        hidden: adv,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 0.05,
        min: 0, max: 1, step: 0.01,
        description: "Downward acceleration force. 0 = particles float, 1 = heavy fall like rain.",
        hidden: adv,
    },
    speedMin: {
        type: ControlType.Number,
        title: "Speed Min",
        defaultValue: 0.8,
        min: 0.1, max: 10, step: 0.1,
        description: "Minimum fall speed. Each particle gets a random speed between Min and Max.",
        hidden: adv,
    },
    speedMax: {
        type: ControlType.Number,
        title: "Speed Max",
        defaultValue: 2.5,
        min: 0.1, max: 10, step: 0.1,
        description: "Maximum fall speed. A wider range creates more natural variation.",
        hidden: adv,
    },
    windSpeed: {
        type: ControlType.Number,
        title: "Wind Speed",
        defaultValue: 0,
        min: 0, max: 5, step: 0.05,
        description: "Horizontal push force applied to all particles. 0 = no wind.",
        hidden: adv,
    },
    windDirection: {
        type: ControlType.Number,
        title: "Wind Dir",
        defaultValue: 90,
        min: 0, max: 360, step: 1, unit: "°",
        description: "Angle the wind blows toward. 0° = up, 90° = right, 180° = down, 270° = left.",
        hidden: (props) => adv(props) || (props.windSpeed ?? 0) === 0,
    },
    windVariance: {
        type: ControlType.Number,
        title: "Wind Variance",
        defaultValue: 0.3,
        min: 0, max: 2, step: 0.05,
        description: "Random variation added to wind per particle, creating a natural spread rather than uniform drift.",
        hidden: adv,
    },
    turbulence: {
        type: ControlType.Number,
        title: "Turbulence",
        defaultValue: 0.1,
        min: 0, max: 1, step: 0.01,
        description: "Random frame-by-frame nudge. Higher values create chaotic, gusty movement like real snow in wind.",
        hidden: adv,
    },
    rotationEnabled: {
        type: ControlType.Boolean,
        title: "Rotation",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Whether particles spin while moving. Each particle gets an independent rotation speed and direction.",
        hidden: adv,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        description: "How fast particles rotate. Higher = faster spin.",
        hidden: (props) => adv(props) || !(props.rotationEnabled ?? true),
    },
    driftEnabled: {
        type: ControlType.Boolean,
        title: "Drift",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Whether particles sway side-to-side as they fall, like leaves in a light breeze.",
        hidden: adv,
    },
    drift: {
        type: ControlType.Number,
        title: "Drift Amount",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        description: "How far particles sway left and right. 0 = straight fall, 5 = heavy swaying.",
        hidden: (props) => adv(props) || !(props.driftEnabled ?? true),
    },

    // ── Advanced: Appearance ──────────────────────────────────────────────────
    maxOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1.0,
        min: 0.1, max: 1.0, step: 0.05,
        description: "Maximum transparency of all particles. 1 = fully opaque, 0.1 = nearly invisible.",
        hidden: adv,
    },
    fadeIn: {
        type: ControlType.Boolean,
        title: "Fade In",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Particles fade in gently when they first spawn, avoiding a harsh pop-in effect.",
        hidden: adv,
    },
    fadeOut: {
        type: ControlType.Boolean,
        title: "Fade Out",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Particles fade out smoothly before they leave the screen.",
        hidden: adv,
    },

    // ── Advanced: Visual Layers ───────────────────────────────────────────────
    backgroundEnabled: {
        type: ControlType.Boolean,
        title: "Blur Layer",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Adds a frosted-glass backdrop blur layer behind the particles.",
        hidden: adv,
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 8,
        min: 0, max: 40, step: 1, unit: "px",
        description: "Strength of the backdrop blur. Higher values create a more frosted, diffused effect.",
        hidden: (props) => adv(props) || !props.backgroundEnabled,
    },
    overlayEnabled: {
        type: ControlType.Boolean,
        title: "Overlay",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Adds a semi-transparent color tint layer on top of everything.",
        hidden: adv,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
        description: "Color of the overlay tint.",
        hidden: (props) => adv(props) || !props.overlayEnabled,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 20,
        min: 0, max: 100, step: 1, unit: "%",
        description: "How opaque the overlay tint is. 0% = invisible, 100% = fully solid.",
        hidden: (props) => adv(props) || !props.overlayEnabled,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
        min: 0, max: 99999, step: 1,
        description: "CSS stacking order. 9999 places particles above most page content. Lower values place them behind content.",
        hidden: adv,
    },

    // ── Advanced: Interaction ─────────────────────────────────────────────────
    clickInteraction: {
        type: ControlType.Boolean,
        title: "Click Interaction",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Enable click and touch interactions on the canvas. Works on both mouse and mobile.",
        hidden: adv,
    },
    clickAction: {
        type: ControlType.Enum,
        title: "Click Action",
        defaultValue: "burst",
        options: ["burst","disappear","changeDirection"],
        optionTitles: ["Burst","Disappear","Change Direction"],
        description: "Burst: spawns new particles at the click point. Disappear: removes nearby particles. Change Direction: reverses their velocity.",
        hidden: (props) => adv(props) || !props.clickInteraction,
    },
    burstCount: {
        type: ControlType.Number,
        title: "Burst Amount",
        defaultValue: 20,
        min: 5, max: 100, step: 5,
        displayStepper: true,
        description: "Number of particles spawned per click in Burst mode.",
        hidden: (props) => adv(props) || !props.clickInteraction || props.clickAction !== "burst",
    },
    burstSpeed: {
        type: ControlType.Number,
        title: "Burst Speed",
        defaultValue: 5,
        min: 1, max: 20, step: 0.5,
        description: "How fast burst particles fly outward from the click point.",
        hidden: (props) => adv(props) || !props.clickInteraction || props.clickAction !== "burst",
    },
    trigger: {
        type: ControlType.Boolean,
        title: "Trigger",
        defaultValue: false,
        enabledTitle: "Fire", disabledTitle: "Ready",
        description: "Wire to a Framer variable or button. Each Off→On transition fires a particle burst.",
        hidden: adv,
    },
    triggerCount: {
        type: ControlType.Number,
        title: "Trigger Count",
        defaultValue: 60,
        min: 10, max: 300, step: 10,
        displayStepper: true,
        description: "Number of particles fired per trigger event.",
        hidden: adv,
    },

    // ── Advanced: Schedule ────────────────────────────────────────────────────
    scheduleEnabled: {
        type: ControlType.Boolean,
        title: "Date Schedule",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        description: "Only show the effect between the set start and end dates. Hides automatically outside that range.",
        hidden: adv,
    },
    scheduleStartMonth: {
        type: ControlType.Number,
        title: "Start Month",
        defaultValue: 12,
        min: 1, max: 12, step: 1,
        displayStepper: true,
        description: "Month the effect becomes visible (1 = January, 12 = December).",
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleStartDay: {
        type: ControlType.Number,
        title: "Start Day",
        defaultValue: 1,
        min: 1, max: 31, step: 1,
        displayStepper: true,
        description: "Day of the start month when the effect turns on.",
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleEndMonth: {
        type: ControlType.Number,
        title: "End Month",
        defaultValue: 12,
        min: 1, max: 12, step: 1,
        displayStepper: true,
        description: "Month the effect stops being visible.",
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
    scheduleEndDay: {
        type: ControlType.Number,
        title: "End Day",
        defaultValue: 31,
        min: 1, max: 31, step: 1,
        displayStepper: true,
        description: "Day of the end month when the effect turns off.",
        hidden: (props) => adv(props) || !props.scheduleEnabled,
    },
})
