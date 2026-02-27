class Laser {
    constructor(x, y, w, h, blinkFrames = 45) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.blinkFrames = blinkFrames;
        this.timer = 0;
        this.active = true;
        this.suppressed = false; // set true by Button when pressed
        this.alwaysOn = false; // if true, laser stays active unless suppressed
        this.hitCooldown = 0;
    }

    update() {
        if (this.suppressed) {
            this.active = false;
            if (this.hitCooldown > 0) this.hitCooldown--;
            return;
        }
        if (this.alwaysOn) {
            this.active = true;
            if (this.hitCooldown > 0) this.hitCooldown--;
            return;
        }
        this.timer++;
        if (this.timer >= this.blinkFrames) {
            this.timer = 0;
            this.active = !this.active;
        }
        if (this.hitCooldown > 0) this.hitCooldown--;
    }

    draw(ctx, camX) {
        // Draw a solid red beam when active, and a milder red when inactive.
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        if (this.active) {
            ctx.fillStyle = "red";
            ctx.fillRect(drawX, drawY, this.w, this.h);
        } else {
            ctx.fillStyle = "rgba(255,100,100,0.5)";
            ctx.fillRect(drawX, drawY, this.w, this.h);
        }
    }

    hits(entity) {
        if (!this.active || this.hitCooldown > 0) return false;
        return !(entity.x + entity.w < this.x || entity.x > this.x + this.w || entity.y + entity.h < this.y || entity.y > this.y + this.h);
    }

    onHit() {
        this.hitCooldown = 30; // frames of invulnerability for this laser after a hit
    }
}
