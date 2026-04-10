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
    christmas:    { emojis: ["🎄","🎅","🎁","❄️","⭐","🦌","🔔","🧦","🍪"],  gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.8, driftAmount:0.9 },
    newYear:      { emojis: ["🎆","🎇","✨","🥂","🎊","🎉","🍾","💫","🌟"],  gravity:0.06, windX:0,    windVariance:0.5, speedMin:1,   speedMax:3,   rotationSpeed:2.5, driftAmount:0.8 },
    valentines:   { emojis: ["❤️","🩷","💕","💝","🌹","💘","🫶","💌","🍫"],  gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.5, speedMax:1.5, rotationSpeed:0.5, driftAmount:1.5 },
    stPatricks:   { emojis: ["🍀","☘️","🌈","🎩","🪄","🟢","🍺","🌿"],      gravity:0.04, windX:0.1,  windVariance:0.3, speedMin:0.8, speedMax:2,   rotationSpeed:1.2, driftAmount:1.1 },
    easter:       { emojis: ["🐣","🥚","🐇","🌷","🌸","🐰","🌻","🦋"],      gravity:0.04, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:1,   driftAmount:1.2 },
    ramadan:      { emojis: ["🌙","⭐","✨","🕌","🪔","💫","🌠","🏮"],       gravity:0.02, windX:0,    windVariance:0.2, speedMin:0.3, speedMax:1.5, rotationSpeed:0.8, driftAmount:1.0 },
    halloween:    { emojis: ["🎃","👻","🕷️","🦇","🕸️","💀","🍬","🧙","😈"], gravity:0.05, windX:0,    windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:0.8 },
    thanksgiving: { emojis: ["🍂","🍁","🦃","🥧","🌽","🍎","🍇","🌾"],      gravity:0.05, windX:0.15, windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:1.2 },
    blackFriday:  { emojis: ["🛍️","🏷️","💳","🛒","💸","💰","🎁","🔖"],     gravity:0.07, windX:0,    windVariance:0.3, speedMin:1,   speedMax:3,   rotationSpeed:2,   driftAmount:0.5 },
    winter:       { emojis: ["❄️","🌨","⛄","🧊","❅","✦","🌬️","🏔️"],      gravity:0.03, windX:0,    windVariance:0.3, speedMin:0.5, speedMax:2,   rotationSpeed:0.3, driftAmount:0.8 },
    autumn:       { emojis: ["🍂","🍁","🍃","🌿","🌾","🍄","🎃","🌰"],      gravity:0.05, windX:0.2,  windVariance:0.4, speedMin:0.8, speedMax:2.5, rotationSpeed:1.5, driftAmount:1.2 },
    confetti:     { emojis: ["🎊","🎉","🎈","✨","⭐","🎀","🎁","🪅","🎏"],  gravity:0.08, windX:0,    windVariance:0.5, speedMin:1,   speedMax:4,   rotationSpeed:3,   driftAmount:0.5 },
    glitter:      { emojis: ["✨","💫","⭐","🌟","💎","🔮","🪩","💠","🔷"],  gravity:0.03, windX:0,    windVariance:0.5, speedMin:0.3, speedMax:1.5, rotationSpeed:3,   driftAmount:2.0 },
    fireworks:    { emojis: ["🎆","🎇","💥","✨","⭐","🌟","💫","🔴","🟡"],  gravity:0.04, windX:0,    windVariance:0.4, speedMin:1,   speedMax:4,   rotationSpeed:3,   driftAmount:0.6 },
    custom:       { emojis: [],                                                gravity:0.05, windX:0,    windVariance:0.3, speedMin:0.8, speedMax:2.5, rotationSpeed:1,   driftAmount:1.0 },
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
    particleShape: "circle" | "square"
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

function resolveEmojis(p: Partial<Props>): string[] {
    if (p.preset === "custom") {
        const parsed = (p.customEmojis ?? "").split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
        return parsed.length > 0 ? parsed : PRESET_MAP.winter.emojis
    }
    return PRESET_MAP[p.preset ?? "winter"]?.emojis ?? PRESET_MAP.winter.emojis
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

function drawParticle(
    ctx: CanvasRenderingContext2D, particle: Particle,
    pType: "emoji" | "image" | "color",
    img: HTMLImageElement | null,
    color: string, shape: "circle" | "square"
): void {
    const size = particle.size
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.angle)
    ctx.scale(particle.scale, particle.scale)

    if (pType === "image" && img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size)
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
    const refX    = animStyle === "circular" && !particle.isBurst ? particle.circleBaseX : particle.x
    const offVert = dir === "up" ? particle.y < -80 : particle.y > canvasH + 80
    return offVert || refX < -180 || refX > canvasW + 180 || particle.age >= particle.lifespan
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FallingParticles(props: Props) {
    const {
        preview, background,
        particleType, imageUrl, particleColor, particleShape,
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
    const prevTriggerRef = useRef<boolean>(false)
    const pausedRef      = useRef<boolean>(false)

    const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle")

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

            const p      = propsRef.current
            const emojis = resolveEmojis(p)
            const aStyle = p.animationStyle ?? "falling"
            const dir    = p.direction     ?? "down"
            const pType  = p.particleType  ?? "emoji"
            const img    = imageRef.current
            const color  = p.particleColor ?? "#ffffff"
            const shape  = p.particleShape ?? "circle"

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
        hidden: (props) => !!props.advanced,
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
        optionTitles: ["Emoji","Image / Logo","Color Shapes"],
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
    sizeMin: {
        type: ControlType.Number,
        title: "Size Min",
        defaultValue: 12,
        min: 4, max: 100, step: 1, unit: "px",
        displayStepper: true,
        hidden: adv,
    },
    sizeMax: {
        type: ControlType.Number,
        title: "Size Max",
        defaultValue: 40,
        min: 4, max: 100, step: 1, unit: "px",
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

    // ── Advanced: Circular ────────────────────────────────────────────────────
    circleRadiusMin: {
        type: ControlType.Number,
        title: "Radius Min",
        defaultValue: 20,
        min: 5, max: 120, step: 5,
        displayStepper: true,
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },
    circleRadiusMax: {
        type: ControlType.Number,
        title: "Radius Max",
        defaultValue: 60,
        min: 5, max: 120, step: 5,
        displayStepper: true,
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },
    circleSpeedScale: {
        type: ControlType.Number,
        title: "Circle Speed",
        defaultValue: 1,
        min: 0.2, max: 3, step: 0.1,
        hidden: (props) => adv(props) || props.animationStyle !== "circular",
    },

    // ── Advanced: Physics ─────────────────────────────────────────────────────
    realisticPhysics: {
        type: ControlType.Boolean,
        title: "Realistic",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
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
    windSpeed: {
        type: ControlType.Number,
        title: "Wind Speed",
        defaultValue: 0,
        min: 0, max: 5, step: 0.05,
        hidden: adv,
    },
    windDirection: {
        type: ControlType.Number,
        title: "Wind Dir",
        defaultValue: 90,
        min: 0, max: 360, step: 1, unit: "°",
        hidden: (props) => adv(props) || (props.windSpeed ?? 0) === 0,
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
    rotationEnabled: {
        type: ControlType.Boolean,
        title: "Rotation",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        hidden: (props) => adv(props) || !(props.rotationEnabled ?? true),
    },
    driftEnabled: {
        type: ControlType.Boolean,
        title: "Drift",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    drift: {
        type: ControlType.Number,
        title: "Drift Amount",
        defaultValue: 1.0,
        min: 0, max: 5, step: 0.1,
        hidden: (props) => adv(props) || !(props.driftEnabled ?? true),
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

    // ── Advanced: Visual Layers ───────────────────────────────────────────────
    backgroundEnabled: {
        type: ControlType.Boolean,
        title: "Blur Layer",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 8,
        min: 0, max: 40, step: 1, unit: "px",
        hidden: (props) => adv(props) || !props.backgroundEnabled,
    },
    overlayEnabled: {
        type: ControlType.Boolean,
        title: "Overlay",
        defaultValue: false,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
        hidden: (props) => adv(props) || !props.overlayEnabled,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 20,
        min: 0, max: 100, step: 1, unit: "%",
        hidden: (props) => adv(props) || !props.overlayEnabled,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
        min: 0, max: 99999, step: 1,
        hidden: adv,
    },

    // ── Advanced: Interaction ─────────────────────────────────────────────────
    clickInteraction: {
        type: ControlType.Boolean,
        title: "Click",
        defaultValue: true,
        enabledTitle: "On", disabledTitle: "Off",
        hidden: adv,
    },
    clickAction: {
        type: ControlType.Enum,
        title: "Click Action",
        defaultValue: "burst",
        options: ["burst","disappear","changeDirection"],
        optionTitles: ["Burst","Disappear","Change Direction"],
        hidden: (props) => adv(props) || !props.clickInteraction,
    },
    burstCount: {
        type: ControlType.Number,
        title: "Burst Amount",
        defaultValue: 20,
        min: 5, max: 100, step: 5,
        displayStepper: true,
        hidden: (props) => adv(props) || !props.clickInteraction || props.clickAction !== "burst",
    },
    burstSpeed: {
        type: ControlType.Number,
        title: "Burst Speed",
        defaultValue: 5,
        min: 1, max: 20, step: 0.5,
        hidden: (props) => adv(props) || !props.clickInteraction || props.clickAction !== "burst",
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
