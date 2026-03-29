# 🌌 Chromatic Cosmic Mirror

**Chromatic Cosmic Mirror** is a real-time generative art experience that turns your environment's colors into a living galaxy. Your webcam samples the dominant hue from the physical world and maps it onto 6,000 GPU-accelerated particles — morphing between spirals, nebulae, and star clusters through procedural mathematics. Scroll to zoom. Watch the cosmos breathe.

![preview](./public/preview.png)

---

## ✨ Features

- **Webcam Color Mapping** — Samples live color from your camera and drives the entire galaxy's form and palette
- **6 Galaxy Morphologies** — Hue controls the galaxy type: Nebula · Starburst · Dense Cluster · Spiral · Elliptical · Distorted
- **Procedural Spiral Algorithm** — Logarithmic spiral arms with power-law radial density and turbulence noise
- **GPU-Accelerated Particles** — 6,000 stars with per-particle GLSL twinkling shaders, zero CPU animation cost
- **Smooth Particle Morphing** — All particles lerp fluidly between galaxy forms when your environment color changes
- **Orbital Camera** — Cinematic slow drift around the galaxy core with vertical sway
- **Mouse Wheel Zoom** — Scroll to pull in or push away from the galaxy
- **Bloom Post-Processing** — UnrealBloomPass for realistic star glow
- **Glassmorphism UI** — Frosted-glass pill sliders showing live Hue / Saturation / Luminance readings
- **Aurora Background** — Slow-shifting dark aurora that cycles between purple, teal, and burgundy

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Rendering | Three.js + WebGL |
| Shaders | Custom GLSL (vertex + fragment) |
| Post-processing | EffectComposer + UnrealBloomPass |
| Language | TypeScript |
| Build Tool | Vite |
| Camera Input | Web MediaDevices API |

---

## 🚀 Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or above
- A browser with webcam access (Chrome or Firefox recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# 2. Navigate into the galaxy project folder
cd your-repo-name/galaxy

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

### View in Browser

Open your browser and visit:

```
http://localhost:5173
```

When prompted, **allow camera access** — this is required for the color-driven interaction to work.

> If you decline camera access, the galaxy will still render but will stay in its default state without color-driven morphing.

---

## 🎮 Controls

| Action | Effect |
|---|---|
| Webcam color changes | Galaxy morphs form and color in real time |
| Mouse scroll up | Zoom into the galaxy |
| Mouse scroll down | Zoom out from the galaxy |

---

## 🔬 How It Works

1. **Color Sampling** — Every ~200ms, the webcam frame is drawn to a hidden canvas and the average RGB is computed.
2. **HSL Conversion** — RGB is converted to HSL (Hue, Saturation, Lightness).
3. **Galaxy Type Mapping** — Hue angle (0–360°) selects the galaxy morphology.
4. **Particle Target Update** — Each of the 6,000 particles receives a new target position calculated by the spiral arm algorithm.
5. **GPU Lerp** — Particles smoothly interpolate to their targets each frame via `position.lerp(target, deltaTime * 2)`.
6. **GLSL Twinkling** — Each star has a unique `aPhase` attribute; the vertex shader computes size and alpha oscillation on the GPU.

---

## 📄 License

MIT — feel free to fork, remix, and explore.
