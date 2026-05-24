# ⏱️ Chronos | Premium Timekeeping Suite

Welcome to **Chronos**, an ultra-premium, dual-mode sports timekeeping application built with React, TypeScript, Tailwind CSS, and Vite. Chronos elevates simple timers into a state-of-the-art visual dashboard, combining mechanical watchmaking aesthetics with high-performance tracking.

Designed for athletes, speedcubers, developers, and productivity enthusiasts, Chronos offers seamless dual operations: a high-precision **Sports Chronometer (Stopwatch)** and a highly versatile **Countdown Timer** with custom inputs and task presets.

---

## 🎨 Design Aesthetics & Visuals

Chronos has been designed to look extremely premium, clean, and interactive:
* **Minimalist Warm-White Theme**: Uses a carefully curated, low-fatigue gallery white (`#faf9f6`) background, deep charcoal text (`#111111`), and a signature high-energy chronometer orange/coral (`#ff4500`) primary accent.
* **Atmospheric Dot Grid**: A subtle, high-end floating dot-matrix pattern rendered purely via CSS gradients provides gorgeous background depth.
* **High-Contrast Casing**: The main timekeeper rests in a glassmorphic container (`.stopwatch-card`) with smooth borders, visual elevations, and active scale transformations on mouse hover/click.
* **Stable Technical Typography**: Loaded **Plus Jakarta Sans** for crisp interface elements, and **Space Mono** with `tabular-nums` numeric alignment so stopwatch digits stay perfectly centered and stable without any vertical/horizontal shaking.

---

## ✨ Key Features

### 1. 🎛️ Dual-Mode Tab Switcher
* Swaps seamlessly between a **Stopwatch** and a **Timer** mode.
* Automatically pauses active time loops and silences current alarm sequences during transitions to guarantee clean, collision-free execution.

### 2. 🏁 Sports Chronometer (Stopwatch)
* Counts time up with **centisecond (10ms) precision**.
* **Segmented Split Lap Recorder**: Tracks both cumulative time and the individual duration of each lap segment (split time).
* **Under-the-Hood Lap Analytics**: Once 2 or more laps are logged, Chronos dynamically flags your **Fastest Lap** (in green lightning badge) and **Slowest Lap** (in red timer badge) along with live average splits.
* Supports deleting single laps with automatic index re-ordering, or clearing all laps.

### 3. ⏳ Countdown Timer & Custom Picker
* **Segmented Duration Inputs**: When at rest, the centerpiece of the dial displays a tactile numeric picker for Hours, Minutes, and Seconds.
* **Auto-Sanitized Inputs**: Boundary checks values between `00:00:00` and `23:59:59`. Supports scrollable selections and number pad bindings.
* **Micro Quick Presets**: Features rapid timing quick tags (`1m`, `5m`, `25m`) inside the gauge.
* Displays counts down with milliseconds ticker precision, replacing inputs once running.

### 4. 🎚️ Productivity Presets Dashboard
* In Timer mode, the right panel becomes a **Preset Manager** containing predefined blocks:
  * **Pomodoro Focus**: 25-minute extreme focus cycle
  * **Short Break**: 5-minute standard resting block
  * **Long Break**: 15-minute mental decompression
  * **Power Nap**: 20-minute rapid recovery nap
  * **Centering Meditation**: 10-minute mindful breathing
* Loads presets in **one-click**, instantly updating dial elements and inputs.

### 5. 🔔 Synthesized Repeating Alarm & Sound Module
* Built using the browser's native **Web Audio API** (100% asset-free, offline-ready, and lightweight).
* Synthesizes crisp physical clicks for buttons (Start, Pause, Reset, Lap) using **triangle wave oscillators** for optimal acoustic audibility.
* Sounds a **dual-tone alarm chime** (`880Hz` + `1100Hz` repeating chimes) at `24%` gain when countdown completes, alongside a pulsing visual overlay.

### 6. 📱 100% Responsive & Compact Mobile Layout
* **Adaptive Root Margin**: Responsive padding (`12px` on mobile, `24px` on desktop) maximizes viewport real estate.
* **Flexible SVG Dial Sizing**: The mechanical dial auto-resizes from `w-[230px]` on small mobile screens up to `w-72` on tablet/desktop. 
* **Centermost Typography Scale**: Numerals automatically shrink on small devices (e.g. iPhone SE) to prevent clipping or overlap.
* **Collapsing Controls**: Action buttons hide text labels on small screens (`hidden sm:inline`), shrinking into neat icon buttons to ensure plenty of tap-room.

### 7. ⌨️ Adaptable Keyboard Keybinds
* Shortcuts (`Space` -> Toggle, `L` -> Lap, `R` -> Reset, `Esc` -> Clear) dynamically adapt to the open tab.
* Uses **stale-closure refs** (`timeRef`, `lapsRef`, etc.) to run keyboard events bound once on mount without any lag or execution bugs.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` or `yarn`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/arkapravachakraborty/stopwatch-react.git
   cd stopwatch-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 🛠️ Technology Stack
* **Framework**: React 19 + TypeScript
* **Bundler**: Vite
* **Styling**: Tailwind CSS v4.0
* **Sound Generation**: Web Audio API (native browser oscillators)
* **Graphics**: Vector SVGs and custom inline icons
