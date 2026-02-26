class Player {
    constructor(x, y, color = "cyan") {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.inPortal = false;
        this.color = color;
        this.jumpStarted = false; // whether a jump has been initiated (used to prevent re-triggering)
        this.jumpHeld = false; // whether the jump button is currently held
        this.jumpHeldTime = 0; // how long the jump has been held (frames)
        this.jumpStartY = null; // Y position when jump started (used to limit height)
    }

    update(platforms, players) {

        this.vy += 1.0; // gravity (increased slightly to make jumps a bit shorter)
        // --- BLOCK COLLISION (pushable) ---
        if (typeof blocks !== 'undefined') {
            // Horizontal movement and block push
            this.x += this.vx;
            for (let block of blocks) {
                if (
                    this.x + this.w > block.x && this.x < block.x + block.w &&
                    this.y + this.h > block.y && this.y < block.y + block.h
                ) {
                    // Only push if moving horizontally into block
                    let canPush = true;
                    if (this.vx > 0) {
                        // Check if block can move right
                        let newBlockX = block.x + this.vx;
                        for (let plat of platforms) {
                            if (
                                newBlockX < plat.x + plat.w &&
                                newBlockX + block.w > plat.x &&
                                block.y + block.h > plat.y &&
                                block.y < plat.y + plat.h
                            ) {
                                canPush = false;
                                break;
                            }
                        }
                        if (canPush) {
                            block.x = newBlockX;
                            this.x = block.x - this.w;
                        } else {
                            this.x = block.x - this.w;
                        }
                    } else if (this.vx < 0) {
                        // Check if block can move left
                        let newBlockX = block.x + this.vx;
                        for (let plat of platforms) {
                            if (
                                newBlockX < plat.x + plat.w &&
                                newBlockX + block.w > plat.x &&
                                block.y + block.h > plat.y &&
                                block.y < plat.y + plat.h
                            ) {
                                canPush = false;
                                break;
                            }
                        }
                        if (canPush) {
                            block.x = newBlockX;
                            this.x = block.x + block.w;
                        } else {
                            this.x = block.x + block.w;
                        }
                    }
                }
            }
        } else {
            this.x += this.vx;
        }
        this.y += this.vy;

        // collision with platforms og blokke (ovenpå)
        let landed = false;
        // Platforms
        platforms.forEach(p => {
            // Land ovenpå
            if (this.x + this.w > p.x &&
                this.x < p.x + p.w &&
                this.y + this.h > p.y &&
                this.y + this.h < p.y + 20 &&
                this.vy >= 0) {
                this.y = p.y - this.h;
                this.vy = 0;
                landed = true;
            }
            // Sidekollision
            if (this.y + this.h > p.y && this.y < p.y + p.h) {
                // Fra venstre
                if (this.x + this.w > p.x && this.x < p.x && this.vx > 0) {
                    this.x = p.x - this.w;
                    this.vx = 0;
                }
                // Fra højre
                if (this.x < p.x + p.w && this.x + this.w > p.x + p.w && this.vx < 0) {
                    this.x = p.x + p.w;
                    this.vx = 0;
                }
            }
            // Kollision nedenunder
            if (this.x + this.w > p.x &&
                this.x < p.x + p.w &&
                this.y < p.y + p.h &&
                this.y > p.y &&
                this.vy < 0) {
                this.y = p.y + p.h;
                this.vy = 0;
            }
        });
        // Blokke (ovenpå)
        if (typeof blocks !== 'undefined') {
            blocks.forEach(b => {
                if (
                    this.x + this.w > b.x &&
                    this.x < b.x + b.w &&
                    this.y + this.h > b.y &&
                    this.y + this.h < b.y + 20 &&
                    this.vy >= 0
                ) {
                    this.y = b.y - this.h;
                    this.vy = 0;
                    landed = true;
                }
            });
        }

        // collision with other players (solid)
        let landedOnPlayer = false;
        for (let other of players) {
            if (other === this) continue;
            // Check vertical collision (landing on top)
            if (
                this.x + this.w > other.x &&
                this.x < other.x + other.w &&
                this.y + this.h > other.y &&
                this.y + this.h < other.y + other.h &&
                this.vy >= 0
            ) {
                // Land på anden spiller
                this.y = other.y - this.h;
                // BOOST: Hvis den underste hopper, følg med
                if (other.vy < 0) {
                    this.vy = other.vy;
                    this.onGround = false;
                } else {
                    this.vy = 0;
                    landedOnPlayer = true;
                }
            }
            // Sidekollision
            if (this.y + this.h > other.y && this.y < other.y + other.h) {
                // Fra venstre
                if (this.x + this.w > other.x && this.x < other.x && this.vx > 0) {
                    this.x = other.x - this.w;
                    this.vx = 0;
                }
                // Fra højre
                if (this.x < other.x + other.w && this.x + this.w > other.x + other.w && this.vx < 0) {
                    this.x = other.x + other.w;
                    this.vx = 0;
                }
            }
            // Kollision nedenunder
            if (this.x + this.w > other.x &&
                this.x < other.x + other.w &&
                this.y < other.y + other.h &&
                this.y > other.y &&
                this.vy < 0) {
                this.y = other.y + other.h;
                this.vy = 0;
            }
        }
        this.onGround = landed || landedOnPlayer;
    }

    draw(ctx, camX) {
        ctx.fillStyle = this.color;
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        ctx.fillRect(drawX, drawY, this.w, this.h);
        // Key no longer drawn inside player avatar (keys are global UI)
    }
}