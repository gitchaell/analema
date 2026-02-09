#!/usr/bin/env npx ts-node
/**
 * =============================================================================
 * SOLAR AND LUNAR ANALEMMA - Animation Generator
 * =============================================================================
 *
 * Generates animated GIFs or MP4 videos from captured images.
 * Uses ffmpeg for video generation.
 *
 * Usage:
 *   npx ts-node scripts/generate-animation.ts [location] [object] [camera] [format]
 *
 * Examples:
 *   npx ts-node scripts/generate-animation.ts usa-arizona-phoenix sun north gif
 *   npx ts-node scripts/generate-animation.ts usa-arizona-phoenix moon multiple mp4
 *   npx ts-node scripts/generate-animation.ts usa-arizona-phoenix all all gif
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LOCATIONS } from '../src/config/locations';
import type {
	CameraDirection,
	CelestialObject,
	LocationId
} from '../src/domain/entities/Types';

const CAPTURES_DIR = path.join(__dirname, '..', 'captures');
const OUTPUT_DIR = path.join(__dirname, '..', 'animations');

const OBJECTS = ['sun', 'moon'] as const;
const CAMERAS = [
	'north',
	'south',
	'east',
	'west',
	'northeast',
	'northwest',
	'southeast',
	'southwest',
	'multiple',
] as const;

type OutputFormat = 'gif' | 'mp4';

interface GenerateOptions {
	locationId: LocationId | 'all';
	object: CelestialObject | 'all';
	direction: CameraDirection | 'all';
	format: OutputFormat;
	fps?: number;
}

function checkFfmpeg(): boolean {
	try {
		execSync('ffmpeg -version', { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
}

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function getImages(
	locationId: LocationId,
	object: CelestialObject,
	direction: CameraDirection,
): string[] {
	const dir = path.join(CAPTURES_DIR, locationId, object, direction);
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter(
			(f) => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'),
		)
		.sort() // Sort by filename (date-based naming ensures chronological order)
		.map((f) => path.join(dir, f));
}

function generateAnimation(
	images: string[],
	outputPath: string,
	format: OutputFormat,
	fps: number = 4,
): boolean {
	if (images.length === 0) {
		console.log(`   ⚠️  No images found, skipping...`);
		return false;
	}

	console.log(`   📸 Processing ${images.length} images...`);

	// Create a temporary file list for ffmpeg
	const listFile = path.join(OUTPUT_DIR, 'temp_images.txt');
	const listContent = images
		.map((img) => `file '${img}'\nduration ${1 / fps}`)
		.join('\n');
	fs.writeFileSync(listFile, listContent);

	try {
		if (format === 'gif') {
			// Generate palette for better GIF quality
			const paletteFile = path.join(OUTPUT_DIR, 'palette.png');
			execSync(
				`ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "fps=${fps},scale=640:-1:flags=lanczos,palettegen" "${paletteFile}"`,
				{ stdio: 'pipe' },
			);
			execSync(
				`ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${paletteFile}" -lavfi "fps=${fps},scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" "${outputPath}"`,
				{ stdio: 'pipe' },
			);
			fs.unlinkSync(paletteFile);
		} else {
			// Generate MP4
			execSync(
				`ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "fps=${fps},scale=1280:-2" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`,
				{ stdio: 'pipe' },
			);
		}

		fs.unlinkSync(listFile);
		console.log(`   ✅ Created: ${outputPath}`);
		return true;
	} catch (error) {
		console.error(`   ❌ Error generating animation: ${error}`);
		if (fs.existsSync(listFile)) fs.unlinkSync(listFile);
		return false;
	}
}

function generate(options: GenerateOptions): void {
	const { locationId, object, direction, format, fps = 4 } = options;

	// Check if ffmpeg is installed
	if (!checkFfmpeg()) {
		console.error('❌ ffmpeg is not installed or not in PATH');
		console.error('   Install it with: sudo apt install ffmpeg (Linux)');
		console.error('                  : brew install ffmpeg (macOS)');
		console.error('                  : https://ffmpeg.org/download.html (Windows)');
		process.exit(1);
	}

	ensureDir(OUTPUT_DIR);

	const locationsToProcess =
		locationId === 'all' ? LOCATIONS.map((l) => l.id) : [locationId];
	const objectsToProcess = object === 'all' ? OBJECTS : [object];
	const directionsToProcess =
		direction === 'all' ? CAMERAS : [direction];

	console.log('\n🎬 SOLAR AND LUNAR ANALEMMA ANIMATION GENERATOR\n');
	console.log(`Format: ${format.toUpperCase()}`);
	console.log(`FPS: ${fps}`);
	console.log(`Output: ${OUTPUT_DIR}\n`);

	let generated = 0;

	for (const locId of locationsToProcess) {
		for (const obj of objectsToProcess) {
			for (const dir of directionsToProcess) {
				// Only process if folder exists (optimization)
				const dirPath = path.join(CAPTURES_DIR, locId, obj, dir);
				if (!fs.existsSync(dirPath)) continue;

				console.log(
					`\n📁 ${locId.toUpperCase()} / ${obj.toUpperCase()} / ${dir.toUpperCase()}`,
				);

				const images = getImages(locId, obj, dir);
				const outputFile = path.join(
					OUTPUT_DIR,
					`${locId}-${obj}-${dir}.${format}`,
				);

				if (generateAnimation(images, outputFile, format, fps)) {
					generated++;
				}
			}
		}
	}

	console.log(`\n✨ Done! Generated ${generated} animation(s)\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const locationId = (args[0] || 'all') as LocationId | 'all';
const object = (args[1] || 'all') as CelestialObject | 'all';
const direction = (args[2] || 'all') as CameraDirection | 'all';
const format = (args[3] || 'gif') as OutputFormat;
const fps = parseInt(args[4] || '4', 10);

// Validate
const validLocationIds = LOCATIONS.map((l) => l.id);
if (locationId !== 'all' && !validLocationIds.includes(locationId)) {
	console.error(
		`Invalid location: ${locationId}. Use: ${validLocationIds.join(', ')} or all`,
	);
	process.exit(1);
}
if (object !== 'all' && !OBJECTS.includes(object as CelestialObject)) {
	console.error(`Invalid object: ${object}. Use: sun, moon, or all`);
	process.exit(1);
}
// Basic validation for direction, though we support many
if (direction !== 'all' && !CAMERAS.includes(direction as CameraDirection)) {
	console.warn(`Warning: Unknown camera direction: ${direction}`);
}
if (format !== 'gif' && format !== 'mp4') {
	console.error(`Invalid format: ${format}. Use: gif or mp4`);
	process.exit(1);
}

generate({ locationId, object, direction, format, fps });
