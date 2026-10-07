// Пересобрать public/trackers.pdf из страницы /pdf (нужен запущенный сайт и Google Chrome):
//   npm i -D puppeteer-core && npm run pdf
import puppeteer from "puppeteer-core";

const url = process.env.PDF_SOURCE || "http://localhost:3000/pdf";
const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new" });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle0" });
await page.pdf({ path: "public/trackers.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("Готово: public/trackers.pdf");
