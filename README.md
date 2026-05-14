# Aim Sensitivity Analyzer

A web-based aim test and sensitivity analysis tool for FPS players. Test your flick aim and precision aim, then get personalized sensitivity recommendations.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How It Works

1. **Start Screen** — Select your game (Valorant/CS2/Overwatch), enter your sensitivity and DPI
2. **Flick Test** — Click 20 random targets as fast as you can (30 second time limit)
3. **Precision Test** — Click 20 small targets to test fine-aim accuracy
4. **Results** — Get analysis of your aim tendencies and sensitivity recommendations

## Project Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Root component, screen navigation
├── App.css               # All styles
├── types/
│   └── index.ts          # TypeScript interfaces
├── constants/
│   └── index.ts          # Analysis thresholds, game configs
├── components/
│   ├── StartScreen.tsx   # Game/sensitivity input
│   ├── FlickTest.tsx     # Flick aim test with Canvas
│   ├── PrecisionTest.tsx # Precision aim test with Canvas
│   ├── ResultScreen.tsx  # Analysis results display
│   └── GameCanvas.tsx    # Shared Canvas wrapper (60fps, crosshair)
├── data/
│   ├── flickDataCollector.ts      # Flick test data collection
│   ├── precisionDataCollector.ts  # Precision test data collection
│   └── mousePathRecorder.ts       # Mouse path sampling
└── engine/
    └── sensitivityEngine.ts       # Pure analysis module
```

## Architecture

Three-layer architecture with strict dependency rules:

- **UI Layer** (`components/`) — React components, Canvas rendering
- **Data Layer** (`data/`) — Data collection modules, no UI dependencies
- **Analysis Layer** (`engine/`) — Pure functions, no browser/React dependencies

## Analysis Logic

The sensitivity engine uses rule-based analysis:

- **Over-Aim** (>50% of flick targets show overshoot) → Decrease sensitivity 10-20%
- **Under-Aim** (avg correction movements > 3) → Increase sensitivity 10-20%
- **Cursor Jitter** (avg displacement > 15px before click) → Decrease sensitivity 5-15%
- **Balanced** (no thresholds exceeded) → Current sensitivity is good

## Future Backend Integration

The data collectors and analysis engine are designed for easy backend migration:
- Data collectors can be swapped with API calls without changing UI
- Sensitivity engine accepts data as parameters and returns results (no side effects)
- All interfaces are defined in `types/index.ts`

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- HTML5 Canvas (60fps rendering)
- No external UI libraries
