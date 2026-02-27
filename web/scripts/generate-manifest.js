import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to captures relative to this script
const CAPTURES_DIR = path.join(__dirname, "../../captures");
const PROCESSED_DIR = path.join(__dirname, "../public/processed");
const OUTPUT_FILE = path.join(__dirname, "../src/data/manifest.json");

// Ensure directories exist
const outputDirs = [path.dirname(OUTPUT_FILE), PROCESSED_DIR];
outputDirs.forEach((dir) => {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
});

function getDirectories(srcPath) {
	if (!fs.existsSync(srcPath)) return [];
	return fs.readdirSync(srcPath).filter((file) => {
		try {
			return fs.statSync(path.join(srcPath, file)).isDirectory();
		} catch (e) {
			return false;
		}
	});
}

function getImages(srcPath) {
	if (!fs.existsSync(srcPath)) return [];
	return fs
		.readdirSync(srcPath)
		.filter((file) => {
			const ext = path.extname(file).toLowerCase();
			return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
		})
		.sort();
}

async function processImage(inputPath, outputPath, width, quality = 80) {
	if (fs.existsSync(outputPath)) return; // Simple cache

	const dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	try {
		await sharp(inputPath)
			.resize(width, null, { withoutEnlargement: true })
			.webp({ quality })
			.toFile(outputPath);
	} catch (err) {
		console.error(`Error processing ${inputPath}:`, err);
	}
}

async function generate() {
	const manifest = [];
	const locations = getDirectories(CAPTURES_DIR);

	console.log("🚀 Starting image optimization...");

	for (const location of locations) {
		if (location === "test") continue;

		const locationPath = path.join(CAPTURES_DIR, location);
		const objects = getDirectories(locationPath);

		for (const object of objects) {
			const objectPath = path.join(locationPath, object);
			const cameras = getDirectories(objectPath);

			for (const camera of cameras) {
				const cameraPath = path.join(objectPath, camera);
				const images = getImages(cameraPath);

				if (images.length > 0) {
					const id = `${location}-${object}-${camera}`;
					const processedIdDir = path.join(PROCESSED_DIR, id);

					const imageUrls = [];
					const processingTasks = [];

					// Process all images for the player (Optimized)
					for (let i = 0; i < images.length; i++) {
						const img = images[i];
						const inputPath = path.join(cameraPath, img);
						const outputName = `frame_${i.toString().padStart(4, '0')}.webp`;
						const outputPath = path.join(processedIdDir, outputName);

						imageUrls.push(`/processed/${id}/${outputName}`);

						// Resize for player (e.g., 1280px wide)
						processingTasks.push(processImage(inputPath, outputPath, 1280, 75));
					}

					// Process preview image (Thumbnail - 600px)
					const previewInputPath = path.join(cameraPath, images[0]);
					const previewOutputPath = path.join(processedIdDir, "preview.webp");
					processingTasks.push(processImage(previewInputPath, previewOutputPath, 600, 80));

					// Wait for this batch to complete (or keep them async)
					// To avoid overwhelming the system, we can process in batches or all at once
					await Promise.all(processingTasks);

					manifest.push({
						id,
						location,
						object,
						camera,
						count: images.length,
						preview: `/processed/${id}/preview.webp`,
						images: imageUrls,
					});

					console.log(`✅ Processed: ${id} (${images.length} frames)`);
				}
			}
		}
	}

	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
	console.log(
		`\n✨ Manifest generated with ${manifest.length} sequences at ${OUTPUT_FILE}`,
	);
}

generate().catch(console.error);

