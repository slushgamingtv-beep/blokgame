class Door extends Platform {
    constructor(x, y, w, h, keyIndex = 0) {
        super(x, y, w, h);
        this.keyIndex = keyIndex;
        this.opened = false;
        this._origH = h;
    }

    open() {
        if (this.opened) return;
        this.opened = true;
        this.h = 0; // remove collision by collapsing height
    }

    close() {
        if (!this.opened) return;
        this.opened = false;
        this.h = this._origH;
    }

    draw(ctx, camX) {
        if (this.opened) return;
        ctx.fillStyle = "#4B2E83"; // door color
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        ctx.fillRect(drawX, drawY, this.w, this.h);
        // simple doorknob
        ctx.fillStyle = "#D4AF37";
        ctx.fillRect(drawX + this.w - 10, drawY + Math.round(this.h / 2) - 3, 6, 6);
    }
}

// Export for environments that may use modules (not required by current HTML setup)
if (typeof window !== 'undefined') window.Door = Door;
