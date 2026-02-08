#!/usr/bin/env npx ts-node
"use strict";
/**
 * =============================================================================
 * ANALEMA SOLAR Y LUNAR - Animation Generator
 * =============================================================================
 *
 * Generates animated GIFs or MP4 videos from captured images.
 * Uses ffmpeg for video generation.
 *
 * Usage:
 *   npx ts-node scripts/generate-animation.ts [type] [camera] [format]
 *
 * Examples:
 *   npx ts-node scripts/generate-animation.ts solar north gif
 *   npx ts-node scripts/generate-animation.ts lunar multiple mp4
 *   npx ts-node scripts/generate-animation.ts all all gif
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const CAPTURES_DIR = path.join(__dirname, '..', 'captures');
const OUTPUT_DIR = path.join(__dirname, '..', 'animations');
const TYPES = ['solar', 'lunar'];
const CAMERAS = ['north', 'northeast', 'multiple', 'west'];
function checkFfmpeg() {
    try {
        (0, node_child_process_1.execSync)('ffmpeg -version', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function getImages(type, camera) {
    const dir = path.join(CAPTURES_DIR, type, camera);
    if (!fs.existsSync(dir))
        return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
        .sort() // Sort by filename (date-based naming ensures chronological order)
        .map(f => path.join(dir, f));
}
function generateAnimation(images, outputPath, format, fps = 4) {
    if (images.length === 0) {
        console.log(`   ⚠️  No images found, skipping...`);
        return false;
    }
    console.log(`   📸 Processing ${images.length} images...`);
    // Create a temporary file list for ffmpeg
    const listFile = path.join(OUTPUT_DIR, 'temp_images.txt');
    const listContent = images.map(img => `file '${img}'\nduration ${1 / fps}`).join('\n');
    fs.writeFileSync(listFile, listContent);
    try {
        if (format === 'gif') {
            // Generate palette for better GIF quality
            const paletteFile = path.join(OUTPUT_DIR, 'palette.png');
            (0, node_child_process_1.execSync)(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "fps=${fps},scale=640:-1:flags=lanczos,palettegen" "${paletteFile}"`, { stdio: 'pipe' });
            (0, node_child_process_1.execSync)(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -i "${paletteFile}" -lavfi "fps=${fps},scale=640:-1:flags=lanczos[x];[x][1:v]paletteuse" "${outputPath}"`, { stdio: 'pipe' });
            fs.unlinkSync(paletteFile);
        }
        else {
            // Generate MP4
            (0, node_child_process_1.execSync)(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -vf "fps=${fps},scale=1280:-2" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`, { stdio: 'pipe' });
        }
        fs.unlinkSync(listFile);
        console.log(`   ✅ Created: ${outputPath}`);
        return true;
    }
    catch (error) {
        console.error(`   ❌ Error generating animation: ${error}`);
        if (fs.existsSync(listFile))
            fs.unlinkSync(listFile);
        return false;
    }
}
function generate(options) {
    const { type, camera, format, fps = 4 } = options;
    // Check if ffmpeg is installed
    if (!checkFfmpeg()) {
        console.error('❌ ffmpeg is not installed or not in PATH');
        console.error('   Install it with: sudo apt install ffmpeg (Linux)');
        console.error('                  : brew install ffmpeg (macOS)');
        console.error('                  : https://ffmpeg.org/download.html (Windows)');
        process.exit(1);
    }
    ensureDir(OUTPUT_DIR);
    const typesToProcess = type === 'all' ? TYPES : [type];
    const camerasToProcess = camera === 'all' ? CAMERAS : [camera];
    console.log('\n🎬 ANALEMA ANIMATION GENERATOR\n');
    console.log(`Format: ${format.toUpperCase()}`);
    console.log(`FPS: ${fps}`);
    console.log(`Output: ${OUTPUT_DIR}\n`);
    let generated = 0;
    for (const t of typesToProcess) {
        for (const c of camerasToProcess) {
            console.log(`\n📁 ${t.toUpperCase()} / ${c.toUpperCase()}`);
            const images = getImages(t, c);
            const outputFile = path.join(OUTPUT_DIR, `${t}-${c}.${format}`);
            if (generateAnimation(images, outputFile, format, fps)) {
                generated++;
            }
        }
    }
    console.log(`\n✨ Done! Generated ${generated} animation(s)\n`);
}
// Parse command line arguments
const args = process.argv.slice(2);
const type = (args[0] || 'all');
const camera = (args[1] || 'all');
const format = (args[2] || 'gif');
const fps = parseInt(args[3] || '4', 10);
// Validate
if (type !== 'all' && !TYPES.includes(type)) {
    console.error(`Invalid type: ${type}. Use: solar, lunar, or all`);
    process.exit(1);
}
if (camera !== 'all' && !CAMERAS.includes(camera)) {
    console.error(`Invalid camera: ${camera}. Use: north, northeast, multiple, west, or all`);
    process.exit(1);
}
if (format !== 'gif' && format !== 'mp4') {
    console.error(`Invalid format: ${format}. Use: gif or mp4`);
    process.exit(1);
}
generate({ type, camera, format, fps });
