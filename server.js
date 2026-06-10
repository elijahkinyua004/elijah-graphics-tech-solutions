const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
// Integration for permanent image hosting
// Important: Run 'npm install cloudinary'
const cloudinary = require('cloudinary').v2;

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const IMAGE_DB = path.join(DATA_DIR, 'images.json');
const MAX_UPLOAD_BYTES = 120 * 1024 * 1024; // Still good for individual upload size limit

// Cloudinary Configuration (Set these in your Environment Variables for Vercel)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', // Added for consistency
    '.png': 'image/png', 
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml'
};

const allowedImageTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/avif',
    'image/svg+xml'
]);

async function ensureStorage() {
    await fsp.mkdir(UPLOADS_DIR, { recursive: true });
    await fsp.mkdir(DATA_DIR, { recursive: true });

    try {
        await fsp.access(IMAGE_DB);
    } catch {
        await fsp.writeFile(IMAGE_DB, '[]');
    }
}

async function readImageDatabase() {
    await ensureStorage();
    const content = await fsp.readFile(IMAGE_DB, 'utf8');
    try { // Optimization: Handle empty or corrupted JSON gracefully
        return JSON.parse(content || '[]');
    } catch (e) {
        return []; // Return empty if file is corrupted
    }
}

async function writeImageDatabase(images) {
    await ensureStorage();
    await fsp.writeFile(IMAGE_DB, JSON.stringify(images, null, 2));
}

async function removeStoredImage(image) {
    if (!image) {
        return;
    }

    // Delete from Cloudinary if publicId exists
    if (image.publicId) {
        try { await cloudinary.uploader.destroy(image.publicId); } catch (e) {}
    }

    try {
        if (image.fileName) await fsp.unlink(path.join(UPLOADS_DIR, image.fileName));
    } catch {
        // Optimization: Log error but don't block if file is already gone
    }
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*' 
    });
    res.end(JSON.stringify(data));
}

function sanitizeFileName(fileName) {
    return path.basename(fileName).replace(/[^a-z0-9._-]/gi, '_');
}

function getExtension(fileName, contentType) {
    // All images are compressed to JPEG by the client before being sent,
    // so we ensure the file is saved with the correct .jpg extension.
    return '.jpg';
}

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalBytes = 0;

        req.on('data', chunk => {
            totalBytes += chunk.length;

            if (totalBytes > MAX_UPLOAD_BYTES) { // Optimization: Enforce max upload size
                req.pause();
                return reject(new Error('Upload is too large. Please keep the total under 120MB.'));
            }

            chunks.push(chunk);
        });

        req.on('end', () => {
            if (totalBytes <= MAX_UPLOAD_BYTES) { // Ensure no overflow before resolving
                resolve(Buffer.concat(chunks));
            }
        });

        req.on('error', reject);
    });
}

async function parseMultipartImages(req) {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    // Optimization: Robust boundary parsing
    if (!boundaryMatch) {
        throw new Error('Missing upload boundary.');
    }

    const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
    const body = await collectRequestBody(req);
    const images = [];
    let start = body.indexOf(boundary);
    // Optimization: Iterate through multipart parts
    while (start !== -1) {
        start += boundary.length;

        if (body[start] === 45 && body[start + 1] === 45) {
            break;
        }

        if (body[start] === 13 && body[start + 1] === 10) {
            start += 2;
        }

        const nextBoundary = body.indexOf(boundary, start);

        if (nextBoundary === -1) {
            break;
        }

        let partEnd = nextBoundary;

        if (body[partEnd - 2] === 13 && body[partEnd - 1] === 10) {
            partEnd -= 2;
        }

        const part = body.subarray(start, partEnd);
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));

        if (headerEnd !== -1) {
            const headers = part.subarray(0, headerEnd).toString('utf8');
            const fileContent = part.subarray(headerEnd + 4);
            const nameMatch = headers.match(/name=["']?([^"';\r\n]+)["']?/i); // Optimization: Extract field name
            const fileNameMatch = headers.match(/filename=["']?([^"';\r\n]*)["']?/i);
            const typeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
            const fieldName = nameMatch ? nameMatch[1] : '';
            const originalName = fileNameMatch ? sanitizeFileName(fileNameMatch[1].trim()) : '';
            const imageType = typeMatch ? typeMatch[1].trim().toLowerCase() : '';

            if (
                fieldName === 'images' &&
                originalName &&
                allowedImageTypes.has(imageType) &&
                fileContent.length
            ) {
                images.push({
                    buffer: fileContent,
                    contentType: imageType,
                    originalName
                });
            }
        }

        start = nextBoundary;
    }

    return images;
}

async function handleImageUpload(req, res) {
    try {
        const uploadedImages = await parseMultipartImages(req); // Optimization: Parse all images from request

        if (!uploadedImages.length) {
            sendJson(res, 400, { message: 'Please upload at least one valid image.' });
            return;
        }

        const savedImages = [];

        for (const image of uploadedImages) {
            // Upload directly to Cloudinary for permanent storage
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'portfolio_gallery' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(image.buffer);
            });

            if (uploadResult) {
                const originalBase = path.parse(image.originalName).name;
                savedImages.push({
                    id: crypto.randomUUID(),
                    originalName: image.originalName,
                    name: originalBase,
                    publicId: uploadResult.public_id, // Store for deletion
                    url: uploadResult.secure_url, // Permanent Hosted URL
                    createdAt: new Date().toISOString()
                });
            }
        }

        // WARNING: Local JSON files like images.json will reset on Vercel deployments.
        // For permanent metadata storage, consider using a Database (MongoDB, Supabase, etc).
        const existingImages = await readImageDatabase();
        const allImages = [...savedImages, ...existingImages]; // Optimization: New images are added to the front

        await writeImageDatabase(allImages);

        sendJson(res, 201, { // Optimization: Return 201 Created status
            message: 'Images uploaded successfully.',
            images: savedImages, // Return all newly saved images
            totalImages: allImages.length // Total images in the gallery
        });
    } catch (error) {
        console.error('Upload Error:', error); // Optimization: Log detailed errors
        sendJson(res, 500, { message: error.message || 'Upload failed.' });
    }
}

async function handleImageDelete(req, res, imageId) {
    try {
        let images = await readImageDatabase();
        const imageToDelete = images.find(img => img.id === imageId);

        if (!imageToDelete) {
            sendJson(res, 404, { message: 'Image not found.' });
            return;
        }

        await removeStoredImage(imageToDelete); // Delete file from disk
        images = images.filter(img => img.id !== imageId); // Remove from database
        await writeImageDatabase(images);

        sendJson(res, 200, {
            message: 'Image deleted successfully.',
            totalImages: images.length
        });
    } catch (error) {
        console.error('Delete Error:', error);
        sendJson(res, 500, { message: error.message || 'Delete failed.' });
    }
}

async function serveStaticFile(req, res) { // Optimization: Serve static files
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const requestedPath = decodeURIComponent(requestUrl.pathname);
    const safePath = requestedPath === '/' ? '/index.html' : requestedPath;
    const filePath = path.normalize(path.join(ROOT_DIR, safePath));
    // Optimization: Prevent directory traversal attacks
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    try {
        const file = await fsp.readFile(filePath);
        const extension = path.extname(filePath).toLowerCase(); // Optimization: Determine MIME type
        res.writeHead(200, {
            'Content-Type': mimeTypes[extension] || 'application/octet-stream'
        });
        res.end(file);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
    }
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname.replace(/\/$/, '') || '/';

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // Optimization: API endpoint for fetching all images
    if (req.method === 'GET' && pathname === '/api/images') {
        const images = await readImageDatabase(); // Optimization: Read from database
        sendJson(res, 200, images);
        return;
    }

    // Optimization: API endpoint for deleting an image
    const deleteMatch = pathname.match(/^\/api\/images\/([a-f0-9-]+)$/i);
    if (req.method === 'DELETE' && deleteMatch) {
        await handleImageDelete(req, res, deleteMatch[1]);
        return;
    }

    // Optimization: API endpoint for uploading images
    if (req.method === 'POST' && pathname === '/api/upload') {
        await handleImageUpload(req, res);
        return;
    }

    if (req.method === 'GET') {
        await serveStaticFile(req, res);
        return;
    }

    sendJson(res, 405, { message: 'Method not allowed.' }); // Optimization: Handle unsupported methods
});

ensureStorage().then(() => {
    server.listen(PORT, () => {
        console.log(`Portfolio running at http://localhost:${PORT}`);
    });
});
