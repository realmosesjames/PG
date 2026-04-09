import { framer, useSelection } from "framer-plugin"
import { useState } from "react"
import "./App.css"

framer.showUI({ position: "top right", width: 260, height: 460 })

const PRESETS = [
    { key: "snow",         label: "❄️ Snow" },
    { key: "leaves",       label: "🍂 Leaves" },
    { key: "confetti",     label: "🎊 Confetti" },
    { key: "hearts",       label: "❤️ Hearts" },
    { key: "stars",        label: "⭐ Stars" },
    { key: "cherryBlossom",label: "🌸 Cherry Blossom" },
    { key: "money",        label: "💵 Money" },
    { key: "emoji",        label: "😀 Emoji Mix" },
    { key: "easter",       label: "🐣 Easter" },
    { key: "mothersDay",   label: "💐 Mother's Day" },
    { key: "halloween",    label: "🎃 Halloween" },
    { key: "christmas",    label: "🎄 Christmas" },
    { key: "glitter",      label: "✨ Glitter" },
    { key: "custom",       label: "🎨 Custom" },
]

export function App() {
    const selection = useSelection()
    const [active, setActive] = useState("snow")
    const [status, setStatus] = useState("")

    // Detect a selected FallingParticles component instance
    const target = selection.find(
        (n) =>
            "setAttributes" in n &&
            (n.name.toLowerCase().includes("fallingparticles") ||
                n.name.toLowerCase().includes("falling particles") ||
                n.name.toLowerCase().includes("falling-particles"))
    )

    const handleApply = async () => {
        if (!target || !("setAttributes" in target)) {
            setStatus("⚠️ Select a FallingParticles layer first")
            return
        }
        try {
            await (target as any).setAttributes({ controls: { preset: active } })
            setStatus(`✓ Applied "${PRESETS.find((p) => p.key === active)?.label}"`)
            setTimeout(() => setStatus(""), 2500)
        } catch {
            setStatus("❌ Could not update component")
        }
    }

    return (
        <main>
            <p className="hint">
                {target
                    ? `✓ ${target.name}`
                    : "Select a FallingParticles layer on the canvas"}
            </p>

            <div className="preset-grid">
                {PRESETS.map((p) => (
                    <button
                        key={p.key}
                        className={`preset-btn${active === p.key ? " active" : ""}`}
                        onClick={() => setActive(p.key)}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {status && <p className="status">{status}</p>}

            <button
                className="framer-button-primary apply-btn"
                onClick={handleApply}
                disabled={!target}
            >
                Apply Preset
            </button>
        </main>
    )
}
