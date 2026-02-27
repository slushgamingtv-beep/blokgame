class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw(ctx, camX) {
        ctx.fillStyle = "#666";
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        ctx.fillRect(drawX, drawY, this.w, this.h);
    }
}

// MovingPlatform: vertical elevator that moves between baseY and targetY when enabled
class MovingPlatform extends Platform {
    constructor(x, y, w, h, travel = 0, speed = 2) {
        super(x, y, w, h);
        this.baseY = y;
        this.travel = travel; // pixels to move upward
        this.targetY = this.baseY - Math.abs(travel);
        this.speed = Math.abs(speed);
        this.enabled = false; // when true, platform moves toward targetY
        this._dir = 0; // -1 = moving up, 1 = moving down, 0 = stopped
        this.oscillate = true; // when enabled, oscillate up/down
    }

    update(players) {
        const prevY = this.y;
        // determine direction
        if (this.enabled) {
            if (this._dir === 0) this._dir = -1; // start moving up
        } else {
            // when disabled, return to base and stop
            if (this.y < this.baseY) this._dir = 1; else this._dir = 0;
        }

        if (this._dir === -1) {
            // move up
            this.y = Math.max(this.targetY, this.y - this.speed);
            if (this.y <= this.targetY + 0.5) {
                // reached top
                if (this.enabled && this.oscillate) this._dir = 1;
                else this._dir = 1; // if not oscillating still fall back down
            }
        } else if (this._dir === 1) {
            // move down
            this.y = Math.min(this.baseY, this.y + this.speed);
            if (this.y >= this.baseY - 0.5) {
                // reached base
                if (this.enabled && this.oscillate) this._dir = -1;
                else this._dir = 0; // stop at base when disabled
            }
        }

        const dy = this.y - prevY;
        if (dy === 0) return;
        // move players that were standing on the platform's previous top
        if (Array.isArray(players)) {
            for (let p of players) {
                // horizontal overlap
                if (p.x + p.w > this.x && p.x < this.x + this.w) {
                    // if player's bottom was approximately at prevY (standing on platform)
                    if (Math.abs((p.y + p.h) - prevY) < 6) {
                        p.y += dy;
                        // cancel upward velocity when being carried up
                        if (dy < 0) p.vy = 0;
                        p.onGround = true;
                    }
                }
            }
        }
    }
}