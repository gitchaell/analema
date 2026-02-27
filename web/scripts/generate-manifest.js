import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to captures relative to this script
// web/scripts/generate-manifest.js -> web/public/captures
const CAPTURES_DIR = path.join(__dirname, '../public/captures');
const OUTPUT_FILE = path.join(__dirname, '../src/data/manifest.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

function getDirectories(srcPath) {
	if (!fs.existsSync(srcPath)) return [];
	return fs.readdirSync(srcPath).filter(file => {
		// avoid trying to read stats of broken symlinks or non-directories
		try {
			return fs.statSync(path.join(srcPath, file)).isDirectory();
		} catch (e) {
			return false;
		}
	});
}

function getImages(srcPath) {
	if (!fs.existsSync(srcPath)) return [];
	return fs.readdirSync(srcPath).filter(file => {
		const ext = path.extname(file).toLowerCase();
		return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
	}).sort(); // Default sort matches the timestamp prefix
}

const manifest = [];

const locations = getDirectories(CAPTURES_DIR);

locations.forEach(location => {
	if (location === 'test') return; // Skip test dir if needed

	const locationPath = path.join(CAPTURES_DIR, location);
	const objects = getDirectories(locationPath);

	objects.forEach(object => {
		// object is 'sun' or 'moon'
		const objectPath = path.join(locationPath, object);
		const cameras = getDirectories(objectPath);

		cameras.forEach(camera => {
			const cameraPath = path.join(objectPath, camera);
			const images = getImages(cameraPath);

			if (images.length > 0) {
				const id = `${location}-${object}-${camera}`;
				const imageUrls = images.map(img => `/captures/${location}/${object}/${camera}/${img}`);

				manifest.push({
					id,
					location,
					object,
					camera,
					count: images.length,
					preview: imageUrls[0],
					images: imageUrls
				});
			}
		});
	});
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`Generated manifest with ${manifest.length} sequences at ${OUTPUT_FILE}`);
