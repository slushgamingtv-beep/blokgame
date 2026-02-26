class Button {
    constructor(x, y, w, h, targetLaser = null, spawnKey = null, allowPlayers = true, variant = null) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.pressed = false;
        this.targetLaser = targetLaser;
        this.spawnKey = spawnKey; // {x,y,index}
        this._spawnedKey = false;
        this.allowPlayers = allowPlayers;
        this.variant = variant;
    }

    update(players, blocks) {
        // pressed if any player OR any block touches it (overlap)
        const wasPressed = this.pressed;
        // check activation: blocks always count, players only if allowed
        let pressedByBlock = false;
        let pressedByPlayer = false;
        if (Array.isArray(blocks)) {
            pressedByBlock = blocks.some(b => !(b.x + b.w < this.x || b.x > this.x + this.w || b.y + b.h < this.y || b.y > this.y + this.h));
        }
        if (this.allowPlayers && Array.isArray(players)) {
            pressedByPlayer = players.some(p => !(p.x + p.w < this.x || p.x > this.x + this.w || p.y + p.h < this.y || p.y > this.y + this.h));
        }
        this.pressed = pressedByBlock || pressedByPlayer;
        if (this.targetLaser) this.targetLaser.suppressed = this.pressed;
        // spawn a key once when the button is pressed (edge trigger)
        if (!wasPressed && this.pressed && this.spawnKey && !this._spawnedKey) {
            if (typeof Key !== 'undefined' && typeof keys !== 'undefined') {
                // avoid spawning duplicate keys near the same position
                const nearby = keys.some(k => Math.abs(k.x - this.spawnKey.x) < 8 && Math.abs(k.y - this.spawnKey.y) < 8 && !k.collected);
                if (!nearby) {
                    keys.push(new Key(this.spawnKey.x, this.spawnKey.y, this.spawnKey.index || 0));
                    this._spawnedKey = true;
                }
            }
        }
        return wasPressed !== this.pressed;
    }

    draw(ctx, camX) {
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        if (this.variant === 'ground') {
            // distinct ground button style
            ctx.fillStyle = this.pressed ? '#2266aa' : '#5577cc';
            ctx.fillRect(drawX, drawY, this.w, this.h);
            ctx.strokeStyle = '#113355';
            ctx.strokeRect(drawX, drawY, this.w, this.h);
            // small indicator circle when not pressed
            ctx.fillStyle = this.pressed ? '#aaddff' : '#ddeeff';
            ctx.beginPath();
            ctx.arc(drawX + this.w/2, drawY + this.h/2, Math.max(4, this.w/6), 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.pressed ? '#22aa22' : '#aa7722';
            ctx.fillRect(drawX, drawY, this.w, this.h);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(drawX, drawY, this.w, this.h);
        }
    }
}
