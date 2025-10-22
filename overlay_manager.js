const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class OverlayManager {
    constructor(cacheDir = '/tmp/stream_overlays') {
        this.cacheDir = cacheDir;
        this.overlays = {};
        
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        console.log(`[OverlayManager] Init: ${this.cacheDir}`);
    }

    getCachePath(url) {
        const hash = crypto.createHash('md5').update(url).digest('hex');
        let ext = '.png';
        const urlPath = url.split('?')[0];
        const urlExt = path.extname(urlPath);
        if (urlExt) ext = urlExt;
        return path.join(this.cacheDir, `${hash}${ext}`);
    }

    async downloadImage(url) {
        return new Promise((resolve, reject) => {
            const cachePath = this.getCachePath(url);
            
            if (fs.existsSync(cachePath)) {
                resolve(cachePath);
                return;
            }

            const protocol = url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(cachePath);

            const request = protocol.get(url, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    fs.unlinkSync(cachePath);
                    this.downloadImage(response.headers.location).then(resolve).catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    fs.unlinkSync(cachePath);
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(cachePath);
                });
                file.on('error', (err) => {
                    fs.unlinkSync(cachePath);
                    reject(err);
                });
            });

            request.on('error', (err) => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                reject(err);
            });

            request.setTimeout(30000, () => {
                request.destroy();
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
                reject(new Error('Timeout'));
            });
        });
    }

    async setOverlay(channelId, config) {
        if (!config || !config.url) {
            delete this.overlays[channelId];
            return { success: true, message: 'Overlay removed' };
        }

        try {
            const localPath = await this.downloadImage(config.url);

            this.overlays[channelId] = {
                url: config.url,
                localPath: localPath,
                x: config.x || 0,
                y: config.y || 0,
                width: config.width || null,
                height: config.height || null,
                alpha: config.alpha !== undefined ? config.alpha : 1.0,
                enabled: config.enabled !== undefined ? config.enabled : true
            };

            return {
                success: true,
                message: 'Overlay ready',
                overlay: this.overlays[channelId]
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getOverlay(channelId) {
        return this.overlays[channelId] || null;
    }

    removeOverlay(channelId) {
        delete this.overlays[channelId];
        return { success: true, message: 'Removed' };
    }

    getOverlayElements(channelId) {
        const overlay = this.overlays[channelId];
        
        if (!overlay || !overlay.enabled || !fs.existsSync(overlay.localPath)) {
            return '';
        }

        const el = ['gdkpixbufoverlay', `location="${overlay.localPath}"`, `offset-x=${overlay.x}`, `offset-y=${overlay.y}`, `alpha=${overlay.alpha}`];
        
        if (overlay.width && overlay.height) {
            el.push(`overlay-width=${overlay.width}`, `overlay-height=${overlay.height}`);
        }

        return '! ' + el.join(' ') + ' ';
    }

    async refreshOverlay(channelId) {
        const overlay = this.overlays[channelId];
        if (!overlay) return { success: false, message: 'No overlay' };

        try {
            const cachePath = this.getCachePath(overlay.url);
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            const localPath = await this.downloadImage(overlay.url);
            overlay.localPath = localPath;
            return { success: true, message: 'Refreshed' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    getAllOverlays() {
        return this.overlays;
    }
}

module.exports = OverlayManager;
