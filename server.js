import express from "express";
import cors from "cors";
import { chromium } from "playwright";
import bodyParser from "body-parser";

const app = express();

const allowedOrigins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://platform.uplers.com",
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server or tools with no origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("❌ CORS BLOCKED:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.text({ limit: "5mb", type: ["text/html", "application/xhtml+xml"] }));

app.post("/generate-pdf", async (req, res) => {
    console.log("🔥 Incoming Origin:", req.headers.origin);
    const html = typeof req.body === "string" ? req.body : req.body?.html;
    if (!html) return res.status(400).json({ error: "Missing HTML" });

    const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

    await page.setContent(html, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();

    res.set({
        "Content-Type": "application/pdf",
        "Content-Length": pdf.length,
        "Content-Disposition": "attachment; filename=resume.pdf"
    });

    res.send(pdf);
});

app.listen(3000, () => console.log("PDF server running on port 3000"));