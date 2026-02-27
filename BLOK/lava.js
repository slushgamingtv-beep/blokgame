class Lava {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw(ctx, camX) {
        const drawX = Math.round(this.x - camX);
        const drawY = Math.round(this.y);
        // lava look
        ctx.fillStyle = "#ff5500";
        ctx.fillRect(drawX, drawY, this.w, this.h);
        // subtle highlight
        ctx.fillStyle = "rgba(255,255,200,0.12)";
        ctx.fillRect(drawX, drawY, this.w, Math.floor(this.h/3));
    }

    hits(entity) {
        return !(entity.x + entity.w < this.x || entity.x > this.x + this.w || entity.y + entity.h < this.y || entity.y > this.y + this.h);
    }
}
