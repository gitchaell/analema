const sharp = require('sharp');
const fs = require('fs');
const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><rect width="24" height="24" fill="#f59e0b"/><circle cx="12" cy="12" r="8" fill="#fff"/></svg>');
sharp(svgBuffer).resize(192, 192).toFile('web/public/icons/icon-192x192.png');
sharp(svgBuffer).resize(512, 512).toFile('web/public/icons/icon-512x512.png');
