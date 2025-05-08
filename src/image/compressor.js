const sharp = require('sharp');
const fs = require('fs').promises;

// Compress image until it meets the target size
async function compressImageUntilSize(inputPath, outputPath, targetSizeKB = 100) {
    let quality = 85;
    const targetSizeBytes = targetSizeKB * 1024;

    while (quality > 1) {
        await sharp(inputPath)
            .resize({ width: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality, alphaQuality: quality, lossless: false, nearLossless: false, effort: 6 })
            .toFile(outputPath);

        const stats = await fs.stat(outputPath);
        if (stats.size <= targetSizeBytes) return;

        quality = Math.max(1, quality - 15);
    }

    throw new Error(`Unable to compress image under ${targetSizeKB}KB`);
}

module.exports = { compressImageUntilSize };
