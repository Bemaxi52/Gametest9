/* ========================
   АНИМИРОВАННЫЕ СЧЁТЧИКИ
   ======================== */
function animateCounter(el, target, duration = 1200) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) { start = target; clearInterval(timer); }
        el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    }, 16);
}

// Запускаем счётчики при загрузке страницы
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelectorAll('.mini-num').forEach(el => {
            animateCounter(el, parseInt(el.dataset.target));
        });
    }, 800);
});


/* ========================
   3D КУБ С ТЕКСТУРАМИ
   ======================== */
(function () {
    const cv = document.getElementById('characterCanvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = 400, H = 440;
    let t = 0;

    // ── Загрузка всех 6 текстур ───────────────────────────────
    const imgs = {};
    const srcs = {
        cover: 'cover.jpg',
        undertale: 'undertale.jpg',
        nightmare: 'litlenightmares.jpg',
        cuphead: 'cuphead.jpg',
        hollow: 'hollowknigth.jpg',
    };
    let loaded = 0;
    Object.entries(srcs).forEach(([key, src]) => {
        const img = new Image();
        img.src = src;
        img.onload = () => loaded++;
        imgs[key] = img;
    });

    // 6-я грань — анимированная (mystery / coming soon)
    const mystCv = document.createElement('canvas');
    mystCv.width = mystCv.height = 512;
    const mctx = mystCv.getContext('2d');

    function renderMystery() {
        mctx.fillStyle = '#060010';
        mctx.fillRect(0, 0, 512, 512);
        const pulse = 0.55 + Math.sin(t * 0.05) * 0.45;
        const g = mctx.createRadialGradient(256, 256, 0, 256, 256, 200);
        g.addColorStop(0, `rgba(110,20,210,${pulse * 0.55})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g; mctx.fillRect(0, 0, 512, 512);

        // Вращающиеся точки
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + t * 0.016;
            const r = 170 + Math.sin(t * 0.035 + i) * 18;
            const op = 0.3 + Math.sin(t * 0.06 + i * 0.8) * 0.3;
            mctx.fillStyle = `rgba(190,130,255,${op})`;
            mctx.beginPath();
            mctx.arc(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, 3.5, 0, Math.PI * 2);
            mctx.fill();
        }

        // Вопросительный знак
        mctx.save();
        mctx.shadowColor = '#cc88ff'; mctx.shadowBlur = 40 * pulse;
        mctx.fillStyle = `rgba(220, 160, 255, ${0.8 + pulse * 0.2})`;
        mctx.font = 'bold 220px serif';
        mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
        mctx.fillText('?', 256, 270);
        mctx.restore();

        // Надпись
        mctx.fillStyle = `rgba(180, 120, 255, ${0.5 + pulse * 0.3})`;
        mctx.font = 'bold 28px Orbitron, monospace';
        mctx.textAlign = 'center';
        mctx.fillText('COMING SOON', 256, 440);

        // Рамка
        mctx.strokeStyle = `rgba(150,60,255,${0.4 + pulse * 0.3})`;
        mctx.lineWidth = 8; mctx.strokeRect(12, 12, 488, 488);
        mctx.lineWidth = 2; mctx.strokeStyle = `rgba(150,60,255,0.2)`;
        mctx.strokeRect(28, 28, 456, 456);
    }

    // ── Грани куба: вершины + текстура ───────────────────────
    // Порядок вершин куба (индексы)
    const VERTS = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  // 0-3 передняя
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],  // 4-7 задняя
    ];

    // 4 картинки на видимых боковых гранях (перед/зад/лево/право)
    // cover и myst — на верх/низ, почти не видны
    const FACES = [
        { vi: [1, 0, 3, 2], tex: 'hollow', accent: '#4488ff' }, // перед  — Hollow Knight
        { vi: [4, 5, 6, 7], tex: 'cuphead', accent: '#ff8800' }, // зад    — Cuphead
        { vi: [0, 4, 7, 3], tex: 'undertale', accent: '#ff3366' }, // лево   — Undertale
        { vi: [5, 1, 2, 6], tex: 'nightmare', accent: '#ffee00' }, // право  — Little Nightmares
        { vi: [0, 1, 5, 4], tex: 'cover', accent: '#00ffcc' }, // верх   — своя игра (почти не видна)
        { vi: [3, 7, 6, 2], tex: 'myst', accent: '#bf5fff' }, // низ    — coming soon (почти не видна)
    ];

    // ── 3D матем ──────────────────────────────────────────────
    const S = 102;
    function rotX(p, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
    }
    function rotY(p, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
    }
    function proj(p, fov, ox, oy) {
        const z = p[2] + fov;
        const sc = fov / z;
        return [p[0] * sc + ox, p[1] * sc + oy, sc];
    }
    function norm2d(pts) {
        const ax = pts[1][0] - pts[0][0], ay = pts[1][1] - pts[0][1];
        const bx = pts[2][0] - pts[0][0], by = pts[2][1] - pts[0][1];
        return ax * by - ay * bx;
    }
    function faceBrightness(tv) {
        const A = [tv[1][0] - tv[0][0], tv[1][1] - tv[0][1], tv[1][2] - tv[0][2]];
        const B = [tv[3][0] - tv[0][0], tv[3][1] - tv[0][1], tv[3][2] - tv[0][2]];
        const nx = A[1] * B[2] - A[2] * B[1], ny = A[2] * B[0] - A[0] * B[2], nz = A[0] * B[1] - A[1] * B[0];
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const dot = nx / len * (-0.4) + ny / len * (-0.75) + nz / len * (-0.55);
        return Math.max(0.18, Math.min(1, 0.38 + dot * 0.62));
    }

    // ── Рисование грани ───────────────────────────────────────
    function drawFace(pts2d, tv, face, bright) {
        const [p0, p1, p2, p3] = pts2d;

        // Clip к четырёхугольнику
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.clip();

        // Получаем текстуру
        let texImg = null;
        if (face.tex === 'myst') texImg = mystCv;
        else if (face.tex === 'cover') texImg = imgs.cover;
        else if (face.tex === 'undertale') texImg = imgs.undertale;
        else if (face.tex === 'nightmare') texImg = imgs.nightmare;
        else if (face.tex === 'cuphead') texImg = imgs.cuphead;
        else if (face.tex === 'hollow') texImg = imgs.hollow;

        if (texImg && (texImg === mystCv || (texImg.complete && texImg.naturalWidth > 0))) {
            // Перспективное натяжение через affine трансформ
            const dx1 = p1[0] - p0[0], dy1 = p1[1] - p0[1];
            const dx2 = p3[0] - p0[0], dy2 = p3[1] - p0[1];
            const tw = texImg.width || 512, th = texImg.height || 512;
            ctx.transform(dx1 / tw, dy1 / tw, dx2 / th, dy2 / th, p0[0], p0[1]);
            ctx.drawImage(texImg, 0, 0, tw, th);
        } else {
            // Fallback — тёмный фон
            ctx.fillStyle = '#0a0a14';
            ctx.fill();
        }

        // Затемнение по освещению
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(0,0,0,${(1 - bright) * 0.68})`;
        ctx.fill();

        ctx.restore();

        // Светящаяся рамка
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        const edgeAlpha = bright > 0.55 ? 'cc' : '44';
        ctx.strokeStyle = face.accent + edgeAlpha;
        ctx.lineWidth = bright > 0.55 ? 2.5 : 1.2;
        ctx.shadowColor = face.accent;
        ctx.shadowBlur = bright > 0.55 ? 14 : 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── Частицы ───────────────────────────────────────────────
    const SPARKS = Array.from({ length: 28 }, (_, i) => ({
        angle: (i / 28) * Math.PI * 2 + Math.random() * 0.4,
        r: 148 + Math.random() * 52,
        speed: (0.005 + Math.random() * 0.009) * (i % 2 ? 1 : -1),
        size: 1.4 + Math.random() * 2.4,
        yFactor: 0.36 + Math.random() * 0.16,
        color: ['#00ffcc', '#4488ff', '#ff3366', '#ffaa00', '#ffffff', '#bf5fff'][Math.floor(Math.random() * 6)],
        op: 0.22 + Math.random() * 0.55,
    }));

    function drawSparks(ox, oy) {
        SPARKS.forEach(sp => {
            sp.angle += sp.speed;
            const px = ox + Math.cos(sp.angle) * sp.r;
            const py = oy + Math.sin(sp.angle) * sp.r * sp.yFactor;
            const px2 = ox + Math.cos(sp.angle - sp.speed * 10) * sp.r;
            const py2 = oy + Math.sin(sp.angle - sp.speed * 10) * sp.r * sp.yFactor;
            // хвост
            ctx.globalAlpha = sp.op * 0.28;
            ctx.strokeStyle = sp.color; ctx.lineWidth = sp.size * 0.7;
            ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(px, py); ctx.stroke();
            // точка
            ctx.globalAlpha = sp.op * (0.5 + Math.sin(t * 0.07 + sp.angle) * 0.5);
            ctx.fillStyle = sp.color;
            ctx.shadowColor = sp.color; ctx.shadowBlur = 9;
            ctx.beginPath(); ctx.arc(px, py, sp.size, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;
    }

    // ── Тень под кубом ────────────────────────────────────────
    function drawShadow(ox, oy) {
        ctx.save();
        ctx.globalAlpha = 0.26;
        ctx.filter = 'blur(22px)';
        ctx.beginPath();
        ctx.ellipse(ox, oy + S + 60, S * 0.92, 20, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000'; ctx.fill();
        ctx.filter = 'none'; ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Фоновое свечение ─────────────────────────────────────
    function drawBg(ox, oy) {
        const bg = ctx.createRadialGradient(ox, oy, 10, ox, oy, 210);
        bg.addColorStop(0, 'rgba(0,180,255,0.07)');
        bg.addColorStop(0.5, 'rgba(0,80,180,0.04)');
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    }

    // ── Главный цикл ─────────────────────────────────────────
    function frame() {
        ctx.clearRect(0, 0, W, H);

        const ox = W / 2, oy = H / 2 - 5;
        const FOV = 420;

        // Плавная авторотация
        const ay = t * 0.010;
        const ax = 0.08 + Math.sin(t * 0.0085) * 0.06;  // минимальный наклон — верх/низ почти не видны
        const az = Math.sin(t * 0.006) * 0.065;

        drawBg(ox, oy);
        drawSparks(ox, oy);
        renderMystery();

        // Трансформируем вершины
        const tv = VERTS.map(([vx, vy, vz]) => {
            let p = rotX([vx * S, vy * S, vz * S], ax);
            p = rotY(p, ay);
            // rotZ inline
            const cx2 = Math.cos(az), sx2 = Math.sin(az);
            p = [p[0] * cx2 - p[1] * sx2, p[0] * sx2 + p[1] * cx2, p[2]];
            return p;
        });

        // Проецируем
        const pv = tv.map(p => proj(p, FOV, ox, oy));

        // Считаем данные каждой грани
        const faceData = FACES.map((face, fi) => {
            const tv4 = face.vi.map(i => tv[i]);
            const pts2d = face.vi.map(i => pv[i]);
            const avgZ = tv4.reduce((s, p) => s + p[2], 0) / 4;
            const n2d = norm2d(pts2d);
            const br = faceBrightness(tv4);
            return { fi, face, avgZ, n2d, pts2d, tv4, br };
        });

        // Painter's algorithm — от дальней к ближней
        faceData.sort((a, b) => a.avgZ - b.avgZ);

        faceData.forEach(({ face, n2d, pts2d, tv4, br }) => {
            if (n2d < 0) drawFace(pts2d, tv4, face, br);
        });

        drawShadow(ox, oy);

        t++;
        requestAnimationFrame(frame);
    }

    frame();
})();


/* ========================
   КУРСОР
   ======================== */
const cursor = document.querySelector('.cursor');
const trail = document.querySelector('.cursor-trail');

let trailX = 0, trailY = 0;
let rafId;

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(animateTrail);
    // hover-класс на интерактивных элементах
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const isInteractive = target && (
        target.matches('a, button, [onclick], input, label, .card, .nav-link, .btn, .s-card') ||
        target.closest('a, button, [onclick], .card, .nav-link, .btn, .s-card')
    );
    cursor.classList.toggle('hover', !!isInteractive);
    trail.classList.toggle('hover', !!isInteractive);
});

document.addEventListener('mousedown', () => {
    cursor.classList.add('clicking');
    cursor.classList.remove('hover');
});
document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
});

function animateTrail() {
    trailX += (parseFloat(cursor.style.left) - trailX) * 0.14;
    trailY += (parseFloat(cursor.style.top)  - trailY) * 0.14;
    trail.style.left = trailX + 'px';
    trail.style.top  = trailY + 'px';
    rafId = requestAnimationFrame(animateTrail);
}
animateTrail();

/* ========================
   ФОНОВЫЕ ЧАСТИЦЫ
   ======================== */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let W, H;
const particles = [];
const NUM = 80;

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

for (let i = 0; i < NUM; i++) {
    particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.7 ? '#00ffcc' : '#ffffff'
    });
}

function drawParticles() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
    });

    // Линии между близкими частицами
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 255, 204, ${0.08 * (1 - dist / 120)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function loop() {
    drawParticles();
    requestAnimationFrame(loop);
}
loop();


/* ========================
   НАВИГАЦИЯ HERO → CATALOG
   ======================== */
const ctaBtn = document.getElementById('ctaBtn');
const heroSection = document.querySelector('.hero');
const authorsSection = document.querySelector('.authors-section');
const catalogSection = document.querySelector('.catalog');

function goToCatalog() {
    heroSection.classList.add('fade-out');
    setTimeout(() => {
        heroSection.style.display = 'none';
        if (authorsSection) authorsSection.style.display = 'none';
        catalogSection.style.display = '';
        catalogSection.classList.add('show');
        document.querySelectorAll('.game-card').forEach((card, i) => {
            card.style.animationDelay = `${i * 0.15}s`;
        });
    }, 800);
}

function goToHero() {
    catalogSection.classList.remove('show');
    catalogSection.style.display = 'none';
    heroSection.style.display = 'flex';
    if (authorsSection) authorsSection.style.display = '';
    heroSection.classList.remove('fade-out');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState('', document.title, window.location.pathname + window.location.search);
}

if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goToCatalog();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (catalogSection && catalogSection.classList.contains('show')) goToHero();
    }
});

/* ========================
   ПАРАЛЛАКС НА HERO
   ======================== */
document.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('.hero-content');
    if (!hero) return;
    const rx = (e.clientX / window.innerWidth - 0.5) * 12;
    const ry = (e.clientY / window.innerHeight - 0.5) * 8;
    hero.style.transform = `perspective(1000px) rotateY(${rx}deg) rotateX(${-ry}deg)`;
});

/* ========================
   3D НАКЛОН КАРТОЧЕК
   ======================== */
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-14px) scale(1.01) perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), border-color 0.4s, box-shadow 0.4s';
    });

    card.addEventListener('mouseenter', () => {
        card.style.transition = 'border-color 0.4s, box-shadow 0.4s';
    });
});
