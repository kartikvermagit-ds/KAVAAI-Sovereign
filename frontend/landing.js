/**
 * KAVAAI SOVEREIGN — INDUSTRIAL LANDING CONTROLLER & CLIENT ROUTER
 * Module: frontend/landing.js
 * Implements: Single-Page Routing (/ , /login, /signup, /app),
 * 3D Glowing Earth Canvas Visualization, Interactive Inspection Demo Modal,
 * Live System Telemetry, and Smooth Nav Navigation.
 */

(function() {
    'use strict';

    // =========================================================================
    // 1. CLIENT-SIDE ROUTER SYSTEM
    // =========================================================================
    const KavaaiRouter = {
        currentRoute: '/',

        init() {
            // Determine initial route from URL path, query params, or hash
            const path = window.location.pathname.toLowerCase();
            const searchParams = new URLSearchParams(window.location.search);
            const routeParam = searchParams.get('route') || searchParams.get('page');
            const hash = window.location.hash.toLowerCase();

            let target = '/';

            if (routeParam) {
                target = routeParam.startsWith('/') ? routeParam : `/${routeParam}`;
            } else if (hash === '#login' || hash === '#/login') {
                target = '/login';
            } else if (hash === '#signup' || hash === '#/signup') {
                target = '/signup';
            } else if (hash === '#app' || hash === '#/app') {
                target = '/app';
            } else if (path.includes('/login')) {
                target = '/login';
            } else if (path.includes('/signup')) {
                target = '/signup';
            } else if (path.includes('/app')) {
                target = '/app';
            } else {
                target = '/';
            }

            // Bind popstate for browser Back/Forward navigation
            window.addEventListener('popstate', (e) => {
                const stateRoute = (e.state && e.state.route) || window.location.pathname;
                this.renderRoute(stateRoute, false);
            });

            // Render the resolved initial route
            this.renderRoute(target, false);
        },

        navigate(route) {
            if (this.currentRoute === route) return;
            try {
                window.history.pushState({ route }, '', route);
            } catch (e) {
                // Fallback for file:// or restrictive local hosts
                window.location.hash = route;
            }
            this.renderRoute(route, true);
        },

        async renderRoute(route, playSound = false) {
            const landingSection = document.getElementById('kavaai-landing-page');
            const authScreen = document.getElementById('kavaai-auth-screen');
            const dashboardWrapper = document.querySelector('.dashboard-wrapper');

            // Sanitize route
            const normalized = route.toLowerCase().replace(/\/$/, '') || '/';
            this.currentRoute = normalized;

            if (playSound && window.SoundManager && window.SoundManager.click) {
                window.SoundManager.click();
            }

            if (normalized === '/' || normalized === '/home') {
                // Show Landing Page
                if (landingSection) {
                    landingSection.classList.remove('hidden');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                if (authScreen) {
                    authScreen.classList.add('auth-hidden');
                }
                if (dashboardWrapper) {
                    dashboardWrapper.classList.add('auth-locked');
                }
                document.title = 'KAVAAI Sovereign — Industrial AI Workbench';
            }
            else if (normalized === '/login') {
                // Show Authentication Console in Sign In mode
                if (landingSection) landingSection.classList.add('hidden');
                if (dashboardWrapper) dashboardWrapper.classList.add('auth-locked');
                if (authScreen) {
                    authScreen.classList.remove('auth-hidden');
                    if (typeof window.setAuthMode === 'function') {
                        window.setAuthMode('SIGN_IN');
                    } else {
                        const tabSignIn = document.getElementById('authModeSignIn');
                        if (tabSignIn) tabSignIn.click();
                    }
                }
                document.title = 'Operator Sign In — KAVAAI Sovereign';
            }
            else if (normalized === '/signup') {
                // Show Authentication Console in Sign Up mode
                if (landingSection) landingSection.classList.add('hidden');
                if (dashboardWrapper) dashboardWrapper.classList.add('auth-locked');
                if (authScreen) {
                    authScreen.classList.remove('auth-hidden');
                    if (typeof window.setAuthMode === 'function') {
                        window.setAuthMode('SIGN_UP');
                    } else {
                        const tabSignUp = document.getElementById('authModeSignUp');
                        if (tabSignUp) tabSignUp.click();
                    }
                }
                document.title = 'Create Account — KAVAAI Sovereign';
            }
            else if (normalized === '/app') {
                // Dashboard entry: verify authentication
                let session = null;
                if (window.KavaaiAuth) {
                    session = await window.KavaaiAuth.getSession();
                }

                if (session || window.localStorage.getItem('kavaai_local_session') === 'true') {
                    if (landingSection) landingSection.classList.add('hidden');
                    if (authScreen) authScreen.classList.add('auth-hidden');
                    if (dashboardWrapper) {
                        dashboardWrapper.classList.remove('auth-locked');
                        dashboardWrapper.style.opacity = '1';
                    }
                    document.title = 'Command Center — KAVAAI Sovereign';
                } else {
                    // Not authenticated -> redirect to /login
                    this.navigate('/login');
                }
            }
        }
    };

    window.KavaaiRouter = KavaaiRouter;

    // =========================================================================
    // 2. 3D GLOWING EARTH CANVAS RENDERER
    // =========================================================================
    function initGlowingGlobe() {
        const canvas = document.getElementById('landing-globe-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.clientWidth || 380;
        let height = canvas.clientHeight || 240;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        let rotation = 0;
        const radius = Math.min(width, height) * 0.44;
        const centerX = width / 2;
        const centerY = height / 2;

        // Sample landmass coordinate clusters (lat, lon in degrees)
        const continentPoints = [];
        // North America & Europe & Asia & Australia & South America clusters
        const seedClusters = [
            { lat: 40, lon: -100, count: 24, spread: 22 }, // North America
            { lat: -15, lon: -60, count: 20, spread: 18 },  // South America
            { lat: 50, lon: 15, count: 32, spread: 20 },    // Europe
            { lat: 10, lon: 20, count: 26, spread: 22 },    // Africa
            { lat: 35, lon: 100, count: 42, spread: 28 },   // Asia
            { lat: 22, lon: 78, count: 20, spread: 12 },    // India
            { lat: -25, lon: 135, count: 18, spread: 16 }   // Australia
        ];

        seedClusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const lat = cluster.lat + (Math.random() - 0.5) * cluster.spread;
                const lon = cluster.lon + (Math.random() - 0.5) * cluster.spread;
                continentPoints.push({
                    lat: (lat * Math.PI) / 180,
                    lon: (lon * Math.PI) / 180,
                    size: Math.random() * 2 + 1.2,
                    isHub: Math.random() > 0.8
                });
            }
        });

        // Network Arcs between major industrial hubs
        const arcs = [
            { from: { lat: 0.7, lon: -1.7 }, to: { lat: 0.85, lon: 0.2 }, progress: 0 },
            { from: { lat: 0.85, lon: 0.2 }, to: { lat: 0.38, lon: 1.36 }, progress: 0.3 },
            { from: { lat: 0.38, lon: 1.36 }, to: { lat: 0.6, lon: 1.7 }, progress: 0.6 },
            { from: { lat: 0.7, lon: -1.7 }, to: { lat: -0.4, lon: -1.0 }, progress: 0.2 }
        ];

        let animationId;

        function render() {
            ctx.clearRect(0, 0, width, height);

            // 1. Draw outer ambient atmosphere glow
            const atmosGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius * 1.3);
            atmosGlow.addColorStop(0, 'rgba(14, 165, 233, 0.25)');
            atmosGlow.addColorStop(0.5, 'rgba(255, 157, 0, 0.12)');
            atmosGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = atmosGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
            ctx.fill();

            // 2. Base Dark Sphere with 3D gradient
            const sphereGrad = ctx.createRadialGradient(
                centerX - radius * 0.35,
                centerY - radius * 0.35,
                radius * 0.1,
                centerX,
                centerY,
                radius
            );
            sphereGrad.addColorStop(0, '#0f2942');
            sphereGrad.addColorStop(0.5, '#081726');
            sphereGrad.addColorStop(0.9, '#040b12');
            sphereGrad.addColorStop(1, '#020508');

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = sphereGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.clip(); // Clip everything to the sphere

            // 3. Draw Rotating Latitude & Longitude grid lines
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.14)';
            ctx.lineWidth = 0.8;

            // Latitudes
            for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
                const latRad = (latDeg * Math.PI) / 180;
                const y = centerY - radius * Math.sin(latRad);
                const rLat = radius * Math.cos(latRad);
                ctx.beginPath();
                ctx.ellipse(centerX, y, rLat, rLat * 0.28, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Longitudes
            for (let i = 0; i < 6; i++) {
                const lonAngle = rotation + (i * Math.PI) / 3;
                const xOffset = Math.sin(lonAngle) * radius;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 4. Draw Illuminated Continents & Sovereign Industrial Nodes
            continentPoints.forEach(pt => {
                const currLon = pt.lon + rotation;
                const cosLat = Math.cos(pt.lat);
                const sinLat = Math.sin(pt.lat);
                const cosLon = Math.cos(currLon);
                const sinLon = Math.sin(currLon);

                // 3D projection: z is depth
                const z = cosLat * cosLon;
                if (z > 0) { // Only render points on the visible hemisphere
                    const x = centerX + radius * cosLat * sinLon;
                    const y = centerY - radius * sinLat;

                    const opacity = Math.min(1, Math.max(0.15, z));

                    if (pt.isHub) {
                        // High-priority Sovereign Node: Glowing Amber
                        ctx.fillStyle = `rgba(255, 157, 0, ${opacity * 0.95})`;
                        ctx.shadowColor = '#FF9D00';
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(x, y, pt.size * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    } else {
                        // Cyan/Electric Blue node
                        ctx.fillStyle = `rgba(125, 211, 252, ${opacity * 0.65})`;
                        ctx.beginPath();
                        ctx.arc(x, y, pt.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            // 5. Draw Dynamic Data Transmission Arcs
            arcs.forEach(arc => {
                arc.progress = (arc.progress + 0.005) % 1;
                const currLonFrom = arc.from.lon + rotation;
                const currLonTo = arc.to.lon + rotation;

                const zFrom = Math.cos(arc.from.lat) * Math.cos(currLonFrom);
                const zTo = Math.cos(arc.to.lat) * Math.cos(currLonTo);

                if (zFrom > -0.2 && zTo > -0.2) {
                    const x1 = centerX + radius * Math.cos(arc.from.lat) * Math.sin(currLonFrom);
                    const y1 = centerY - radius * Math.sin(arc.from.lat);
                    const x2 = centerX + radius * Math.cos(arc.to.lat) * Math.sin(currLonTo);
                    const y2 = centerY - radius * Math.sin(arc.to.lat);

                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2 - 25;

                    ctx.strokeStyle = 'rgba(255, 157, 0, 0.4)';
                    ctx.setLineDash([3, 4]);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.quadraticCurveTo(midX, midY, x2, y2);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Travelling pulse packet
                    const t = arc.progress;
                    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
                    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;

                    ctx.fillStyle = '#FFA827';
                    ctx.shadowColor = '#FFA827';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            ctx.restore();

            rotation += 0.004; // Smooth realistic planetary spin
            animationId = requestAnimationFrame(render);
        }

        render();

        // Responsive resize handler
        window.addEventListener('resize', () => {
            const newW = canvas.clientWidth || 380;
            const newH = canvas.clientHeight || 240;
            if (newW !== width || newH !== height) {
                width = newW;
                height = newH;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                ctx.scale(dpr, dpr);
            }
        });
    }

    // =========================================================================
    // 3. INTERACTIVE INSPECTION DEMO MODAL CONTROLLER
    // =========================================================================
    function setupDemoModal() {
        const modalBackdrop = document.getElementById('lp-demo-modal');
        const btnWatchDemo = document.getElementById('lp-btn-watch-demo');
        const btnCloseDemo = document.getElementById('lp-btn-close-demo');
        const btnDemoStep = document.getElementById('lp-btn-demo-step');
        const demoTerminal = document.getElementById('lp-demo-terminal');
        const demoOverlay = document.getElementById('lp-demo-anomaly-box');

        if (!modalBackdrop) return;

        function openModal() {
            modalBackdrop.classList.add('active');
            if (window.SoundManager && window.SoundManager.click) window.SoundManager.click();
            // Reset demo state
            if (demoTerminal) {
                demoTerminal.innerHTML = `
                    <div style="color: #7DD3FC;">[SYSTEM] Initializing Sovereign Multimodal Vision Engine...</div>
                    <div style="color: #94A3B8;">[STREAM] Connected to Asset: ICU-101-A (Machine 101 Industrial Cooling Unit)</div>
                    <div style="color: #F59E0B;">[READY] Click 'TRIGGER AUTONOMOUS AUDIT' below to initiate local inspection.</div>
                `;
            }
            if (demoOverlay) demoOverlay.style.display = 'none';
        }

        function closeModal() {
            modalBackdrop.classList.remove('active');
            if (window.SoundManager && window.SoundManager.click) window.SoundManager.click();
        }

        if (btnWatchDemo) btnWatchDemo.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        if (btnCloseDemo) btnCloseDemo.addEventListener('click', closeModal);

        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeModal();
        });

        // Trigger Autonomous Audit simulation
        if (btnDemoStep) {
            btnDemoStep.addEventListener('click', async () => {
                if (btnDemoStep.disabled) return;
                btnDemoStep.disabled = true;
                btnDemoStep.textContent = 'RUNNING REASONING AGENT...';

                if (window.SoundManager && window.SoundManager.click) window.SoundManager.click();

                if (demoTerminal) {
                    demoTerminal.innerHTML += `<div style="color: #0EA5E9; margin-top: 6px;">› [AGENT] Extracting hardware specifications via OCR...</div>`;
                }

                await new Promise(r => setTimeout(r, 600));

                if (demoTerminal) {
                    demoTerminal.innerHTML += `<div style="color: #CBD5E1;">› [OCR] Detected: Model: IM-101 | Power: 15 kW | Voltage: 415 V | Speed: 1440 RPM</div>`;
                }

                await new Promise(r => setTimeout(r, 700));

                if (demoTerminal) {
                    demoTerminal.innerHTML += `<div style="color: #0EA5E9;">› [VISION] Scanning cooling fan cowl and thermal transducer...</div>`;
                }

                await new Promise(r => setTimeout(r, 700));

                if (demoOverlay) demoOverlay.style.display = 'block';

                if (demoTerminal) {
                    demoTerminal.innerHTML += `<div style="color: #EF4444; font-weight: 700; margin-top: 4px;">› [ALERT] Anomaly Detected: Coolant Temperature 96°C exceeds 85°C rated ceiling!</div>`;
                    demoTerminal.innerHTML += `<div style="color: #22C55E; margin-top: 4px;">› [RECOMMENDATION] Autonomous action: Throttling motor load by 25% to prevent cavitation.</div>`;
                    demoTerminal.scrollTop = demoTerminal.scrollHeight;
                }

                btnDemoStep.disabled = false;
                btnDemoStep.textContent = 'RE-RUN SIMULATION';
            });
        }
    }

    // =========================================================================
    // 4. LIVE BACKEND SYSTEM STATUS MONITOR
    // =========================================================================
    async function updateSystemStatus() {
        const statusLabel = document.getElementById('lp-system-status-label');
        const statusDot = document.getElementById('lp-system-status-dot');
        if (!statusLabel) return;

        try {
            const apiBase = window.KAVAAI_API_BASE_URL || window.VITE_API_BASE_URL || (
                (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
                ? 'http://127.0.0.1:8000'
                : ''
            );

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`${apiBase}/api/auth/config`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                statusLabel.textContent = 'ALL SYSTEMS OPERATIONAL';
                if (statusDot) statusDot.style.background = '#22C55E';
            } else {
                statusLabel.textContent = 'LOCAL AIR-GAP ACTIVE';
                if (statusDot) statusDot.style.background = '#F59E0B';
            }
        } catch (e) {
            // Air-gapped fallback / graceful display
            statusLabel.textContent = 'SYSTEM OPERATIONAL (AIR-GAP)';
            if (statusDot) statusDot.style.background = '#22C55E';
        }
    }

    // =========================================================================
    // 5. SMOOTH NAV & ANCHOR SCROLL
    // =========================================================================
    function setupNavSmoothScroll() {
        const anchors = document.querySelectorAll('a[href^="#lp-"]');
        anchors.forEach(a => {
            a.addEventListener('click', (e) => {
                const targetId = a.getAttribute('href');
                if (targetId && targetId.length > 1) {
                    const el = document.querySelector(targetId);
                    if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        // Update active state in nav
                        document.querySelectorAll('.lp-nav-link').forEach(l => l.classList.remove('active'));
                        a.classList.add('active');
                    }
                }
            });
        });

        // Team CTA click smooth scroll
        const btnTeamScroll = document.getElementById('lp-btn-meet-team');
        if (btnTeamScroll) {
            btnTeamScroll.addEventListener('click', (e) => {
                e.preventDefault();
                const teamSection = document.getElementById('lp-team');
                if (teamSection) teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    // =========================================================================
    // 6. INITIALIZATION ON DOM READY
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        KavaaiRouter.init();
        initGlowingGlobe();
        setupDemoModal();
        setupNavSmoothScroll();
        updateSystemStatus();

        // Bind interactive router links
        document.querySelectorAll('[data-route]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const route = el.getAttribute('data-route');
                if (route) KavaaiRouter.navigate(route);
            });
        });
    });

})();
