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
} from "react"
import { addPropertyControls, ControlType } from "framer"

// ─── Presets ────────────────────────────────────────────────────────────────

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
    snow: {
        emojis: ["❄️", "🌨", "❅", "❆", "✦"],
        gravity: 0.03,
        windX: 0,
        windVariance: 0.3,
        speedMin: 0.5,
        speedMax: 2,
        rotationSpeed: 0.3,
        driftAmount: 0.8,
    },
    leaves: {
        emojis: ["🍂", "🍁", "🍃", "🌿"],
        gravity: 0.05,
        windX: 0.2,
        windVariance: 0.4,
        speedMin: 0.8,
        speedMax: 2.5,
        rotationSpeed: 1.5,
        driftAmount: 1.2,
    },
    confetti: {
        emojis: ["🎊", "🎉", "🎈", "✨", "⭐"],
        gravity: 0.08,
        windX: 0,
        windVariance: 0.5,
        speedMin: 1,
        speedMax: 4,
        rotationSpeed: 3,
        driftAmount: 0.5,
    },
    hearts: {
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🩷"],
        gravity: 0.02,
        windX: 0,
        windVariance: 0.2,
        speedMin: 0.5,
        speedMax: 1.5,
        rotationSpeed: 0.5,
        driftAmount: 1.5,
    },
    stars: {
        emojis: ["⭐", "🌟", "✨", "💫", "🌠"],
        gravity: 0.04,
        windX: 0,
        windVariance: 0.3,
        speedMin: 0.5,
        speedMax: 2,
        rotationSpeed: 2,
        driftAmount: 0.6,
    },
    cherryBlossom: {
        emojis: ["🌸", "🌺", "🌹", "🏵️"],
        gravity: 0.03,
        windX: 0.15,
        windVariance: 0.3,
        speedMin: 0.5,
        speedMax: 1.5,
        rotationSpeed: 0.8,
        driftAmount: 1.0,
    },
    money: {
        emojis: ["💵", "💴", "💶", "💸", "💰"],
        gravity: 0.07,
        windX: 0,
        windVariance: 0.3,
        speedMin: 1,
        speedMax: 3,
        rotationSpeed: 2,
        driftAmount: 0.4,
    },
    emoji: {
        emojis: ["😀", "🎯", "🔥", "💎", "🎸"],
        gravity: 0.06,
        windX: 0,
        windVariance: 0.4,
        speedMin: 1,
        speedMax: 3,
        rotationSpeed: 2.5,
        driftAmount: 0.7,
    },
    // ─ Holiday Presets ─
    easter: {
        emojis: ["🐣", "🥚", "🐇", "🌷", "🌸"],
        gravity: 0.04,
        windX: 0,
        windVariance: 0.3,
        speedMin: 0.5,
        speedMax: 2,
        rotationSpeed: 1,
        driftAmount: 1.2,
    },
    mothersDay: {
        emojis: ["💐", "🌷", "🌹", "❤️", "💝"],
        gravity: 0.02,
        windX: 0,
        windVariance: 0.2,
        speedMin: 0.5,
        speedMax: 1.5,
        rotationSpeed: 0.5,
        driftAmount: 1.5,
    },
    halloween: {
        emojis: ["🎃", "👻", "🕷️", "🦇", "🕸️"],
        gravity: 0.05,
        windX: 0,
        windVariance: 0.4,
        speedMin: 0.8,
        speedMax: 2.5,
        rotationSpeed: 1.5,
        driftAmount: 0.8,
    },
    christmas: {
        emojis: ["🎄", "🎅", "🎁", "⭐", "🦌"],
        gravity: 0.04,
        windX: 0,
        windVariance: 0.3,
        speedMin: 0.5,
        speedMax: 2,
        rotationSpeed: 0.8,
        driftAmount: 0.9,
    },
    glitter: {
        emojis: ["✨", "💫", "⭐", "🌟", "💎", "🔮"],
        gravity: 0.03,
        windX: 0,
        windVariance: 0.5,
        speedMin: 0.3,
        speedMax: 1.5,
        rotationSpeed: 3,
        driftAmount: 2.0,
    },
    custom: {
        emojis: [],
        gravity: 0.05,
        windX: 0,
        windVariance: 0.3,
        speedMin: 0.8,
        speedMax: 2.5,
        rotationSpeed: 1,
        driftAmount: 1.0,
    },
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    angle: number
    angularVelocity: number
    scale: number
    opacity: number
    emoji: string
    wobble: number
    wobbleSpeed: number
    wobbleAmplitude: number
    lifespan: number
    age: number
    isBurst: boolean
    // Circular animation
    circleRadius: number
    circleAngle: number
    circleSpeed: number
    circleBaseX: number
}

interface Props {
    // Particle type
    particleType: "emoji" | "image"
    imageUrl: string
    imageSize: number

    // Animation style
    animationStyle: "falling" | "circular"

    // Preset
    preset: string
    customEmojis: string

    // Particles
    particleCount: number
    fontSize: number
    sizeVariance: number

    // Physics
    gravity: number
    speedMin: number
    speedMax: number
    wind: number
    windVariance: number
    drift: number
    rotation: number

    // Appearance
    maxOpacity: number
    fadeIn: boolean
    fadeOut: boolean
    spawnEdge: "top" | "random"

    // Interaction
    clickInteraction: boolean
    burstCount: number

    // Scheduling
    scheduleEnabled: boolean
    scheduleStartMonth: number
    scheduleStartDay: number
    scheduleEndMonth: number
    scheduleEndDay: number

    style?: React.CSSProperties
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
    return min + Math.random() * (max - min)
}

function isWithinSchedule(
    enabled: boolean,
    startMonth: number,
    startDay: number,
    endMonth: number,
    endDay: number
): boolean {
    if (!enabled) return true
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const start = startMonth * 100 + startDay
    const end = endMonth * 100 + endDay
    const current = month * 100 + day
    if (start <= end) {
        return current >= start && current <= end
    }
    // Wraps year boundary (e.g. Dec 15 – Jan 5)
    return current >= start || current <= end
}

function spawnParticle(
    canvasW: number,
    canvasH: number,
    emojis: string[],
    p: Partial<Props>,
    staggerY = false
): Particle {
    const preset = PRESET_MAP[p.preset ?? "snow"] ?? PRESET_MAP.snow
    const vy = rand(p.speedMin ?? preset.speedMin, p.speedMax ?? preset.speedMax)
    const lifespan = Math.ceil((canvasH + 100) / vy) + rand(0, 60)

    const xPos =
        p.spawnEdge === "random"
            ? rand(0, canvasW)
            : rand(-40, canvasW + 40)
    const yPos = staggerY
        ? rand(-canvasH, canvasH)
        : p.spawnEdge === "random"
        ? rand(-canvasH, canvasH)
        : -(p.fontSize ?? 24) - rand(0, 40)

    const age = staggerY ? rand(0, lifespan * 0.8) : 0

    // Circular fields
    const isCircular = p.animationStyle === "circular"
    const circleRadius = isCircular ? rand(20, 60) : 0
    const circleAngle = isCircular ? rand(0, Math.PI * 2) : 0
    const circleSpeed = isCircular ? rand(0.03, 0.09) * (Math.random() < 0.5 ? 1 : -1) : 0

    return {
        x: xPos,
        y: yPos,
        vx:
            (p.wind ?? preset.windX) +
            rand(
                -(p.windVariance ?? preset.windVariance),
                p.windVariance ?? preset.windVariance
            ),
        vy,
        angle: rand(0, Math.PI * 2),
        angularVelocity:
            rand(-(p.rotation ?? preset.rotationSpeed), p.rotation ?? preset.rotationSpeed) *
            0.05,
        scale: rand(
            1 - (p.sizeVariance ?? 0.5) * 0.5,
            1 + (p.sizeVariance ?? 0.5) * 0.5
        ),
        opacity: age > 0 ? 1 : 0,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.02, 0.06),
        wobbleAmplitude:
            (p.drift ?? (PRESET_MAP[p.preset ?? "snow"]?.driftAmount ?? 1)) *
            rand(0.5, 1.5),
        lifespan,
        age,
        isBurst: false,
        circleRadius,
        circleAngle,
        circleSpeed,
        circleBaseX: xPos,
    }
}

function spawnBurstParticle(
    x: number,
    y: number,
    emojis: string[],
    p: Partial<Props>
): Particle {
    const angle = rand(0, Math.PI * 2)
    const speed = rand(2, 7)
    return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        angle: rand(0, Math.PI * 2),
        angularVelocity: rand(-0.15, 0.15),
        scale: rand(0.8, 1.4),
        opacity: 1,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        wobble: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.04, 0.1),
        wobbleAmplitude: rand(0.5, 1.5),
        lifespan: rand(60, 120),
        age: 0,
        isBurst: true,
        circleRadius: 0,
        circleAngle: 0,
        circleSpeed: 0,
        circleBaseX: x,
    }
}

function updateParticle(
    particle: Particle,
    canvasW: number,
    canvasH: number,
    p: Props
): void {
    const preset = PRESET_MAP[p.preset] ?? PRESET_MAP.snow
    particle.age++

    // Physics
    particle.vy += (p.gravity ?? preset.gravity) * 0.5
    particle.angle += particle.angularVelocity

    if (p.animationStyle === "circular" && !particle.isBurst) {
        particle.circleAngle += particle.circleSpeed
        particle.circleBaseX += particle.vx
        particle.x =
            particle.circleBaseX +
            Math.cos(particle.circleAngle) * particle.circleRadius
    } else {
        particle.wobble += particle.wobbleSpeed
        particle.x +=
            particle.vx + Math.sin(particle.wobble) * particle.wobbleAmplitude
    }
    particle.y += particle.vy

    // Opacity envelope
    const fadeInFrames = particle.lifespan * 0.1
    const fadeOutStart = particle.lifespan * 0.8
    const maxOp = p.maxOpacity ?? 1

    if (p.fadeIn && particle.age < fadeInFrames) {
        particle.opacity = (particle.age / fadeInFrames) * maxOp
    } else if (p.fadeOut && particle.age > fadeOutStart) {
        particle.opacity =
            ((particle.lifespan - particle.age) /
                (particle.lifespan - fadeOutStart)) *
            maxOp
    } else {
        particle.opacity = maxOp
    }

    particle.opacity = Math.max(0, Math.min(1, particle.opacity))
}

function drawParticle(
    ctx: CanvasRenderingContext2D,
    particle: Particle,
    fontSize: number,
    particleType: "emoji" | "image",
    img: HTMLImageElement | null,
    imageSize: number
): void {
    ctx.save()
    ctx.globalAlpha = particle.opacity
    ctx.translate(particle.x, particle.y)
    ctx.rotate(particle.angle)
    ctx.scale(particle.scale, particle.scale)

    if (particleType === "image" && img && img.complete && img.naturalWidth > 0) {
        const half = imageSize / 2
        ctx.drawImage(img, -half, -half, imageSize, imageSize)
    } else {
        ctx.font = `${fontSize}px serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(particle.emoji, 0, 0)
    }

    ctx.restore()
}

function isOffScreen(
    particle: Particle,
    canvasW: number,
    canvasH: number,
    animationStyle: "falling" | "circular"
): boolean {
    const refX =
        animationStyle === "circular" && !particle.isBurst
            ? particle.circleBaseX
            : particle.x
    return (
        particle.y > canvasH + 80 ||
        refX < -180 ||
        refX > canvasW + 180 ||
        particle.age >= particle.lifespan
    )
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 600
 */
export default function FallingParticles(props: Props) {
    const {
        particleType,
        imageUrl,
        imageSize,
        animationStyle,
        preset,
        customEmojis,
        particleCount,
        fontSize,
        scheduleEnabled,
        scheduleStartMonth,
        scheduleStartDay,
        scheduleEndMonth,
        scheduleEndDay,
        clickInteraction,
        burstCount,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number>(0)
    const propsRef = useRef<Props>(props)
    const imageRef = useRef<HTMLImageElement | null>(null)

    // Keep propsRef current every render (no-cost live-update for sliders)
    propsRef.current = props

    // Image loading — runs independently of RAF loop
    useEffect(() => {
        if (particleType !== "image" || !imageUrl) {
            imageRef.current = null
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imageRef.current = img
        }
        img.onerror = () => {
            imageRef.current = null
        }
        img.src = imageUrl
    }, [particleType, imageUrl])

    const scheduled = useMemo(
        () =>
            isWithinSchedule(
                scheduleEnabled,
                scheduleStartMonth,
                scheduleStartDay,
                scheduleEndMonth,
                scheduleEndDay
            ),
        [
            scheduleEnabled,
            scheduleStartMonth,
            scheduleStartDay,
            scheduleEndMonth,
            scheduleEndDay,
        ]
    )

    // Main animation loop — restarts on structural changes
    useEffect(() => {
        if (!scheduled) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const syncSize = () => {
            const { width, height } = canvas.getBoundingClientRect()
            if (
                canvas.width !== Math.round(width) ||
                canvas.height !== Math.round(height)
            ) {
                canvas.width = Math.round(width) || 1
                canvas.height = Math.round(height) || 1
            }
        }
        syncSize()

        const resolveEmojis = (p: Partial<Props>) => {
            if (p.preset === "custom") {
                const parsed = (p.customEmojis ?? "")
                    .split(/[\s,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                return parsed.length > 0 ? parsed : PRESET_MAP.snow.emojis
            }
            return PRESET_MAP[p.preset ?? "snow"]?.emojis ?? PRESET_MAP.snow.emojis
        }

        // Initialise pool with staggered Y to avoid empty-screen-then-waterfall artifact
        particlesRef.current = Array.from({ length: particleCount }, () =>
            spawnParticle(canvas.width, canvas.height, resolveEmojis(props), props, true)
        )

        function tick() {
            syncSize()
            ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

            const p = propsRef.current
            const w = canvas!.width
            const h = canvas!.height
            const safeEmojis = resolveEmojis(p)
            const style = p.animationStyle ?? "falling"
            const pType = p.particleType ?? "emoji"
            const img = imageRef.current
            const imgSize = p.imageSize ?? 40

            const pool = particlesRef.current
            for (let i = 0; i < pool.length; i++) {
                const particle = pool[i]
                updateParticle(particle, w, h, p)
                drawParticle(ctx!, particle, p.fontSize ?? 24, pType, img, imgSize)

                if (isOffScreen(particle, w, h, style) && !particle.isBurst) {
                    Object.assign(
                        pool[i],
                        spawnParticle(w, h, safeEmojis, p, false)
                    )
                }
            }

            // Remove expired burst particles
            particlesRef.current = pool.filter(
                (pt) => !(pt.isBurst && isOffScreen(pt, w, h, style))
            )

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(rafRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [particleCount, preset, customEmojis, animationStyle, particleType, scheduled])

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (!clickInteraction) return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const p = propsRef.current
            const emojis =
                p.preset === "custom"
                    ? (p.customEmojis ?? "")
                          .split(/[\s,]+/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : PRESET_MAP[p.preset]?.emojis ?? PRESET_MAP.snow.emojis
            const safeEmojis = emojis.length > 0 ? emojis : PRESET_MAP.snow.emojis
            const burst = Array.from({ length: burstCount ?? 20 }, () =>
                spawnBurstParticle(x, y, safeEmojis, p)
            )
            particlesRef.current.push(...burst)
        },
        [clickInteraction, burstCount]
    )

    if (!scheduled) {
        return <div style={{ width: "100%", height: "100%", ...style }} />
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: clickInteraction ? "auto" : "none",
                }}
                onClick={handleClick}
            />
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(FallingParticles, {
    // Particle type
    particleType: {
        type: ControlType.Enum,
        title: "Particle Type",
        defaultValue: "emoji",
        options: ["emoji", "image"],
        optionTitles: ["Emoji", "Image / Logo"],
        displaySegmentedControl: true,
    },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: "",
        placeholder: "https://…/logo.png",
        hidden: (props) => props.particleType !== "image",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 40,
        min: 8,
        max: 200,
        step: 2,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.particleType !== "image",
    },

    // Animation style
    animationStyle: {
        type: ControlType.Enum,
        title: "Animation",
        defaultValue: "falling",
        options: ["falling", "circular"],
        optionTitles: ["Falling", "Circular"],
        displaySegmentedControl: true,
    },

    // Preset
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "snow",
        options: [
            "snow",
            "leaves",
            "confetti",
            "hearts",
            "stars",
            "cherryBlossom",
            "money",
            "emoji",
            "easter",
            "mothersDay",
            "halloween",
            "christmas",
            "glitter",
            "custom",
        ],
        optionTitles: [
            "Snow",
            "Leaves",
            "Confetti",
            "Hearts",
            "Stars",
            "Cherry Blossom",
            "Money",
            "Emoji Mix",
            "Easter",
            "Mother's Day",
            "Halloween",
            "Christmas",
            "Glitter",
            "Custom",
        ],
        hidden: (props) => props.particleType === "image",
    },
    customEmojis: {
        type: ControlType.String,
        title: "Custom Emojis",
        defaultValue: "🎯 🔥 💎 🎸 🌈",
        placeholder: "Space-separated emojis",
        hidden: (props) =>
            props.particleType === "image" || props.preset !== "custom",
    },

    // Particles
    particleCount: {
        type: ControlType.Number,
        title: "Count",
        defaultValue: 80,
        min: 5,
        max: 400,
        step: 5,
        displayStepper: true,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Emoji Size",
        defaultValue: 24,
        min: 8,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (props) => props.particleType === "image",
    },
    sizeVariance: {
        type: ControlType.Number,
        title: "Size Variance",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },

    // Physics
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 0.05,
        min: 0,
        max: 1,
        step: 0.01,
    },
    speedMin: {
        type: ControlType.Number,
        title: "Speed Min",
        defaultValue: 0.8,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    speedMax: {
        type: ControlType.Number,
        title: "Speed Max",
        defaultValue: 2.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    wind: {
        type: ControlType.Number,
        title: "Wind",
        defaultValue: 0,
        min: -3,
        max: 3,
        step: 0.05,
    },
    windVariance: {
        type: ControlType.Number,
        title: "Wind Variance",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
    },
    drift: {
        type: ControlType.Number,
        title: "Drift / Wobble",
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
    },

    // Appearance
    maxOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1.0,
        min: 0.1,
        max: 1.0,
        step: 0.05,
    },
    fadeIn: {
        type: ControlType.Boolean,
        title: "Fade In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeOut: {
        type: ControlType.Boolean,
        title: "Fade Out",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    spawnEdge: {
        type: ControlType.Enum,
        title: "Spawn From",
        defaultValue: "top",
        options: ["top", "random"],
        optionTitles: ["Top Edge", "Random Position"],
        displaySegmentedControl: true,
    },

    // Interaction
    clickInteraction: {
        type: ControlType.Boolean,
        title: "Click to Burst",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    burstCount: {
        type: ControlType.Number,
        title: "Burst Amount",
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 5,
        displayStepper: true,
        hidden: (props) => !props.clickInteraction,
    },

    // Date Scheduling
    scheduleEnabled: {
        type: ControlType.Boolean,
        title: "Date Schedule",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Always On",
    },
    scheduleStartMonth: {
        type: ControlType.Number,
        title: "Start Month",
        defaultValue: 12,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.scheduleEnabled,
    },
    scheduleStartDay: {
        type: ControlType.Number,
        title: "Start Day",
        defaultValue: 1,
        min: 1,
        max: 31,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.scheduleEnabled,
    },
    scheduleEndMonth: {
        type: ControlType.Number,
        title: "End Month",
        defaultValue: 12,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.scheduleEnabled,
    },
    scheduleEndDay: {
        type: ControlType.Number,
        title: "End Day",
        defaultValue: 31,
        min: 1,
        max: 31,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.scheduleEnabled,
    },
})
