# SaiPair

Free, open-source, offline-first tournament management software.

**Website: [saipair.com](https://saipair.com)**

## Features

- **Multiple Formats** — Swiss, Round Robin, Double Round Robin, Single Elimination, Double Elimination
- **Auto Pairing** — Smart pairing engine generates pairings instantly
- **Live Rankings** — Real-time rankings with configurable tiebreak rules (Buchholz, Sonneborn-Berger, etc.)
- **Offline First** — No internet required, all data stored locally
- **Import & Export** — Import players from Excel/CSV, export rankings and pairings, TRF support
- **Print Ready** — Print rosters, pairings, rankings, cross tables, and player cards
- **Multi-Language** — English, 中文, Español, Français, Português, Русский, 日本語, العربية, हिन्दी, বাংলা
- **Light & Dark Mode**

## Download

Get the latest release for Windows, macOS, or Linux:

**[Download Latest Release](https://github.com/florida99771/saipair/releases/latest)**

## Project Structure

```
saipair/
├── core/           # Tournament engine (format-agnostic logic)
│   ├── formats/    # Swiss, Round Robin, Elimination engines
│   ├── ranking/    # Ranking & tiebreaker calculations
│   └── validators/ # Input validation
├── app/
│   └── desktop/    # Electron + React + MUI desktop app
└── site/           # saipair.com website (Parcel + React + MUI)
```

## Development

### Desktop App

```bash
cd app/desktop
npm install
npm run dev
```

### Website

```bash
cd site
npm install
npm run dev
```

### Build Desktop Installer

```bash
cd app/desktop
npm run dist
```

## License

[MIT](LICENSE)
