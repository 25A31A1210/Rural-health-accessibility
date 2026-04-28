const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const twilio = require('twilio');

const app = express();

// 🟢 PORT Configuration
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Static Files Path
// ఒకవేళ మీ HTML ఫైల్స్ 'frontend' అనే ఫోల్డర్ లో ఉంటే ఇది సరిపోతుంది
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

let otpStore = {};

// 🔑 Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
if (accountSid && authToken) {
    client = new twilio(accountSid, authToken);
}

// -----------------------------------------
// 1️⃣ API ROUTES (OTP, Emergency, AI)
// -----------------------------------------

app.post('/api/send-otp', async (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).send({ message: "Phone number is required!" });
    
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[number] = otp;
    console.log(`📩 OTP for ${number}: ${otp}`);

    try {
        if (!client) throw new Error("Twilio credentials missing");
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+91' + number,
            body: `Your HealthSeva OTP is ${otp}`
        });
        res.status(200).send({ success: true, message: "OTP Sent on WhatsApp" });
    } catch (error) {
        res.status(500).send({ success: false, message: "WhatsApp sending failed" });
    }
});

app.post('/api/verify-otp', (req, res) => {
    const { number, otp } = req.body;
    if (otpStore[number] && otpStore[number] === otp) {
        delete otpStore[number];
        return res.status(200).send({ success: true, message: "Verification Successful" });
    } else {
        return res.status(400).send({ success: false, message: "Invalid OTP" });
    }
});

app.post('/api/send-emergency', async (req, res) => {
    const { location } = req.body;
    const targetNumber = "7569194766";
    try {
        if (!client) throw new Error("Twilio credentials missing");
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+91' + targetNumber,
            body: `🚨 HealthSeva Emergency ALERT!\n\n📍 Location: ${location || 'Village'}\n\n⚠️ Someone needs immediate medical help.`
        });
        res.status(200).send({ success: true, message: "Emergency Alert Sent on WhatsApp!" });
    } catch (error) {
        res.status(500).send({ success: false, message: "Emergency Failed" });
    }
});

app.get('/api/data', (req, res) => {
    res.json({
        hospitals: [{ name: "Apollo Rural", dist: "2km" }, { name: "KIMS Village", dist: "5km" }],
        medicines: ["Paracetamol", "Cough Syrup", "Pain Relief"]
    });
});

app.post('/api/ai-detect', (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) return res.json({ advice: "Please tell your symptoms." });
    const t = symptoms.toLowerCase();
    const isTeluguInput = /[\u0c00-\u0c7f]/.test(t);
    let advice = isTeluguInput ? "దయచేసి మీ లక్షణాలను స్పష్టంగా వివరించండి." : "Please describe symptoms clearly.";
    if(t.includes("fever") || t.includes("జ్వరం")) {
        advice = isTeluguInput ? "మీకు జ్వరం ఉన్నట్లు అనిపిస్తుంది. విశ్రాంతి తీసుకోండి." : "Likely fever. Take rest & Paracetamol.";
    }
    res.json({ advice });
});

// -----------------------------------------
// 🟢 FIXED: PAGE ROUTES (ఇక్కడ మార్పులు చేశాను)
// -----------------------------------------

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// మీరు బ్రౌజర్‌లో /server అని టైప్ చేసినప్పుడు ఇది పని చేస్తుంది
app.get('/server', (req, res) => {
    res.sendFile(path.join(frontendPath, 'server.html'));
});

app.get('/person', (req, res) => res.sendFile(path.join(frontendPath, 'person_details.html')));
app.get('/hospital', (req, res) => res.sendFile(path.join(frontendPath, 'hospitals.html')));
app.get('/medicine', (req, res) => res.sendFile(path.join(frontendPath, 'tablets.html')));
app.get('/ai', (req, res) => res.sendFile(path.join(frontendPath, 'ai_detection.html')));
app.get('/reviews', (req, res) => res.sendFile(path.join(frontendPath, 'reviews.html')));
app.get('/emergency', (req, res) => res.sendFile(path.join(frontendPath, 'emergency_sos.html')));

// -----------------------------------------
// Server Listen
// -----------------------------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
