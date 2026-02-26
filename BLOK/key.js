class Key {
    constructor(x, y, index = 0) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 28;
        this.index = index;
        this.collected = false;
        this._bob = 0;
        this._scale = 1;
    }

    update() {
        this._bob += 0.08;
    }

    draw(ctx, camX) {
        if (this.collected) return;
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y + Math.sin(this._bob) * 6);

        // Colors
        const gold = '#FFD23F';
        const dark = '#C68600';
        const highlight = '#FFF1B8';

        ctx.save();
        // Bow (round ring)
        const bowX = drawX + 10;
        const bowY = drawY + Math.round(this.h / 2);
        const bowR = 9;
        ctx.beginPath();
        ctx.fillStyle = gold;
        ctx.arc(bowX, bowY, bowR, 0, Math.PI * 2);
        ctx.fill();
        // inner hole
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(bowX, bowY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 1;
        ctx.strokeStyle = dark;
        ctx.beginPath();
        ctx.arc(bowX, bowY, bowR, 0, Math.PI * 2);
        ctx.stroke();

        // Shaft
        const shaftX = drawX + 18;
        const shaftY = drawY + Math.round(this.h / 2) - 6;
        const shaftW = 18;
        const shaftH = 12;
        ctx.fillStyle = gold;
        ctx.fillRect(shaftX, shaftY, shaftW, shaftH);
        ctx.strokeStyle = dark;
        ctx.strokeRect(shaftX, shaftY, shaftW, shaftH);

        // Teeth (two notches)
        ctx.fillStyle = dark;
        ctx.fillRect(shaftX + 12, shaftY + 6, 4, 6);
        ctx.fillRect(shaftX + 8, shaftY + 8, 4, 4);

        // Small highlight on bow
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.ellipse(bowX - 4, bowY - 4, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    collect() {
        this.collected = true;
    }
}

if (typeof window !== 'undefined') window.Key = Key;
