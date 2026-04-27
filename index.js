const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const twilio = require('twilio');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 📂 Frontend Path
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

let otpStore = {};

// 🔑 Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;;

const client = new twilio(accountSid, authToken);

// -----------------------------------------
// 1️⃣ SEND OTP (WhatsApp)
// -----------------------------------------
app.post('/api/send-otp', async (req, res) => {
    const { number } = req.body;

    if (!number) {
        return res.status(400).send({ message: "Phone number is required!" });
    }

    if (number !== "6303317734") {
        return res.status(400).send({ message: "Unauthorized Number!" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[number] = otp;

    console.log(`📩 OTP for ${number}: ${otp}`);

    try {
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+91' + 6303317734,
            body: `Your HealthSeva OTP is ${otp}`
        });

        res.status(200).send({
            success: true,
            message: "OTP Sent on WhatsApp"
        });

    } catch (error) {
        console.log("WhatsApp ERROR:", error.message);

        res.status(500).send({
            success: false,
            message: "WhatsApp sending failed"
        });
    }
});

// -----------------------------------------
// 2️⃣ VERIFY OTP
// -----------------------------------------
app.post('/api/verify-otp', (req, res) => {
    const { number, otp } = req.body;

    if (otpStore[number] && otpStore[number] === otp) {
        delete otpStore[number];
        return res.status(200).send({
            success: true,
            message: "Verification Successful"
        });
    } else {
        return res.status(400).send({
            success: false,
            message: "Invalid OTP"
        });
    }
});

// -----------------------------------------
// 3️⃣ EMERGENCY (WhatsApp)
// -----------------------------------------
app.post('/api/send-emergency', async (req, res) => {
    const { location } = req.body;
    const targetNumber = "7569194766";

    try {
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+91' + 7569194766,
           body: `🚨 HealthSeva Emergency ALERT!\n\n📍 Location: ${location || 'Village'}\n\n⚠️ Someone needs immediate medical help.`
        });

        res.status(200).send({ success: true, message: "Emergency Alert Sent on WhatsApp!" });

    } catch (error) {
        console.log("Emergency ERROR:", error.message);
        res.status(500).send({ success: false, message: "Emergency Failed" });
    }
});

// -----------------------------------------
// 4️⃣ HOSPITAL & MEDICINE
// -----------------------------------------
app.get('/api/data', (req, res) => {
    res.json({
        hospitals: [
            { name: "Apollo Rural", dist: "2km" },
            { name: "KIMS Village", dist: "5km" }
        ],
        medicines: ["Paracetamol", "Cough Syrup", "Pain Relief"]
    });
});

// -----------------------------------------
// 5️⃣ AI DETECTION
// -----------------------------------------
app.post('/api/ai-detect', (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) return res.json({ advice: "Please tell your symptoms." });

    const t = symptoms.toLowerCase();
    let advice = "";
    
    // Check for Telugu characters
    const isTeluguInput = /[\u0c00-\u0c7f]/.test(t);

    if((t.includes("temperature") || t.includes("fever") || t.includes("జ్వరం")) &&
       (t.includes("weak") || t.includes("weakness") || t.includes("నీరసం"))) {
        advice = isTeluguInput ? "మీకు జ్వరం ఉన్నట్లు అనిపిస్తుంది. విశ్రాంతి తీసుకోండి." : "Likely fever. Take rest & Paracetamol.";
    }
    else if((t.includes("sore throat") || t.includes("గొంతు")) &&
            (t.includes("sneezing") || t.includes("తుమ్ములు")) &&
            (t.includes("headache") || t.includes("తలనొప్పి"))) {
        advice = isTeluguInput ? "మీకు జలుబు చేసినట్లు కనిపిస్తోంది. వేడి నీళ్లు తాగండి." : "It looks like a cold. Drink warm water.";
    }
    else {
        advice = isTeluguInput ? "దయచేసి మీ లక్షణాలను స్పష్టంగా వివరించండి." : "Please describe symptoms clearly.";
    }

    res.json({ advice });
});

// -----------------------------------------
// 6️⃣ REVIEWS
// -----------------------------------------
app.post('/api/submit-review', (req, res) => {
    console.log("⭐ Review:", req.body);
    res.json({ message: "Thanks for review!" });
});

// -----------------------------------------
// 🆕 7️⃣ RECEIPT SYSTEM (NEW FEATURE)
// -----------------------------------------
app.post("/api/send-receipt", async (req, res) => {

    const { hospital, receiptId, type, patientMobile } = req.body;

    console.log("---- RECEIPT TRIGGER ----");
    console.log("Hospital:", hospital);
    console.log("Receipt ID:", receiptId);
    console.log("Type:", type);
    console.log("Patient:", patientMobile);

    let message = "";

    // 📄 Receipt messages based on your images
    if (receiptId === "001") {
        message = `🧾 Sri Sai Clinic Receipt
Patient: Ravi Kumar
Problem: Fever & Cold
Amount: ₹150
Thank you!`;
    } 
    else if (receiptId === "002") {
        message = `🧾 Mother Care Clinic Receipt
Patient: Lakshmi
Problem: Pregnancy Checkup
Amount: ₹300
Take care!`;
    } 
    else if (receiptId === "003") {
        message = `🧾 Child Care Clinic Receipt
Patient: Chinnu
Problem: Child Fever & Vaccination
Amount: ₹500
Stay healthy!`;
    }

    try {
        await client.messages.create({
            from: 'whatsapp:+14155238886',
            to: 'whatsapp:+91' + 6303317734,
            body: message
        });

        console.log("✅ Receipt Sent Successfully");

        res.json({ success: true, message: "Receipt Sent" });

    } catch (error) {
        console.log("❌ Receipt ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Receipt sending failed"
        });
    }
});

// -----------------------------------------
// PAGE ROUTES
// -----------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

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
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}/server`);
});