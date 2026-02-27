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
// When true players are constrained by the rope; can be toggled by a button
window.ropeBound = true;
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

// Attempt to move a player vertically by dy but clamp movement to avoid intersecting
// with platforms, blocks or other players. Returns the actual applied dy.
function tryMoveVert(player, dy) {
    if (!player || dy === 0) return 0;
    let allowed = dy;
    // check platforms
    for (let plat of platforms) {
        if (!(player.x + player.w > plat.x && player.x < plat.x + plat.w)) continue;
        if (dy > 0) {
            // moving down: if currently above platform and would overlap, clamp
            if (player.y + player.h <= plat.y && player.y + player.h + dy > plat.y) {
                allowed = Math.min(allowed, plat.y - (player.y + player.h));
            }
        } else {
            // moving up
            if (player.y >= plat.y + plat.h && player.y + dy < plat.y + plat.h) {
                allowed = Math.max(allowed, (plat.y + plat.h) - player.y);
            }
        }
    }
    // check blocks (solid for players)
    for (let b of blocks) {
        if (!(player.x + player.w > b.x && player.x < b.x + b.w)) continue;
        if (dy > 0) {
            if (player.y + player.h <= b.y && player.y + player.h + dy > b.y) {
                allowed = Math.min(allowed, b.y - (player.y + player.h));
            }
        } else {
            if (player.y >= b.y + b.h && player.y + dy < b.y + b.h) {
                allowed = Math.max(allowed, (b.y + b.h) - player.y);
            }
        }
    }
    // check other players to avoid pushing them through obstacles
    for (let other of players) {
        if (other === player) continue;
        if (!(player.x + player.w > other.x && player.x < other.x + other.w)) continue;
        if (dy > 0) {
            if (player.y + player.h <= other.y && player.y + player.h + dy > other.y) {
                allowed = Math.min(allowed, other.y - (player.y + player.h));
            }
        } else {
            if (player.y >= other.y + other.h && player.y + dy < other.y + other.h) {
                allowed = Math.max(allowed, (other.y + other.h) - player.y);
            }
        }
    }
    player.y += allowed;
    return allowed;
}

function applyRopeConstraints(players) {
    if (!players || players.length < 2) return;
    const TILE = 40; // one block size
    const maxLen = TILE * 2.5; // maximum rope length: 2.5 blocks (extended by half a block)
    const maxCorrectionPerFrame = 12; // maximum correction per axis per iteration
    for (let i = 0; i < players.length - 1; i++) {
        const a = players[i];
        const b = players[i + 1];
        // Use full 2D distance between centers to clamp rope length
        let ax = a.x + a.w / 2;
        let ay = a.y + a.h / 2;
        let bx = b.x + b.w / 2;
        let by = b.y + b.h / 2;
        let dx = bx - ax;
        let dy = by - ay;
        let dist = Math.hypot(dx, dy);
        if (dist <= maxLen) continue;
        // how much to reduce the separation
        let remaining = dist - maxLen;
        let attempts = 6;
        // Determine which player(s) are actively moving from input (either axis)
        const aMoving = Math.abs(a.vx) > 0.1 || Math.abs(a.vy) > 0.1;
        const bMoving = Math.abs(b.vx) > 0.1 || Math.abs(b.vy) > 0.1;
        while (remaining > 0 && attempts-- > 0) {
            const step = Math.min(remaining / 2, maxCorrectionPerFrame);
            // normalized direction from A -> B
            ax = a.x + a.w / 2;
            ay = a.y + a.h / 2;
            bx = b.x + b.w / 2;
            by = b.y + b.h / 2;
            dx = bx - ax;
            dy = by - ay;
            dist = Math.hypot(dx, dy);
            if (dist === 0) break;
            const nx = dx / dist;
            const ny = dy / dist;
            const moveX = nx * step;
            const moveY = ny * step;
            let movedA_x = 0, movedA_y = 0, movedB_x = 0, movedB_y = 0;
            if (aMoving && !bMoving) {
                // Pull B toward A (allow mover A to drag B horizontally),
                // but do NOT pull B downward (disallow positive dy).
                const pullB_y = Math.min(0, -moveY);
                movedB_x = tryMoveHoriz(b, -moveX);
                movedB_y = tryMoveVert(b, pullB_y);
                // if B couldn't move, fallback to moving A back (but still no downward move)
                if (movedB_x === 0 && movedB_y === 0) {
                    const blockA_y = Math.min(0, -moveY);
                    movedA_x = tryMoveHoriz(a, -moveX);
                    movedA_y = tryMoveVert(a, blockA_y);
                }
            } else if (bMoving && !aMoving) {
                // Pull A toward B, but do NOT pull A downward.
                const pullA_y = Math.min(0, moveY);
                movedA_x = tryMoveHoriz(a, moveX);
                movedA_y = tryMoveVert(a, pullA_y);
                if (movedA_x === 0 && movedA_y === 0) {
                    const blockB_y = Math.min(0, moveY);
                    movedB_x = tryMoveHoriz(b, moveX);
                    movedB_y = tryMoveVert(b, blockB_y);
                }
            } else {
                // distribute between both, but disallow any downward pulling for either
                const distA_y = Math.min(0, moveY);
                const distB_y = Math.min(0, -moveY);
                movedA_x = tryMoveHoriz(a, moveX);
                movedA_y = tryMoveVert(a, distA_y);
                movedB_x = tryMoveHoriz(b, -moveX);
                movedB_y = tryMoveVert(b, distB_y);
            }
            // recompute separation
            ax = a.x + a.w / 2;
            ay = a.y + a.h / 2;
            bx = b.x + b.w / 2;
            by = b.y + b.h / 2;
            dx = bx - ax;
            dy = by - ay;
            dist = Math.hypot(dx, dy);
            remaining = Math.max(0, dist - maxLen);
            if ((movedA_x === 0 && movedA_y === 0) && (movedB_x === 0 && movedB_y === 0)) break;
        }
        // Final hard clamp fallback: if still over limit, snap B relative to A to enforce maxLen
        ax = a.x + a.w / 2;
        ay = a.y + a.h / 2;
        bx = b.x + b.w / 2;
        by = b.y + b.h / 2;
        dx = bx - ax;
        dy = by - ay;
        dist = Math.hypot(dx, dy);
        if (dist > maxLen && dist !== 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            if (aMoving && !bMoving) {
                // clamp A so distance == maxLen using collision-aware moves
                const targetCenterX = bx - nx * maxLen;
                const targetCenterY = by - ny * maxLen;
                const desiredAX = targetCenterX - a.w / 2;
                const desiredAY = targetCenterY - a.h / 2;
                const deltaAx = desiredAX - a.x;
                const deltaAy = desiredAY - a.y;
                tryMoveHoriz(a, deltaAx);
                tryMoveVert(a, deltaAy);
            } else if (bMoving && !aMoving) {
                // clamp B using collision-aware moves
                const targetCenterX = ax + nx * maxLen;
                const targetCenterY = ay + ny * maxLen;
                const desiredBX = targetCenterX - b.w / 2;
                const desiredBY = targetCenterY - b.h / 2;
                const deltaBx = desiredBX - b.x;
                const deltaBy = desiredBY - b.y;
                tryMoveHoriz(b, deltaBx);
                tryMoveVert(b, deltaBy);
            } else {
                // move B relative to A using collision-aware moves
                const targetCenterX = ax + nx * maxLen;
                const targetCenterY = ay + ny * maxLen;
                const desiredBX = targetCenterX - b.w / 2;
                const desiredBY = targetCenterY - b.h / 2;
                const deltaBx = desiredBX - b.x;
                const deltaBy = desiredBY - b.y;
                tryMoveHoriz(b, deltaBx);
                tryMoveVert(b, deltaBy);
            }
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
                <div class="dialog">
                    <div class="center">
                        <h2>Vælg antal spillere</h2>
                    </div>
                    <div class="button-row">
                        <button onclick="startGame(2)">2 spillere</button>
                        <button class="disabled-choice" disabled>3 spillere</button>
                        <button class="disabled-choice" disabled>4 spillere</button>
                    </div>
                </div>
            `;
        }
    } else {
        // restart the same level from the beginning: fully reset level state
        // ensure rope and camera are reset to defaults
        window.ropeBound = true;
        camX = 0;
        window.gamePaused = false;
        // reload the current level (loadLevel will call resetArrays and spawnPlayers)
        if (typeof currentLevel !== 'undefined' && currentLevel === 3) loadLevel(3);
        else loadLevel(currentLevel);
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

    // Opdater spilleres vx baseret på keyState (ignorer spillere der allerede er i portalen)
    // Spiller 1
    if (players[0] && !players[0].inPortal) {
        if (keyState["ArrowRight"] && !keyState["ArrowLeft"]) {
            players[0].vx = MOVE_SPEED;
        } else if (keyState["ArrowLeft"] && !keyState["ArrowRight"]) {
            players[0].vx = -MOVE_SPEED;
        } else if (!keyState["ArrowLeft"] && !keyState["ArrowRight"]) {
            players[0].vx = 0;
        }
    }
    // Spiller 2
    if (players[1] && !players[1].inPortal) {
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

    // update players (with player collision and block pushing) — skip players already in the portal
    players.forEach((p, idx) => {
        if (p.inPortal) return;
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

    // Prepare list of active players (those not yet inside a portal)
    const activePlayers = players.filter(p => !p.inPortal);

    // If level 3, apply rope constraints between active players so they're tied together
    if (typeof currentLevel !== 'undefined' && currentLevel === 3 && window.ropeBound !== false) {
        applyRopeConstraints(activePlayers);
    }

    // update buttons state (pressed or not) based on active players and blocks so they can be activated by pushed blocks
    if (typeof buttons !== 'undefined') buttons.forEach(b => b.update(activePlayers, blocks));

    // update lasers after buttons so suppression takes effect immediately
    lasers.forEach(l => l.update());

    // update moving platforms (if any)
    if (typeof platforms !== 'undefined') {
        platforms.forEach(p => { if (typeof p.update === 'function') p.update(activePlayers); });
    }

    // --- Key collection: if an active player touches a key, collect and open matching doors ---
    if (typeof keys !== 'undefined' && typeof activePlayers !== 'undefined') {
        for (let key of keys) {
            if (key.collected) continue;
            for (let p of activePlayers) {
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

    // check if any active player fell out of the screen
    let fellOut = activePlayers.some(p => p.y > canvas.height);
    if (fellOut) {
        loseLife();
        // do not return; always draw the level
    }

    // camera follows center of active players; if none active keep current camX
    if (activePlayers.length > 0) {
        let minX = Math.min(...activePlayers.map(p => p.x));
        let maxX = Math.max(...activePlayers.map(p => p.x));
        let centerX = (minX + maxX) / 2;
        camX = centerX - canvas.width / 2;
    }

    // draw platforms
    // (doors removed)

    platforms.forEach(p => p.draw(ctx, camX));
    // draw rope under players for level 3 (only if rope is bound)
    if (typeof currentLevel !== 'undefined' && currentLevel === 3 && window.ropeBound !== false) {
        drawRope(ctx, camX);
    }
    // draw buttons
    if (typeof buttons !== 'undefined') buttons.forEach(b => b.draw(ctx, camX));
    // draw blocks
    blocks.forEach(b => b.draw(ctx, camX));
    // draw keys
    if (typeof keys !== 'undefined') keys.forEach(k => k.draw(ctx, camX));
    // draw players (only those not yet in the portal)
    activePlayers.forEach(p => p.draw(ctx, camX));

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

    // laser collision with active players
    for (let l of lasers) {
        if (!l.active) continue;
        for (let p of activePlayers) {
            if (l.hits(p)) {
                l.onHit();
                loseLife();
                break;
            }
        }
    }

    // lava collision with active players (instant death)
    for (let lava of lavas) {
        for (let p of activePlayers) {
            if (lava.hits(p)) {
                loseLife();
                break;
            }
        }
    }

    // portal collision: when an active player touches the portal, mark them as inside and hide them.
    // advance level only when every player has entered the portal.
    if (portal) {
        for (let p of activePlayers) {
            if (p.x + p.w > portal.x && p.x < portal.x + portal.w && p.y + p.h > portal.y && p.y < portal.y + portal.h) {
                p.inPortal = true;
                p.vx = 0;
                p.vy = 0;
                p.onGround = false;
            }
        }
        // if all players (including those already latched) are inPortal, advance
        const allInPortal = players.length > 0 && players.every(p => p.inPortal);
        if (allInPortal) {
            // if next level would be 4, return to the start/player-select menu (game finished)
            if (typeof currentLevel !== 'undefined' && (currentLevel + 1) === 4) {
                // show initial player-select screen so users can choose players again
                const sel = document.getElementById('player-select');
                if (sel) {
                    sel.style.display = 'flex';
                    sel.innerHTML = `
                        <div class="dialog">
                            <div class="center">
                                <h2>Vælg antal spillere</h2>
                            </div>
                            <div class="button-row">
                                <button onclick="startGame(2)">2 spillere</button>
                                <button class="disabled-choice" disabled>3 spillere</button>
                                <button class="disabled-choice" disabled>4 spillere</button>
                            </div>
                        </div>
                    `;
                }
                window.gamePaused = true;
                // reset lives to default
                lives = 3;
            } else {
                currentLevel++;
                loadLevel(currentLevel);
            }
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
