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