const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning' || msg.text().includes('THREE.WebGLProgram')) {
            console.log('CONSOLE:', msg.text());
        }
    });

    await page.goto('http://localhost:5173/dungeon/play/engine-fortaleza', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
})();
