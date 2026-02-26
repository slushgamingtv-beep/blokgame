let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");
// Disable smoothing for a pixel-art / 8-bit look
if (ctx) ctx.imageSmoothingEnabled = false;

// Global tunables for movement and feel
const MOVE_SPEED = 5; // change this to make horizontal movement faster/slower


let players = [];
let platforms = [];
let blocks = [];
let lasers = [];
let lavas = [];
let buttons = [];
let keys = [];
let doors = [];
let currentLevel = 1;
let playerCount = 4;
let camX = 0;
let lives = 3;
let portal = null;
// When true the main loop won't schedule the next frame
window.gamePaused = false;

// Rope helpers for level 3: visually connect players and constrain max segment length
// Attempt to move a player horizontally by dx but clamp movement to avoid intersecting
// with platforms, blocks or other players. Returns the actual applied dx.
function tryMoveHoriz(player, dx) {
    if (!player || dx === 0) return 0;
    let allowed = dx;
    // check platforms
    for (let plat of platforms) {
        if (!(player.y + player.h > plat.y && player.y < plat.y + plat.h)) continue;
        if (dx > 0) {
            // moving right: if currently to the left of platform and would overlap, clamp
            if (player.x + player.w <= plat.x && player.x + player.w + dx > plat.x) {
                allowed = Math.min(allowed, plat.x - (player.x + player.w));
            }
        } else {
            // moving left
            if (player.x >= plat.x + plat.w && player.x + dx < plat.x + plat.w) {
                allowed = Math.max(allowed, (plat.x + plat.w) - player.x);
            }
        }
    }
    // check blocks (solid for players)
    for (let b of blocks) {
        if (!(player.y + player.h > b.y && player.y < b.y + b.h)) continue;
        if (dx > 0) {
            if (player.x + player.w <= b.x && player.x + player.w + dx > b.x) {
                allowed = Math.min(allowed, b.x - (player.x + player.w));
            }
        } else {
            if (player.x >= b.x + b.w && player.x + dx < b.x + b.w) {
                allowed = Math.max(allowed, (b.x + b.w) - player.x);
            }
        }
    }
    // check other players to avoid pushing them through obstacles
    for (let other of players) {
        if (other === player) continue;
        if (!(player.y + player.h > other.y && player.y < other.y + other.h)) continue;
        if (dx > 0) {
            if (player.x + player.w <= other.x && player.x + player.w + dx > other.x) {
                allowed = Math.min(allowed, other.x - (player.x + player.w));
            }
        } else {
            if (player.x >= other.x + other.w && player.x + dx < other.x + other.w) {
                allowed = Math.max(allowed, (other.x + other.w) - player.x);
            }
        }
    }
    player.x += allowed;
    return allowed;
}

function applyRopeConstraints(players) {
    if (!players || players.length < 2) return;

    // Rope implemented as a spring-damper applying impulses (velocity changes only).
    // This keeps the collision system authoritative while producing a stable, elastic rope.
    const TILE = 40;
    const restLen = TILE * 1.0; // ideal rope length
    const stiffness = 1.0; // spring stiffness
    const damping = 0.6; // damping for stability
    const maxImpulse = 48; // cap impulse per frame
    const maxCarryGap = TILE * 1.0; // how far below an anchor the hanger may be

    const standsOnPlatform = (pl) => {
        for (let p of platforms) {
            if (pl.x + pl.w > p.x && pl.x < p.x + p.w) {
                if (Math.abs((pl.y + pl.h) - p.y) <= 2) return true;
            }
        }
        return false;
    };

    for (let i = 0; i < players.length - 1; i++) {
        const A = players[i];
        const B = players[i + 1];

        // world-space centers
        const ax = A.x + A.w / 2;
        const ay = A.y + A.h / 2;
        const bx = B.x + B.w / 2;
        const by = B.y + B.h / 2;

        let dx = bx - ax;
        let dy = by - ay;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 0.0001) continue;

        // Only act when rope is stretched beyond rest
        if (dist <= restLen) continue;

        // normalized direction from A -> B
        const nx = dx / dist;
        const ny = dy / dist;

        // relative velocity along the rope
        const relVel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;

        // spring-damper impulse (dt ~1)
        let impulse = stiffness * (dist - restLen) + damping * relVel;
        // clamp impulse
        if (impulse > maxImpulse) impulse = maxImpulse;
        if (impulse < -maxImpulse) impulse = -maxImpulse;

        const Aanch = A.onGround && standsOnPlatform(A);
        const Banch = B.onGround && standsOnPlatform(B);

        // If one player is anchored (standing on a platform), that player acts as the carrier.
        // Apply the corrective impulse primarily to the non-anchored player so carrier can hold them.
        if (Aanch && !Banch) {
            B.vx += -nx * impulse;
            B.vy += -ny * impulse;

            // If B is touching ground because they fell while rope is stretched, lift them so they hang.
            if (B.onGround) {
                B.onGround = false;
                B.vy = Math.min(B.vy, -10);
                // ensure not embedded in platform
                const groundY = canvas.height - 60;
                if (B.y + B.h >= groundY) B.y = groundY - B.h - 2;
                for (let p of platforms) {
                    if (B.x + B.w > p.x && B.x < p.x + p.w && B.y + B.h > p.y && B.y < p.y + p.h) {
                        B.y = p.y - B.h - 2;
                    }
                }
            }

            // Enforce that B remains within max carry gap below A
            const verticalGap = (B.y + B.h/2) - (A.y + A.h/2);
            if (verticalGap > maxCarryGap) {
                const desiredCenter = (A.y + A.h/2) + maxCarryGap;
                const newY = desiredCenter - B.h/2 - 1;
                // only apply if it doesn't intersect platforms
                let coll = false;
                for (let p of platforms) {
                    if (B.x + B.w > p.x && B.x < p.x + p.w && newY + B.h > p.y && newY < p.y + p.h) { coll = true; break; }
                }
                if (!coll) { B.y = newY; B.vy = Math.min(B.vy, -2); B.onGround = false; }
            }
        } else if (Banch && !Aanch) {
            A.vx += nx * impulse;
            A.vy += ny * impulse;
            if (A.onGround) {
                A.onGround = false;
                A.vy = Math.min(A.vy, -10);
                const groundY = canvas.height - 60;
                if (A.y + A.h >= groundY) A.y = groundY - A.h - 2;
                for (let p of platforms) {
                    if (A.x + A.w > p.x && A.x < p.x + p.w && A.y + A.h > p.y && A.y < p.y + p.h) {
                        A.y = p.y - A.h - 2;
                    }
                }
            }
            const verticalGap = (A.y + A.h/2) - (B.y + B.h/2);
            if (verticalGap > maxCarryGap) {
                const desiredCenter = (B.y + B.h/2) + maxCarryGap;
                const newY = desiredCenter - A.h/2 - 1;
                let coll = false;
                for (let p of platforms) {
                    if (A.x + A.w > p.x && A.x < p.x + p.w && newY + A.h > p.y && newY < p.y + p.h) { coll = true; break; }
                }
                if (!coll) { A.y = newY; A.vy = Math.min(A.vy, -2); A.onGround = false; }
            }
        } else {
            // both free or both anchored: split impulses so both respond
            const half = 0.5 * impulse;
            A.vx += nx * half; A.vy += ny * half;
            B.vx += -nx * half; B.vy += -ny * half;
        }
    }
}

function drawRope(ctx, camX) {
    if (!players || players.length < 2) return;
    ctx.save();
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // simple two-tone rope
    for (let i = 0; i < players.length - 1; i++) {
        const a = players[i];
        const b = players[i + 1];
        const ax = Math.round(a.x + a.w / 2 - camX);
        const ay = Math.round(a.y + a.h / 2);
        const bx = Math.round(b.x + b.w / 2 - camX);
        const by = Math.round(b.y + b.h / 2);
        // shadow line
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.moveTo(ax, ay + 2);
        ctx.lineTo(bx, by + 2);
        ctx.stroke();
        // main rope
        ctx.strokeStyle = '#8B5A2B'; // brown rope
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
    }
    ctx.restore();
}
// Key state for flere samtidige taster
let keyState = {};

function loseLife() {
    lives--;
    if (lives <= 0) {
        // Game Over: reset lives, pause the game loop and show the start menu
        lives = 3;
        window.gamePaused = true;
        const sel = document.getElementById('player-select');
        if (sel) {
            sel.style.display = 'flex';
            sel.innerHTML = `
                <h2>Vælg antal spillere</h2>
                <button onclick="startGame(2)">2 spillere</button>
                <button onclick="startGame(3)">3 spillere</button>
                <button onclick="startGame(4)">4 spillere</button>
            `;
        }
    } else {
        // restart the same level from the beginning
        loadLevel(currentLevel);
    }
}


function resetArrays() {
    players = [];
    platforms = [];
    blocks = [];
    lasers = [];
    lavas = [];
    buttons = [];
    portal = null;
    keys = [];
    doors = [];
}

function spawnPlayers() {
    const groundY = canvas.height - 60;
    const spawnX = 120;
    const spawnY = groundY - 200;
    const colors = ["red", "blue", "green", "orange"];
    let n = typeof window.playerCount === "number" ? window.playerCount : playerCount;
    for (let i = 0; i < n; i++) {
        let color = colors[i % colors.length];
        const p = new Player(spawnX + i * 50, spawnY, color);
        p.id = i;
        players.push(p);
    }
}


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Opdater spilleres vx baseret på keyState
    // Spiller 1
    if (players[0]) {
        if (keyState["ArrowRight"] && !keyState["ArrowLeft"]) {
            players[0].vx = MOVE_SPEED;
        } else if (keyState["ArrowLeft"] && !keyState["ArrowRight"]) {
            players[0].vx = -MOVE_SPEED;
        } else if (!keyState["ArrowLeft"] && !keyState["ArrowRight"]) {
            players[0].vx = 0;
        }
    }
    // Spiller 2
    if (players[1]) {
        if (keyState["d"] && !keyState["a"]) {
            players[1].vx = MOVE_SPEED;
        } else if (keyState["a"] && !keyState["d"]) {
            players[1].vx = -MOVE_SPEED;
        } else if (!keyState["a"] && !keyState["d"]) {
            players[1].vx = 0;
        }
    }

    // update blocks (gravity/collision) — include players so blocks don't fall through them
    blocks.forEach(b => b.update(platforms, blocks, players));

    // update keys (bobbing animation)
    if (typeof keys !== 'undefined') keys.forEach(k => k.update());

    // update players (with player collision and block pushing)
    players.forEach((p, idx) => {
        // Try to push blocks
        blocks.forEach(block => {
            // Only push if player is moving horizontally and colliding from the side
            if (
                p.y + p.h > block.y && p.y < block.y + block.h &&
                ((p.x + p.w > block.x && p.x < block.x && p.vx > 0) ||
                 (p.x < block.x + block.w && p.x + p.w > block.x + block.w && p.vx < 0))
            ) {
                // Only push if block is not blocked by a platform or another block
                let canPush = true;
                // Check for platform collision in push direction
                let dx = p.vx > 0 ? 1 : -1;
                let testX = block.x + dx;
                for (let plat of platforms) {
                    if (
                        testX < plat.x + plat.w &&
                        testX + block.w > plat.x &&
                        block.y + block.h > plat.y &&
                        block.y < plat.y + plat.h
                    ) {
                        canPush = false;
                        break;
                    }
                }
                // Check for other blocks
                for (let other of blocks) {
                    if (other !== block &&
                        testX < other.x + other.w &&
                        testX + block.w > other.x &&
                        block.y + block.h > other.y &&
                        block.y < other.y + other.h
                    ) {
                        canPush = false;
                        break;
                    }
                }
                if (canPush) {
                    block.vx = p.vx;
                } else {
                    // Block can't move, so player can't move further
                    p.vx = 0;
                }
            }
        });
        // --- Jump handling (support hold-to-extend) ---
        // Map keyboard jump keys for player 0 and 1
        let jumpKey = null;
        if (idx === 0) jumpKey = "ArrowUp";
        else if (idx === 1) jumpKey = "w";

        if (jumpKey) {
            if (keyState[jumpKey]) {
                if (p.onGround && !p.jumpStarted) {
                    // initial jump impulse (reduced to lower max height)
                    p.vy = -10;
                    p.jumpStarted = true;
                    p.jumpHeld = true;
                    p.jumpHeldTime = 0;
                    p.jumpStartY = p.y;
                } else if (p.jumpHeld && p.jumpHeldTime < 6) {
                    // while held, apply a smaller additional upward boost for variable height
                    p.vy -= 0.3; // reduced to make hold-to-extend slower
                    p.jumpHeldTime++;
                }
            } else {
                p.jumpHeld = false;
            }
        }

        p.update(platforms, players);

        // No hard cap: extended jump controlled only by hold duration and gravity

        // Reset jumpStarted when player lands
        if (p.onGround) {
            p.jumpStarted = false;
            p.jumpHeldTime = 0;
            p.jumpHeld = false;
            p.jumpStartY = null;
        }
    });

    // If level 3, apply rope constraints between players so they're tied together
    if (typeof currentLevel !== 'undefined' && currentLevel === 3) {
        applyRopeConstraints(players);
    }

    // update buttons state (pressed or not) based on players and blocks so they can be activated by pushed blocks
    if (typeof buttons !== 'undefined') buttons.forEach(b => b.update(players, blocks));

    // update lasers after buttons so suppression takes effect immediately
    lasers.forEach(l => l.update());

    // --- Key collection: if a player touches a key, collect and open matching doors ---
    if (typeof keys !== 'undefined' && typeof players !== 'undefined') {
        for (let key of keys) {
            if (key.collected) continue;
            for (let p of players) {
                if (p.x + p.w > key.x && p.x < key.x + key.w && p.y + p.h > key.y && p.y < key.y + key.h) {
                    key.collect();
                    // open doors that require this key
                    if (typeof doors !== 'undefined') {
                        for (let d of doors) {
                            if (d && d.keyIndex === key.index) d.open();
                        }
                    }
                    break;
                }
            }
        }
    }

    // (button presses removed)

    // Friction for blocks
    blocks.forEach(b => {
        b.vx *= 0.8;
        if (Math.abs(b.vx) < 0.1) b.vx = 0;
    });

    // check if any player fell out of the screen
    let fellOut = players.some(p => p.y > canvas.height);
    if (fellOut) {
        loseLife();
        // do not return; always draw the level
    }

    // camera follows center of all players
    if (players.length > 0) {
        let minX = Math.min(...players.map(p => p.x));
        let maxX = Math.max(...players.map(p => p.x));
        let centerX = (minX + maxX) / 2;
        camX = centerX - canvas.width / 2;
    }

    // draw platforms
    // (doors removed)

    platforms.forEach(p => p.draw(ctx, camX));
    // draw rope under players for level 3
    if (typeof currentLevel !== 'undefined' && currentLevel === 3) {
        drawRope(ctx, camX);
    }
    // draw buttons
    if (typeof buttons !== 'undefined') buttons.forEach(b => b.draw(ctx, camX));
    // draw blocks
    blocks.forEach(b => b.draw(ctx, camX));
    // draw keys
    if (typeof keys !== 'undefined') keys.forEach(k => k.draw(ctx, camX));
    // draw players
    players.forEach(p => p.draw(ctx, camX));

    // draw portal
    if (portal) {
        ctx.fillStyle = "purple";
        ctx.fillRect(Math.round(portal.x - camX), Math.round(portal.y), portal.w, portal.h);
    }

    // draw lasers
    lasers.forEach(l => l.draw(ctx, camX));

    // draw lavas
    lavas.forEach(l => l.draw(ctx, camX));

    // (doors removed)

    // laser collision with players
    for (let l of lasers) {
        if (!l.active) continue;
        for (let p of players) {
            if (l.hits(p)) {
                l.onHit();
                loseLife();
                break;
            }
        }
    }

    // lava collision with players (instant death)
    for (let lava of lavas) {
        for (let p of players) {
            if (lava.hits(p)) {
                loseLife();
                break;
            }
        }
    }

    // portal collision
    if (portal) {
        let allInPortal = players.every(p =>
            p.x + p.w > portal.x &&
            p.x < portal.x + portal.w &&
            p.y + p.h > portal.y &&
            p.y < portal.y + portal.h
        );

        if (allInPortal) {
            currentLevel++;
            loadLevel(currentLevel);
        }
    }

    // (keys removed)

    // (doors removed)

    // UI - draw hearts for lives (pixel-art style)
    const drawHeart = (x, y, size, filled) => {
        // 7x6 pixel heart pattern for a clearer heart shape
        const pattern = [
            [0,1,1,0,1,1,0],
            [1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1],
            [0,1,1,1,1,1,0],
            [0,0,1,1,1,0,0],
            [0,0,0,1,0,0,0]
        ];
        const rows = pattern.length;
        const cols = pattern[0].length;
        const ps = Math.max(1, Math.floor(size / rows));
        for (let ry = 0; ry < rows; ry++) {
            for (let rx = 0; rx < cols; rx++) {
                if (pattern[ry][rx]) {
                    ctx.fillStyle = filled ? '#FF4D4D' : 'rgba(255,77,77,0.25)';
                    ctx.fillRect(x + rx * ps, y + ry * ps, ps, ps);
                }
            }
        }
    };
    const heartSize = 36;
    const gap = 8;
    for (let i = 0; i < 3; i++) {
        const hx = 20 + i * (heartSize + gap);
        const hy = 12;
        drawHeart(hx, hy, heartSize, i < lives);
    }

    // (key UI removed)

    if (!window.gamePaused) requestAnimationFrame(gameLoop);
}

// INPUT
document.addEventListener("keydown", e => {
    keyState[e.key] = true;
});

document.addEventListener("keyup", e => {
    keyState[e.key] = false;
});

// -------------------- TOUCH STYRING TIL 2-4 SPILLERE --------------------

function setPlayerMove(playerIndex, dir) {
    let p = players[playerIndex];
    if (!p) return;

    if (dir === "left") p.vx = -MOVE_SPEED;
    if (dir === "right") p.vx = MOVE_SPEED;
    if (dir === "jump") {
        if (p.onGround && !p.jumpStarted) {
            p.vy = -10;
            p.jumpStarted = true;
            p.jumpHeld = true;
            p.jumpHeldTime = 0;
            p.jumpStartY = p.y;
        } else {
            p.jumpHeld = true;
        }
    }
}

function stopPlayerAction(playerIndex, dir) {
    let p = players[playerIndex];
    if (!p) return;
    if (dir === "left" || dir === "right") p.vx = 0;
    if (dir === "jump") p.jumpHeld = false;
}

document.querySelectorAll("#touch-controls .control-btn").forEach(btn => {

    btn.addEventListener("touchstart", e => {
        e.preventDefault();
        let player = parseInt(btn.dataset.player);
        let dir = btn.dataset.dir;
        setPlayerMove(player, dir);
    });

    btn.addEventListener("touchend", e => {
        e.preventDefault();
        let player = parseInt(btn.dataset.player);
        let dir = btn.dataset.dir;
        stopPlayerAction(player, dir);
    });

    btn.addEventListener("mousedown", e => {
        let player = parseInt(btn.dataset.player);
        let dir = btn.dataset.dir;
        setPlayerMove(player, dir);
    });

    btn.addEventListener("mouseup", e => {
        let player = parseInt(btn.dataset.player);
        let dir = btn.dataset.dir;
        stopPlayerAction(player, dir);
    });
});
