# Chess Clock Pro ⏱️♟️

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://blazingspy15.github.io/Chess-Clock-App/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-15%2F15%20Passing-success?style=for-the-badge)](https://github.com/blazingspy15/Chess-Clock-App)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Typecheck%20Clean-blue?style=for-the-badge&logo=typescript)](https://github.com/blazingspy15/Chess-Clock-App)

**Live Website**: [https://blazingspy15.github.io/Chess-Clock-App/](https://blazingspy15.github.io/Chess-Clock-App/)

A tournament-grade, 100% offline, millisecond-accurate Chess Clock application built with **React Native**, **Expo**, and **TypeScript**, matching the quality and reliability of the official Chess.com app.

---

## 🌟 Key Features

### 1. 100% On-Device & Monotonic Precision Timing
- **Hardware Monotonic Delta Loop**: Timing logic relies on monotonic `performance.now()` measurements with zero drift. Callback timing variations and thread context switches never compromise accuracy.
- **Battery Optimization**: Dynamically adapts tick rate—runs at **100ms** during regular play (cutting CPU wakeups by over 60% during 2-hour classical games) and automatically accelerates to **50ms** during intense time scrambles ($\le 10$ seconds) for fluid decimal countdowns.
- **Configurable Background Behavior**: Supports both auto-pause upon app minimization and true wall-clock time catch-up when continued in the background.
- **Rapid Tap & Inactive Player Protection**: Accidental double-taps within 50ms and taps from inactive players are safely ignored.
- **Offline Persistence**: Custom presets, themes, sound/haptic toggles, and user preferences are saved on-device via `@react-native-async-storage/async-storage`.

### 2. Complete Time Control Mechanics
- **Standard Presets**:
  - **Bullet**: 1+0, 1+1, 2+1
  - **Blitz**: 3+0, 3+2, 5+0, 5+3, 5+5
  - **Rapid**: 10+0, 15+10, 30+0
  - **Classical**: 60+0, 90+30, and FIDE 40/90m + 30m (+30s)
  - **Delays**: 5 d3 (USCF Simple Delay), 10 d5, 3 b2 (Bronstein Delay), 5 b3
- **Advanced Increment & Delay Modes**:
  - **Fischer Increment (+)**: Fixed bonus added instantly upon completing each move.
  - **Bronstein Delay (B)**: Time spent on the move is refunded up to the delay cap (the clock can never exceed its initial value at the start of that turn).
  - **Simple Delay (D)**: USCF-style delay bank countdown before main time begins ticking down.
- **Handicap Mode**: Configure asymmetric clocks for odds games (e.g. 10 minutes vs 2 minutes).
- **Multi-Stage Tournament Controls**: Support multi-stage rules (e.g. FIDE 40 moves in 90 min, then 30 min with 30s increment).

### 3. Professional UI/UX & Redesign
- **Design System**: Deep graphite background, dark slate panels, vibrant emerald green active player, muted gold accents, and red timeout indicators.
- **Configurable Opponent Orientation**: Invert the top player 180° for head-to-head table play, or display right-side-up for observers and streaming.
- **Custom Player Names**: Personalize White and Black player names.
- **Edge-to-Edge Touch Targets**: Massive touch areas for instant move passing during blitz scrambles.
- **Dead-Zone Control Strip**: Narrow central strip with Pause/Resume, Reset, Settings, and Edit buttons placed between clocks to prevent accidental taps.
- **Responsive Tournament Layout**: Beautifully balanced across desktop monitors, tablets, and phones in both portrait and landscape orientations.
- **On-the-Fly Adjustments**: Pause anytime to add/subtract minutes, seconds, or moves for either player.
- **Audio & Haptics**: Low-latency mechanical click sound, flag alarm horn, subtle 10s low-time warning tick, and tactile vibration feedback.

---

## 📁 Project Structure

```
chess-clock/
├── App.tsx                     # Responsive tournament view & modal manager
├── index.ts                    # Expo entry point
├── package.json
├── app.json                    # BaseUrl & orientation config
├── tsconfig.json               # Strict TypeScript config
└── src/
    ├── engine/                 # PURE HEADLESS TIMING ENGINE (Zero UI coupling)
    │   ├── types.ts            # TimingMethod, PlayerState, ClockStatus, etc.
    │   ├── time.ts             # Monotonic high-resolution time provider
    │   ├── ChessClockEngine.ts # Drift compensation, delay math, adaptive ticking
    │   ├── presets.ts          # Complete preset library & builder factories
    │   └── __tests__/
    │       └── engine.test.ts  # 15 automated precision unit tests
    ├── theme/
    │   └── tokens.ts           # Unified design system tokens & themes
    ├── state/
    │   ├── useChessClock.ts    # React Hook bridging engine to UI with AppState
    │   └── SettingsContext.tsx # Offline preferences & custom presets
    ├── components/
    │   ├── PlayerClock.tsx     # Responsive player clock display
    │   ├── CenterControlBar.tsx# Dead-zone strip (Pause, Reset, Adjust, Presets)
    │   ├── TimeAdjustModal.tsx # On-the-fly mid-game adjustment sheet
    │   ├── PresetSelector.tsx  # Grid of time control presets
    │   ├── CustomPresetModal.tsx # Handicap & multi-stage builder with validation
    │   └── SettingsModal.tsx   # Comprehensive personalization & theme modal
    └── services/
        ├── audioService.ts     # Low-latency clock clicks, low-time ticks & alarms
        ├── hapticsService.ts   # Tactile feedback via expo-haptics
        └── storageService.ts   # 100% on-device offline persistence
```

---

## 🧪 Testing the Timing Engine Standalone

```bash
npm run test:engine
```

**15 Automated Test Suites**:
1. Fischer Increment (3 min + 2s increment)
2. Bronstein Delay (Cap at turn start time)
3. Simple Delay (Delay countdown protects main bank)
4. Flagging & Win State (Time Out at 0:00)
5. Asymmetric Handicap (e.g. 10m vs 1m)
6. Multi-Stage Tournament Control (Stage advancement upon move threshold)
7. On-the-fly Mid-Game Adjustments (+/- time & move counters)
8. Sudden Death (No increment, no delay)
9. Inactive Player Tap Protection (Taps from inactive player ignored)
10. Monotonic Drift Elimination over 1,000 Jittered Ticks
11. Background Time Catch-Up (Time continues when backgrounded)
12. Single Flag Trigger & Lock (Timeout event fires strictly once)
13. Strict Non-Negative Clamping (Clock never dips below 0.0s)
14. Reset and Restart Determinism (Restores configured baseline)
15. Preset Library Completeness (Bullet, Blitz, Rapid, Classical, Delays)

---

## 🚀 Running the App Locally

### Install Dependencies
```bash
npm install
```

### Typecheck
```bash
npx tsc --noEmit
```

### Start Expo Dev Server
```bash
npx expo start
```

- Press `w` to run in Web Browser.
- Press `a` to open in Android Emulator / Device.
- Press `i` to open in iOS Simulator.

---

## 📱 Android APK & Mobile Features

### Package Details
- **App Name**: Chess Clock Pro
- **Package ID**: `com.chessclock.pro`
- **Version**: `1.0.1` (VersionCode `2`)
- **Prebuilt APK**: `ChessClockPro-v1.0.1.apk` (or `android/app/build/outputs/apk/release/app-release.apk`)

### Mobile Enhancements
1. **Screen Wake-Lock (`expo-keep-awake`)**: Active match prevents device sleep or display timeout; automatically released upon pause/reset to preserve battery.
2. **Android Hardware Back Guard (`BackHandler`)**: Closes any open modal dialogs first; if a clock is actively ticking, prompts for exit confirmation so matches are never accidentally interrupted.
3. **Adaptive Status Bar & Immersive Fullscreen**: Dark theme status bar in portrait mode; immersive fullscreen edge-to-edge layout in landscape orientation for maximum touch targets during time scrambles.
4. **App Icons & Adaptive Assets**: Clean emerald/graphite chess knight icon in 1024x1024, adaptive vector launcher XMLs, and splash screens.

### How to Install the APK on Android
1. Transfer `ChessClockPro-v1.0.1.apk` to your Android device via USB, Google Drive, or local file sharing.
2. Open the file on your device and tap **Install**.
3. If prompted with *"Install unknown apps"*, enable permission for your browser or file manager to complete installation.

### EAS Build (Cloud / CI)
```bash
# Preview build (generates standalone installable APK)
npx eas build --platform android --profile preview

# Production build (generates Google Play AAB)
npx eas build --platform android --profile production
```

### Local Native Build
```bash
cd android
.\gradlew.bat assembleRelease
```
The output APK is generated at `android/app/build/outputs/apk/release/app-release.apk`.
