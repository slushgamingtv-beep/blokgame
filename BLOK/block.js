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
        const prevX = this.x;
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

        // collision with players (prevent falling through players and prevent being pushed into players)
        if (Array.isArray(players)) {
            players.forEach(pl => {
                if (!pl) return;
                // vertical overlap checks first (landing / hitting from below)
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
                // horizontal collision: if block moved into player's horizontal space, push back
                if (this.y + this.h > pl.y && this.y < pl.y + pl.h) {
                    // moved into player from the left
                    if (this.x + this.w > pl.x && prevX + this.w <= pl.x) {
                        this.x = pl.x - this.w;
                        this.vx = 0;
                    }
                    // moved into player from the right
                    if (this.x < pl.x + pl.w && prevX >= pl.x + pl.w) {
                        this.x = pl.x + pl.w;
                        this.vx = 0;
                    }
                }
            });
        }
    }

    draw(ctx, camX) {
        const drawX = Math.round(this.x - (camX || 0));
        const drawY = Math.round(this.y);
        const w = this.w;
        const h = this.h;
        // base wood color
        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(drawX, drawY, w, h);
        // darker outer frame
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#5A371A";
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, w - 1, h - 1);
        // vertical slats (lighter)
        ctx.strokeStyle = "#A97448";
        ctx.lineWidth = 2;
        const slatCount = Math.max(1, Math.floor(w / 24));
        for (let i = 1; i < slatCount; i++) {
            const x = drawX + Math.round(i * w / slatCount);
            ctx.beginPath();
            ctx.moveTo(x + 0.5, drawY + 4);
            ctx.lineTo(x + 0.5, drawY + h - 4);
            ctx.stroke();
        }
        // horizontal reinforcement beam (darker)
        ctx.strokeStyle = "#6B3F20";
        ctx.lineWidth = Math.max(2, Math.floor(w / 60));
        ctx.beginPath();
        ctx.moveTo(drawX + 6, drawY + Math.round(h / 2));
        ctx.lineTo(drawX + w - 6, drawY + Math.round(h / 2));
        ctx.stroke();
    }
}
