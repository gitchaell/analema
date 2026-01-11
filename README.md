# 🌞🌙 Analema Solar y Lunar - Sky Photographer

Automated screenshot capture system for the **Ahwatukee - Phoenix, Arizona** webcam. This project captures images of the sun at solar noon and the moon at its meridian crossing, creating data for an [analemma](https://en.wikipedia.org/wiki/Analemma) photography project.

## 📍 Project Context

| Parameter | Value |
|-----------|-------|
| **Target Location** | Ahwatukee - Phoenix, Arizona, USA |
| **Target Timezone** | UTC-7 (No Daylight Saving Time) |
| **User Location** | Santa Cruz, Bolivia |
| **User Timezone** | UTC-4 (America/La_Paz) |
| **Time Offset** | Bolivia is +3 hours ahead of Phoenix |

### Example Time Conversion
```
10:00 AM Phoenix (UTC-7) = 1:00 PM Bolivia (UTC-4)
```

## 🎥 Target Cameras

| Camera | URL |
|--------|-----|
| **North** (Primary) | https://www.myearthcam.com/insideoutaerial/lowercam2 |
| **West** (Secondary) | https://myearthcam.com/insideoutaerial |

## 🛠️ Technology Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Browser Engine**: Puppeteer (Headless Chrome)
- **Automation**: GitHub Actions (Scheduled Cron)
- **Linter/Formatter**: Biome

## 📁 Project Structure

```
analema/
├── .github/
│   └── workflows/
│       └── schedule.yml      # GitHub Actions workflow
├── data/
│   ├── solar-schedule.json   # Solar capture schedule (Bolivia time)
│   ├── lunar-schedule.json   # Lunar capture schedule (Bolivia time)
│   └── scraping/             # Original data from source
├── src/
│   ├── index.ts              # Production entry (scheduled captures)
│   ├── test.ts               # Test entry (immediate capture)
│   ├── config/
│   │   └── index.ts          # Configuration constants
│   ├── services/
│   │   ├── ScheduleService.ts    # Schedule loading & querying
│   │   └── CaptureService.ts     # Puppeteer screenshot logic
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── utils/
│       └── Logger.ts         # Timestamped logging utility
├── captures/                 # Screenshot output directory
├── package.json
├── tsconfig.json
├── biome.json
└── .editorconfig
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/analema.git
cd analema

# Install dependencies
npm install
```

### Local Development

```bash
# Run test capture (immediate, no waiting)
npm run test

# Run production mode (checks for scheduled captures this hour)
npm start

# Format code
npm run format

# Lint code
npm run lint

# Format + Lint
npm run check
```

## 📅 Schedule Configuration

### Solar Schedule (`data/solar-schedule.json`)

Captures the sun at **solar noon** - when the sun is at its highest point in the sky.

- **62 entries** (31 days × 2 cameras)
- **Capture time**: ~15:31-15:42 Bolivia time (12:31-12:42 Phoenix)
- Based on the `solar_noon` value from astronomical data

### Lunar Schedule (`data/lunar-schedule.json`)

Captures the moon at its **meridian crossing** - when the moon is at its highest point.

- **58 entries** (29 valid days × 2 cameras)
- **Capture time**: Varies throughout the month (02:21-23:00 Bolivia time)
- Includes illumination percentage for each capture
- Days 2 and 31 excluded (no meridian data available)

### Schedule Entry Format

```json
{
  "date": "2026-01-11",
  "time": "09:55",
  "camera": "north",
  "phoenix_time": "06:55",
  "illumination": "41.3%"
}
```

| Field | Description |
|-------|-------------|
| `date` | Capture date in Bolivia timezone (YYYY-MM-DD) |
| `time` | Capture time in Bolivia timezone (HH:MM, 24h) |
| `camera` | Camera to use (`north` or `west`) |
| `phoenix_time` | Original Phoenix time (for reference) |
| `phoenix_date` | Phoenix date if different from Bolivia date |
| `illumination` | Moon illumination percentage (lunar only) |

## ⚙️ GitHub Actions

### Automatic Schedule

The workflow runs **every hour at minute 0** (`0 * * * *`).

1. Checks if there's a capture scheduled for the current hour
2. If yes: waits until the exact minute, then captures
3. If no: exits immediately to save resources
4. Commits and pushes any new captures to the repository

### Manual Trigger (Testing)

You can manually trigger the workflow from the GitHub Actions tab:

1. Go to **Actions** → **Sky Photographer - Scheduled Capture**
2. Click **"Run workflow"**
3. ✅ Check **"Force capture regardless of schedule"** for immediate capture
4. Click **"Run workflow"**

### Environment

| Variable | Value | Purpose |
|----------|-------|---------|
| `TZ` | `America/La_Paz` | Sets container timezone to Bolivia |

## 📸 Output

Screenshots are saved to the `captures/` directory with the following naming convention:

```
capture_[TYPE]_[SEQ]_[CAMERA]_[DATE]_[TIME].png
```

| Part | Description |
|------|-------------|
| `TYPE` | `solar` or `lunar` |
| `SEQ` | 3-digit sequential number (001, 002, 003...) |
| `CAMERA` | `north` or `west` |
| `DATE` | Date in YYYYMMDD format |
| `TIME` | Time in HHMM format |

**Examples:**
- `capture_solar_001_north_20260111_1535.png`
- `capture_solar_002_west_20260111_1536.png`
- `capture_lunar_001_north_20260111_0955.png`

The sequential number is **separate for each type** (solar/lunar), making it easy to create animations by sorting files alphabetically.

## 🔧 Configuration

### Puppeteer Options (`src/config/index.ts`)

Optimized for GitHub Actions with anti-detection measures:

```typescript
export const PUPPETEER_OPTIONS = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
    // Custom user agent to reduce bot detection
    '--user-agent=Mozilla/5.0 ...',
  ],
};
```

### Viewport

```typescript
export const VIEWPORT = {
  width: 1024,
  height: 690,
};
```

### Stream Load Wait

```typescript
export const STREAM_LOAD_WAIT_MS = 20000; // 20 seconds
```

## 📊 Data Sources

The schedule data is based on official astronomical data for Phoenix, Arizona:

- **Solar data**: Sunrise, sunset, solar noon times
- **Lunar data**: Moonrise, moonset, meridian crossing times, illumination

Original scraping data is preserved in `data/scraping/`.

## 🐛 Troubleshooting

### No captures in GitHub Actions

1. Check the workflow logs for errors
2. Verify the schedule has entries for the current date
3. Ensure the `captures/` directory exists (`.gitkeep`)

### Website blocking

If EarthCam blocks the capture:
- The user agent is already configured to mimic a real browser
- Consider adding delays between captures
- Check if the website requires interaction (cookies, etc.)

### Timezone issues

- Ensure `TZ=America/La_Paz` is set in the workflow
- All schedule times are in Bolivia time (UTC-4)
- The script uses system time, which should match the TZ variable

## 📝 License

MIT

## 👤 Author

Created for the **Analema Solar y Lunar** photography project.

---

*Automated sky photography from Phoenix, Arizona 🌵*
