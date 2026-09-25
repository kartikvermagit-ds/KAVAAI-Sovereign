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
    // 2. 3D REAL GREEN EARTH GLOBE RENDERER (WEBGL + VECTOR OVERLAY)
    // =========================================================================
    function initGlowingGlobe() {
        const canvas = document.getElementById('landing-globe-canvas');
        if (!canvas) return;
        const overlay = document.getElementById('landing-globe-overlay');

        let width = canvas.clientWidth || 380;
        let height = canvas.clientHeight || 240;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        if (overlay) {
            overlay.width = Math.floor(width * dpr);
            overlay.height = Math.floor(height * dpr);
        }

        const overlayCtx = overlay ? overlay.getContext('2d') : null;
        if (overlayCtx) {
            overlayCtx.scale(dpr, dpr);
        }

        // Global network nodes (Real geographic coordinates)
        const networkNodes = [
            { id: 'india', name: 'SOVEREIGN CORE', lat: 21.0, lon: 78.0, isCore: true },
            { id: 'na_w', name: 'NORTH AMERICA', lat: 37.5, lon: -122.0, isCore: false },
            { id: 'na_e', name: 'EAST INFRA', lat: 40.7, lon: -74.0, isCore: false },
            { id: 'eu', name: 'EUROPE HUB', lat: 50.1, lon: 9.0, isCore: false },
            { id: 'mideast', name: 'GULF ENERGY', lat: 25.2, lon: 55.3, isCore: false },
            { id: 'eastasia', name: 'ASIA PACIFIC', lat: 35.6, lon: 139.7, isCore: false },
            { id: 'seasia', name: 'ASEAN GRID', lat: 1.3, lon: 103.8, isCore: false }
        ];

        // Global network data packet arcs
        const arcs = [
            { from: 'india', to: 'mideast', progress: 0.1 },
            { from: 'mideast', to: 'eu', progress: 0.4 },
            { from: 'eu', to: 'na_e', progress: 0.7 },
            { from: 'na_e', to: 'na_w', progress: 0.2 },
            { from: 'india', to: 'seasia', progress: 0.5 },
            { from: 'seasia', to: 'eastasia', progress: 0.85 }
        ];

        let rotation = 0.8; // Initial rotation showing Eurasia/India
        let animationId;

        // Try WebGL first for photorealistic 3D Earth
        let gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) {
            gl = canvas.getContext('experimental-webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
        }

        if (gl) {
            initWebGLGlobe(gl);
        } else {
            init2DFallbackGlobe();
        }

        function initWebGLGlobe(gl) {
            const vsSource = `
                attribute vec2 a_pos;
                void main() {
                    gl_Position = vec4(a_pos, 0.0, 1.0);
                }
            `;

            const fsSource = `
                precision mediump float;
                uniform vec2 u_res;
                uniform float u_rot;
                uniform sampler2D u_tex;

                void main() {
                    float minDim = min(u_res.x, u_res.y);
                    float r = minDim * 0.44;
                    vec2 c = u_res * 0.5;
                    vec2 p = (gl_FragCoord.xy - c) / r;
                    float d2 = dot(p, p);

                    if (d2 > 1.0) {
                        float d = sqrt(d2);
                        if (d < 1.25) {
                            float glow = pow((1.25 - d) / 0.25, 2.2) * 0.45;
                            gl_FragColor = vec4(0.08 * glow, 0.65 * glow, 0.95 * glow, glow);
                        } else {
                            gl_FragColor = vec4(0.0);
                        }
                        return;
                    }

                    float z = sqrt(max(0.0, 1.0 - d2));
                    vec3 norm = vec3(p.x, p.y, z);

                    // 23.4 degree axial tilt of Earth
                    float ct = 0.9177;
                    float st = 0.3971;
                    vec3 t = vec3(norm.x, norm.y * ct - norm.z * st, norm.y * st + norm.z * ct);

                    float lat = asin(clamp(t.y, -1.0, 1.0));
                    float lon = atan(t.x, t.z) + u_rot;

                    float pi = 3.14159265;
                    float u = fract(lon / (2.0 * pi));
                    float v = 0.5 - (lat / pi);

                    vec4 tex = texture2D(u_tex, vec2(u, clamp(v, 0.002, 0.998)));

                    // Sunlight from upper left
                    vec3 light = normalize(vec3(-0.55, 0.45, 0.70));
                    float diff = max(dot(norm, light), 0.0);
                    float illumination = 0.28 + 0.72 * pow(diff, 0.85);

                    // Specular highlight on ocean waters
                    float isWater = max(0.0, tex.b - tex.g * 0.65);
                    vec3 halfV = normalize(light + vec3(0.0, 0.0, 1.0));
                    float spec = pow(max(dot(norm, halfV), 0.0), 22.0) * isWater * 0.45;

                    // Atmosphere rim glow
                    float rim = pow(1.0 - z, 2.4);
                    vec3 atmosRim = vec3(0.12, 0.70, 0.95) * rim * 0.55;

                    // Vibrant green land enhancement
                    vec3 col = tex.rgb;
                    if (col.g > col.b * 0.85) {
                        col = vec3(col.r * 0.92, min(1.0, col.g * 1.15), col.b * 0.88);
                    }

                    vec3 finalCol = col * illumination + vec3(spec) + atmosRim;
                    gl_FragColor = vec4(finalCol, 1.0);
                }
            `;

            function createShader(gl, type, source) {
                const s = gl.createShader(type);
                gl.shaderSource(s, source);
                gl.compileShader(s);
                return s;
            }

            const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            const prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            gl.useProgram(prog);

            const posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                 1, -1,
                -1,  1,
                -1,  1,
                 1, -1,
                 1,  1
            ]), gl.STATIC_DRAW);

            const aPos = gl.getAttribLocation(prog, 'a_pos');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            const uRes = gl.getUniformLocation(prog, 'u_res');
            const uRot = gl.getUniformLocation(prog, 'u_rot');
            const uTex = gl.getUniformLocation(prog, 'u_tex');

            // Create initial placeholder texture
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
                16, 55, 120, 255,   34, 139, 34, 255,
                34, 139, 34, 255,   16, 55, 120, 255
            ]));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Load high-resolution realistic green Earth map
            const earthImg = new Image();
            earthImg.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImg);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            };
            earthImg.src = 'assets/earth_green.jpg';

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            function loop() {
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform1f(uRot, rotation);
                gl.uniform1i(uTex, 0);

                gl.drawArrays(gl.TRIANGLES, 0, 6);

                renderOverlays();

                rotation += 0.0035;
                animationId = requestAnimationFrame(loop);
            }

            loop();
        }

        // 3D coordinate projection with Earth's 23.4° tilt
        function projectNode(latDeg, lonDeg) {
            const lat = (latDeg * Math.PI) / 180;
            const lon = (lonDeg * Math.PI) / 180 + rotation;

            const cosLat = Math.cos(lat);
            const sinLat = Math.sin(lat);
            const cosLon = Math.cos(lon);
            const sinLon = Math.sin(lon);

            // Un-tilted coordinates on unit sphere
            const sx = cosLat * sinLon;
            const sy = sinLat;
            const sz = cosLat * cosLon;

            // Earth axial tilt (23.4 deg -> 0.409 rad)
            const ct = 0.9177;
            const st = 0.3971;
            const px = sx;
            const py = sy * ct - sz * st;
            const pz = sy * st + sz * ct;

            const radius = Math.min(width, height) * 0.44;
            const cx = width / 2;
            const cy = height / 2;

            return {
                x: cx + radius * px,
                y: cy - radius * py,
                z: pz,
                visible: pz > 0.05
            };
        }

        function renderOverlays() {
            if (!overlayCtx) return;
            overlayCtx.clearRect(0, 0, width, height);

            const nodePos = {};
            networkNodes.forEach(node => {
                nodePos[node.id] = projectNode(node.lat, node.lon);
            });

            // Draw animated sovereign transmission arcs
            arcs.forEach(arc => {
                const p1 = nodePos[arc.from];
                const p2 = nodePos[arc.to];
                if (!p1 || !p2) return;

                arc.progress = (arc.progress + 0.004) % 1;

                if (p1.z > -0.15 && p2.z > -0.15) {
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2 - 20;

                    const alpha = Math.min(1, Math.max(0.1, (p1.z + p2.z) * 0.7));

                    overlayCtx.strokeStyle = `rgba(255, 157, 0, ${alpha * 0.45})`;
                    overlayCtx.lineWidth = 1.2;
                    overlayCtx.setLineDash([3, 4]);
                    overlayCtx.beginPath();
                    overlayCtx.moveTo(p1.x, p1.y);
                    overlayCtx.quadraticCurveTo(midX, midY, p2.x, p2.y);
                    overlayCtx.stroke();
                    overlayCtx.setLineDash([]);

                    // Travelling cyber pulse
                    const t = arc.progress;
                    const px = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
                    const py = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;

                    overlayCtx.fillStyle = '#FFA827';
                    overlayCtx.shadowColor = '#FFA827';
                    overlayCtx.shadowBlur = 6;
                    overlayCtx.beginPath();
                    overlayCtx.arc(px, py, 2.5, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.shadowBlur = 0;
                }
            });

            // Draw glowing sovereign nodes
            const time = Date.now() * 0.003;
            networkNodes.forEach(node => {
                const p = nodePos[node.id];
                if (!p || !p.visible) return;

                const alpha = Math.min(1, Math.max(0.2, p.z));

                if (node.isCore) {
                    // Pulsing amber sovereign core
                    const pulse = 1 + 0.25 * Math.sin(time * 3);
                    overlayCtx.strokeStyle = `rgba(255, 157, 0, ${alpha * 0.8})`;
                    overlayCtx.lineWidth = 1.5;
                    overlayCtx.beginPath();
                    overlayCtx.arc(p.x, p.y, 6 * pulse, 0, Math.PI * 2);
                    overlayCtx.stroke();

                    overlayCtx.fillStyle = `rgba(255, 157, 0, ${alpha})`;
                    overlayCtx.shadowColor = '#FF9D00';
                    overlayCtx.shadowBlur = 10;
                    overlayCtx.beginPath();
                    overlayCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.shadowBlur = 0;
                } else {
                    // Electric cyan node
                    overlayCtx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
                    overlayCtx.shadowColor = '#38BDF8';
                    overlayCtx.shadowBlur = 6;
                    overlayCtx.beginPath();
                    overlayCtx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    overlayCtx.fill();
                    overlayCtx.shadowBlur = 0;
                }
            });
        }

        function init2DFallbackGlobe() {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(dpr, dpr);

            function loop2D() {
                ctx.clearRect(0, 0, width, height);
                const cx = width / 2;
                const cy = height / 2;
                const r = Math.min(width, height) * 0.44;

                // Deep ocean blue sphere
                const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#125488');
                grad.addColorStop(0.6, '#092542');
                grad.addColorStop(1, '#030c17');

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();

                renderOverlays();
                rotation += 0.0035;
                animationId = requestAnimationFrame(loop2D);
            }
            loop2D();
        }

        // Window resize handler
        window.addEventListener('resize', () => {
            const newW = canvas.clientWidth || 380;
            const newH = canvas.clientHeight || 240;
            if (newW !== width || newH !== height) {
                width = newW;
                height = newH;
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);
                if (overlay) {
                    overlay.width = Math.floor(width * dpr);
                    overlay.height = Math.floor(height * dpr);
                    if (overlayCtx) overlayCtx.scale(dpr, dpr);
                }
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

        // Interactive Golden Hover for Hero Title
        const heroTitle = document.querySelector('.lp-hero-title');
        if (heroTitle) {
            heroTitle.addEventListener('mouseenter', () => heroTitle.classList.add('is-hovered'));
            heroTitle.addEventListener('mouseleave', () => heroTitle.classList.remove('is-hovered'));
        }
    });

})();
