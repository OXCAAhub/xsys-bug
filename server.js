const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const { blankButton, Blank2, crsA, bClck, invisibleDozer, delayJembut } = require('./function');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'sysxbugsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const TMP_DIR = '/tmp';
// ... (isi settings, routes, dll seperti sebelumnya)

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
