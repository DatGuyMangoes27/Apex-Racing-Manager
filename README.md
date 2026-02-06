# AMS2 Career Companion

A comprehensive career mode simulation companion for Automobilista 2 (AMS2). Transform your racing into a full career experience with finances, rival drivers, contracts, and life simulation elements.

![AMS2 Career Companion](https://img.shields.io/badge/Platform-Windows-blue) ![Electron](https://img.shields.io/badge/Electron-28.x-47848F) ![React](https://img.shields.io/badge/React-18.x-61DAFB)

## Features

### 🏎️ Career Simulation
- **Career Ladder**: Progress through multiple racing series from karting to Formula Ultimate
- **Preset Scenarios**: Start as a young prodigy, late bloomer, wealthy amateur, or ex-pro comeback
- **Full Calendar**: Race weekends, off-weeks, and events throughout the season

### 💰 Financial Management
- **Realistic Economics**: Manage seat costs, salaries, prize money, and sponsors
- **Sponsor Deals**: Attract sponsors based on reputation and marketability
- **Budget Planning**: Track income, expenses, and plan your finances

### 🤖 AI Rival System
- **Full Grid Simulation**: AI drivers with their own careers, transfers, and retirements
- **Persistent Rivals**: Drivers remember your interactions and develop rivalries
- **AMS2 Integration**: Automatically generates Custom AI Driver XMLs for the game

### 📺 AMS2 Integration
- **UDP Telemetry**: Auto-detect race sessions and capture results
- **AI XML Generator**: Seamlessly write rival driver files to AMS2
- **Live Tracking**: Monitor your sessions in real-time

### 🎭 Life Simulation
- **Mental Health**: Manage confidence, stress, and morale
- **Physical Fitness**: Train to improve your performance
- **Media Relations**: Handle press, social media, and public image
- **Relationships**: Build connections with teams, rivals, and sponsors

### 🎨 Premium UI
- **Manager Sim Style**: Clean, professional interface inspired by sports management games
- **Video Backgrounds**: Contextual animated backgrounds for each screen
- **Dark Racing Theme**: Carbon fiber aesthetic with racing accents

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Automobilista 2 (for game integration)

### Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run electron:dev
   ```

4. For production build:
   ```bash
   npm run electron:build
   ```

## Configuration

### AMS2 Path
The app will automatically detect your AMS2 installation path. If not found, you can manually set it in Settings.

Default location: `Documents/Automobilista 2/UserData/CustomAIDrivers/`

### UDP Telemetry
To enable automatic race detection:
1. Enable UDP telemetry in AMS2 settings
2. Default port: 5606
3. The app will listen for session data automatically

## How It Works

### Career Flow
1. **Create Career**: Choose a scenario and create your driver
2. **Find a Seat**: Browse available contracts and sign with a team
3. **Race**: Enter your results after racing in AMS2 (or auto-detect via UDP)
4. **Manage**: Handle finances, training, media between races
5. **Progress**: Build reputation, attract better offers, climb the ladder

### AI Integration
The app generates AMS2-compatible XML files for AI drivers:
- Files are placed in your AMS2 CustomAIDrivers folder
- Each rival's skills map to AMS2's AI parameters
- Load a race in AMS2 and rivals will use these settings

## Tech Stack

- **Framework**: Electron 28
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand (persistent)
- **Database**: JSON storage (SQLite upgrade available)
- **Networking**: Node dgram for UDP telemetry

## Project Structure

```
ams2-career-companion/
├── electron/           # Electron main process
│   ├── main.ts         # App entry point
│   ├── preload.ts      # IPC bridge
│   ├── xml/            # AI XML generator
│   ├── udp/            # Telemetry listener
│   └── db/             # Database operations
├── src/
│   ├── components/     # UI components
│   │   ├── ui/         # Reusable primitives
│   │   ├── layout/     # App shell
│   │   └── video/      # Background system
│   ├── screens/        # App pages
│   ├── store/          # Zustand stores
│   ├── simulation/     # Game logic
│   │   ├── finances/   # Financial system
│   │   ├── rivals/     # AI simulation
│   │   └── events/     # Narrative events
│   └── styles/         # Global CSS
└── assets/             # Static resources
```

## Contributing

This is a fan project for the AMS2 community. Contributions welcome!

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Reiza Studios for Automobilista 2
- The AMS2 modding community for Custom AI documentation
- Project CARS 2 UDP specification

---

*This is a fan-made companion app and is not affiliated with Reiza Studios.*












