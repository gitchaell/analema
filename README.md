# 🌞🌙 Solar and Lunar Analemma - Sky Photographer

Automated screenshot capture system for multiple webcams across the USA. This project captures images of the sun and moon at specific times to create [analemma](https://pegasus.portal.nom.br/analema-solar-estrada-ecp19-realidades-paralelas/) composites.

## 📍 Locations & Schedule

The system captures images from 6 different locations. All times are automatically converted to the system timezone (Bolivia, UTC-4).

| Location | Timezone | Sun Capture | Moon Capture | Cameras |
| -------- | -------- | ----------- | ------------ | ------- |
| **Fountain Hills, Arizona** | UTC-7 | 08:30 | 23:30 | 1 |
| **Phoenix, Arizona** | UTC-7 | 17:30 | 23:30 | 4 (West, North, NE, Multiple) |
| **Prescott, Arizona** | UTC-7 | 17:30 | 23:30 | 1 |
| **Ojai, California** | UTC-8 | 08:30 | 23:30 | 1 |
| **Englewood Beach, Florida** | UTC-5 | 17:30 | 22:30 | 1 |
| **Peaks Island, Maine** | UTC-5 | 15:30 | 23:30 | 1 |

> **Note**: Capture times are in local time for each location.

## 🛠️ Technology Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Browser Engine**: Puppeteer (Headless Chrome)
- **Automation**: GitHub Actions (Scheduled Cron every 30 min)
- **Linter/Formatter**: Biome

## 📁 Project Structure

```txt
analema/
├── .github/workflows/
│   └── schedule.yml          # GitHub Actions workflow
├── captures/                  # Screenshot output directory
├── src/
│   ├── index.ts              # Production entry
│   ├── config/               # Configuration & Locations
│   ├── domain/               # Entities & Repositories
│   ├── infrastructure/       # Implementations
│   └── services/             # Core Logic
├── scripts/
│   └── generate-calendar.ts  # ICS Generator
└── ...
```

## 🚀 Getting Started

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/analema.git
cd analema
npm install
```

### Local Development

```bash
npm run test     # Immediate capture test
npm start        # Run scheduled checks
npm run format   # Format code
npm run generate:calendar # Regenerate ICS file
```

## ⚙️ How It Works

1. **Schedule**: The system checks `src/config/locations.ts` for capture times.
2. **Conversion**: Calculates the precise capture time for each location, converted to system time.
3. **Execution**: Launches Puppeteer browsers in parallel for all due captures.
4. **Storage**: Saves screenshots in `captures/` organized by location and type.

## 📅 Calendar Integration

You can generate an ICS calendar file to subscribe to all capture events:

```bash
npm run generate:calendar
```

The file `analema-2026.ics` will be created in the root directory.

## 📝 License

MIT

---

Automated sky photography project 📸
