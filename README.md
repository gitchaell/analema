# 🌞🌙 Analema Solar y Lunar - Sky Photographer

Automated screenshot capture system for the **Ahwatukee - Phoenix, Arizona** webcam. This project captures images of the sun at solar noon and the moon at its meridian crossing, creating data for an [analemma](https://en.wikipedia.org/wiki/Analemma) photography project.

## 📍 Project Overview

| Parameter | Value |
|-----------|-------|
| **Target Location** | Ahwatukee - Phoenix, Arizona, USA |
| **Target Timezone** | UTC-7 (No Daylight Saving Time) |
| **User Location** | Santa Cruz, Bolivia |
| **User Timezone** | UTC-4 (America/La_Paz) |
| **Time Offset** | Bolivia is +3 hours ahead of Phoenix |

### Time Conversion Example
```
10:00 AM Phoenix (UTC-7) = 1:00 PM Bolivia (UTC-4)
```

## 🎥 Target Cameras

| Camera | Direction | URL |
|--------|-----------|-----|
| **North** | Primary | https://www.myearthcam.com/insideoutaerial/lowercam2 |
| **Northeast** | Secondary | https://www.myearthcam.com/insideoutaerial/lowercam3 |
| **West** | Tertiary | https://myearthcam.com/insideoutaerial |

**All 3 cameras are captured in parallel for each scheduled event.**

## 🛠️ Technology Stack

- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Browser Engine**: Puppeteer (Headless Chrome - New Mode)
- **Automation**: GitHub Actions (Scheduled Cron every 30 min)
- **Linter/Formatter**: Biome

## 📁 Project Structure

```
analema/
├── .github/workflows/
│   └── schedule.yml          # GitHub Actions workflow (every 30 min)
├── captures/                  # Screenshot output directory
│   ├── solar/
│   │   ├── north/            # Solar captures from north camera
│   │   ├── northeast/        # Solar captures from northeast camera
│   │   └── west/             # Solar captures from west camera
│   └── lunar/
│       ├── north/            # Lunar captures from north camera
│       ├── northeast/        # Lunar captures from northeast camera
│       └── west/             # Lunar captures from west camera
├── data/                      # Schedule data organized by type
│   ├── solar/
│   │   └── 2026-01.json      # Solar schedule for January 2026
│   └── lunar/
│       └── 2026-01.json      # Lunar schedule for January 2026
├── src/
│   ├── index.ts              # Production entry (scheduled captures)
│   ├── test.ts               # Test entry (immediate capture)
│   ├── config/index.ts       # Configuration constants
│   ├── services/
│   │   ├── ScheduleService.ts
│   │   └── CaptureService.ts
│   ├── types/index.ts
│   └── utils/Logger.ts
├── package.json
├── tsconfig.json
├── biome.json
└── .editorconfig
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
npm run test     # Immediate capture on all 3 cameras
npm start        # Check for scheduled captures in current 30-min window
npm run format   # Format code
npm run lint     # Lint code
npm run check    # Format + Lint
```

## 📅 Schedule Configuration

### How It Works

1. GitHub Actions runs **every 30 minutes** (at :00 and :30)
2. Script loads schedules from `data/solar/YYYY-MM/schedule.json` and `data/lunar/YYYY-MM/schedule.json`
3. If capture scheduled: waits until exact time, then captures **all 3 cameras in parallel**
4. All 3 browsers launch simultaneously, wait for streams, then screenshot at the same moment
5. Commits and pushes new captures to the repository

### Data Folder Structure

Each month has its own JSON file organized by type:

```
data/
├── solar/
│   ├── 2026-01.json      # Solar schedule for January 2026
│   ├── 2026-02.json      # Solar schedule for February 2026
│   └── ...
└── lunar/
    ├── 2026-01.json      # Lunar schedule for January 2026
    ├── 2026-02.json      # Lunar schedule for February 2026
    └── ...
```

To add a new month, create `data/solar/YYYY-MM.json` and `data/lunar/YYYY-MM.json` files.

### Schedule Entry Format

```json
{
  "phx.date": "2026-01-27",
  "phx.time": "21:30",
  "bob.date": "2026-01-28",
  "bob.time": "00:30",
  "dir": "southwest"
}
```

| Field | Description |
|-------|-------------|
| `phx.date` | Capture date in Phoenix timezone (YYYY-MM-DD) |
| `phx.time` | Capture time in Phoenix timezone (HH:MM, 24h, UTC-7) |
| `bob.date` | Capture date in Bolivia timezone (YYYY-MM-DD) |
| `bob.time` | Capture time in Bolivia timezone (HH:MM, 24h, UTC-4) |
| `dir` | Cardinal direction where celestial body is located |

> **Note**: When `phx.time + 3h` crosses midnight, `bob.date` advances to the next day.

## 📸 Output

Screenshots are saved with sequential numbering:

```
captures/solar/north/001_20260111_1535.png
captures/solar/northeast/001_20260111_1535.png
captures/solar/west/001_20260111_1535.png
```

**Filename format**: `[SEQ]_[DATE]_[TIME].png`

Sequential numbers are separate per type/camera, making animations easy to create.

## ⚙️ GitHub Actions

### Automatic Schedule

Runs every 30 minutes (`0,30 * * * *` in UTC).

### Manual Trigger

1. Go to **Actions** → **Sky Photographer - Scheduled Capture**
2. Click **"Run workflow"**
3. ✅ Check **"Force capture regardless of schedule"**
4. Click **"Run workflow"**

### Caching

- npm packages cached via `actions/setup-node`
- Puppeteer/Chromium (~170MB) cached via `actions/cache`

## 🔧 Configuration

### Key Settings (`src/config/index.ts`)

```typescript
STREAM_LOAD_WAIT_MS = 300000;  // 5 minutes for camera stream
VIEWPORT = { width: 1024, height: 690 };
```

### Parallel Capture

All 3 cameras launch simultaneously and take screenshots at the same moment, ensuring consistent timing across all captures.

## 📊 Data Sources

Schedule data is based on official astronomical data for Phoenix, Arizona:
- **Solar**: `solar_noon` times
- **Lunar**: `meridian_time` times with illumination percentage

All times converted from Phoenix (UTC-7) to Bolivia (UTC-4) by adding 3 hours.

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No captures | Check schedule has entries for current date and 30-min window |
| Stream not loading | Increase `STREAM_LOAD_WAIT_MS` (default 5 min) |
| Website blocking | Custom user-agent configured, may need proxy for datacenter IPs |
| Timezone issues | Ensure `TZ=America/La_Paz` set in workflow |

## 📝 License

MIT

---

*Automated sky photography from Phoenix, Arizona 🌵*
