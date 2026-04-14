const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const cors = require('cors');
const { JSDOM } = require('jsdom');
const app = express();


app.use(cors());

async function getFaviconFromHtml(baseUrl) {
    try {
        const response = await axios.get(baseUrl, {
            headers: { 'User-Agent': 'Roblox/WinInet' },
            timeout: 5000
        });
        const dom = new JSDOM(response.data);
        const icon = dom.window.document.querySelector('link[rel*="icon"]');
        return icon && icon.href ? new URL(icon.href, baseUrl).href : null;
    } catch (e) { return null; }
}
// ME So Tuffy Boi
app.get('/proxyboi', async (req, res) => {
    let { url, size, isFavicon } = req.query;
    if (!url) return res.status(400).send('url is fucking required!');
    if (!url.startsWith('http')) url = 'http://' + url;

    try {
        let finalUrl = url;


        if (isFavicon === 'true') {
            const directIco = new URL('/favicon.ico', url).href;
            try {
                await axios.head(directIco, { headers: { 'User-Agent': 'Roblox/WinInet' } });
                finalUrl = directIco;
            } catch (e) {
                const scraped = await getFaviconFromHtml(url);
                finalUrl = scraped || directIco; 
            }
        }


        const response = await axios.get(finalUrl, {
            headers: { 'User-Agent': 'Roblox/WinInet', 'Accept': '*/*' },
            responseType: 'arraybuffer',
            timeout: 10000
        });

        let data = response.data;
        let contentType = response.headers['content-type'] || 'image/png';


        if (size && contentType.startsWith('image/')) {
            const targetSize = parseInt(size);
            data = await sharp(data)
                .resize(targetSize, targetSize, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toBuffer();
            contentType = 'image/png';
        }

        res.set('Content-Type', contentType);
        res.set('Access-Control-Allow-Origin', '*'); 
        res.send(data);

    } catch (error) {
        res.status(500).send(`error: ${error.message}`);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`proxy running on port ${PORT}`));
