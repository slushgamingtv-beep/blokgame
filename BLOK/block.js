class Block {
    constructor(x, y, w = 40, h = 40) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
    }

    update(platforms, blocks, players) {
        // store previous position for collision checks
        const prevY = this.y;
        this.vy += 0.6; // gravity (reduced to match player behaviour)
        this.x += this.vx;
        this.y += this.vy;

        // collision with platforms
        let landed = false;
        platforms.forEach(p => {
            if (this.x + this.w > p.x &&
                this.x < p.x + p.w &&
                this.y + this.h > p.y &&
                this.y + this.h < p.y + 20 &&
                this.vy >= 0) {
                this.y = p.y - this.h;
                this.vy = 0;
                landed = true;
            }
            // Side collision with platforms
            if (this.y + this.h > p.y && this.y < p.y + p.h) {
                if (this.x + this.w > p.x && this.x < p.x && this.vx > 0) {
                    this.x = p.x - this.w;
                    this.vx = 0;
                }
                if (this.x < p.x + p.w && this.x + this.w > p.x + p.w && this.vx < 0) {
                    this.x = p.x + p.w;
                    this.vx = 0;
                }
            }
            // Collision from below with platforms
            if (this.x + this.w > p.x &&
                this.x < p.x + p.w &&
                this.y < p.y + p.h &&
                this.y > p.y &&
                this.vy < 0) {
                this.y = p.y + p.h;
                this.vy = 0;
            }
        });

        // collision with players (prevent falling through players)
        if (Array.isArray(players)) {
            players.forEach(pl => {
                if (!pl) return;
                // horizontal overlap
                if (this.x + this.w > pl.x && this.x < pl.x + pl.w) {
                    // landing on player's head
                    if (prevY + this.h <= pl.y && this.y + this.h >= pl.y && this.vy >= 0) {
                        this.y = pl.y - this.h;
                        this.vy = 0;
                        landed = true;
                    }
                    // hitting player from below
                    if (prevY >= pl.y + pl.h && this.y < pl.y + pl.h && this.vy < 0) {
                        this.y = pl.y + pl.h;
                        this.vy = 0;
                    }
                }
            });
        }
    }

    draw(ctx, camX) {
        ctx.fillStyle = "#b5651d";
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        ctx.fillRect(drawX, drawY, this.w, this.h);
    }
}
