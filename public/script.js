document.addEventListener('DOMContentLoaded', () => {
    // Check status login
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                showDashboard();
                loadSettings();
                loadSenders();
            }
        });

    // Login
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const password = document.getElementById('passwordInput').value;
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                await showLoginAnimation();
                showDashboard();
                loadSettings();
                loadSenders();
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        fetch('/api/logout', { method: 'POST' }).then(() => location.reload());
    });

    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const page = this.dataset.page;
            document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
            document.getElementById('page-' + page).style.display = 'block';
            if (page === 'pair') loadSenders();
            if (page === 'bug') populateSenders();
        });
    });

    // Upload animation
    document.getElementById('uploadAnimationBtn').addEventListener('click', () => {
        const file = document.getElementById('animationUpload').files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('animation', file);
        fetch('/api/upload/animation', { method: 'POST', body: fd })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('animationPreview').src = data.path;
                    document.getElementById('animationPreview').load();
                    alert('Animasi login diupload!');
                }
            });
    });

    // Upload profile
    document.getElementById('uploadProfileBtn').addEventListener('click', () => {
        const file = document.getElementById('profileUpload').files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('profile', file);
        fetch('/api/upload/profile', { method: 'POST', body: fd })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('profilePreview').src = data.path;
                    document.getElementById('profilePreview').load();
                    document.getElementById('profileVideo').src = data.path;
                    document.getElementById('profileVideo').load();
                    alert('Foto profil diupload!');
                }
            });
    });

    // Pair sender
    document.getElementById('pairBtn').addEventListener('click', () => {
        const phone = document.getElementById('pairPhone').value.trim();
        const code = document.getElementById('pairCode').value.trim();
        if (!phone || !code) {
            document.getElementById('pairResult').innerHTML = 'Isi semua field!';
            return;
        }
        fetch('/api/pair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, pairingCode: code })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById('pairResult').innerHTML = 'Error: ' + data.error;
            } else {
                document.getElementById('pairResult').innerHTML = `
                    <p>✅ Pairing berhasil!</p>
                    <p>Nomor: ${data.phone}</p>
                    <p>Pairing Code: <strong>${data.pairingCode}</strong> (masukkan di perangkat target)</p>
                `;
                loadSenders();
                populateSenders();
            }
        })
        .catch(err => {
            document.getElementById('pairResult').innerHTML = 'Error: ' + err.message;
        });
    });

    // Send bug
    document.getElementById('sendBugBtn').addEventListener('click', () => {
        const sender = document.getElementById('bugSender').value;
        const target = document.getElementById('bugTarget').value.trim();
        const bugType = document.getElementById('bugType').value;
        if (!sender || !target || !bugType) {
            document.getElementById('bugResult').innerHTML = 'Isi semua field!';
            return;
        }
        fetch('/api/send-bug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, target, bugType })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                document.getElementById('bugResult').innerHTML = '❌ Error: ' + data.error;
            } else {
                document.getElementById('bugResult').innerHTML = '✅ ' + data.message;
            }
        })
        .catch(err => {
            document.getElementById('bugResult').innerHTML = 'Error: ' + err.message;
        });
    });

    // ---- Functions ----
    function showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').style.display = 'flex';
    }

    function loadSettings() {
        fetch('/api/settings')
            .then(res => res.json())
            .then(settings => {
                if (settings.animationVideo) {
                    document.getElementById('animationPreview').src = settings.animationVideo;
                    document.getElementById('animationPreview').load();
                }
                if (settings.profileVideo) {
                    document.getElementById('profileVideo').src = settings.profileVideo;
                    document.getElementById('profileVideo').load();
                    document.getElementById('profilePreview').src = settings.profileVideo;
                    document.getElementById('profilePreview').load();
                }
            });
    }

    function loadSenders() {
        fetch('/api/senders')
            .then(res => res.json())
            .then(senders => {
                const list = document.getElementById('senderList');
                list.innerHTML = senders.map(s => `<li>${s}</li>`).join('');
                document.getElementById('senderCount').textContent = senders.length;
            });
    }

    function populateSenders() {
        fetch('/api/senders')
            .then(res => res.json())
            .then(senders => {
                const select = document.getElementById('bugSender');
                select.innerHTML = '';
                senders.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.textContent = s;
                    select.appendChild(opt);
                });
            });
    }

    function showLoginAnimation() {
        return new Promise((resolve) => {
            const overlay = document.getElementById('animationOverlay');
            const video = document.getElementById('loginAnimationVideo');
            fetch('/api/settings')
                .then(res => res.json())
                .then(settings => {
                    if (settings.animationVideo) {
                        video.src = settings.animationVideo;
                        video.load();
                        video.play();
                        overlay.style.display = 'flex';
                        document.getElementById('animationContinueBtn').onclick = () => {
                            overlay.style.display = 'none';
                            video.pause();
                            resolve();
                        };
                        video.onended = () => {
                            overlay.style.display = 'none';
                            resolve();
                        };
                        // Fallback 10 detik
                        setTimeout(() => {
                            if (overlay.style.display !== 'none') {
                                overlay.style.display = 'none';
                                resolve();
                            }
                        }, 10000);
                    } else {
                        resolve();
                    }
                });
        });
    }
});