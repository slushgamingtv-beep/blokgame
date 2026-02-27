function loadLevel2() {
    const groundY = canvas.height - 60;
    // Tile size used for block/grid math
    const tileSize = 40;
    // Keep only the floor and portal for level 2, but we'll carve a hole later
    const floorX = 0;
    const floorW = 3000;
    // create a full floor initially — we'll replace parts to make a hole under the middle block
    // (we'll add segmented floor below)
    const portalW = 100;
    // place portal all the way to the right end of the floor with a small margin
    portal = {
        x: floorX + floorW - portalW - 20,
        y: groundY - 200, // moved up 2 tiles to make portal 2 tiles taller
        w: portalW,
        h: 200 // increased height by 2 tiles (2 * tileSize = 80)
    };
    // Add a 4x3 block (4 tiles wide x 3 tiles tall).
    const widthTiles = 4;
    const heightTiles = 3;
    const blockW = tileSize * widthTiles; // 160px
    const blockH = tileSize * heightTiles; // 120px
    const blockX = 600; // horizontal position (adjustable)
    // lift the block 1 tile above the floor
    const blockY = groundY - blockH - tileSize;
    platforms.push(new Platform(blockX, blockY, blockW, blockH));

    // Add a 1x1 block on top of the first block (centered)
    const topTileW = tileSize;
    const topTileH = tileSize;
    const topTileX = Math.round(blockX + (blockW - topTileW) / 2 - tileSize/2);
    const topTileY = blockY - topTileH;
    platforms.push(new Platform(topTileX, topTileY, topTileW, topTileH));

    // Add a pushable box at the start, centered under the first block, standing on the floor
    const boxW = 40;
    const boxH = 40;
    const boxX = Math.round(blockX + (blockW - boxW) / 2);
    const boxY = groundY - boxH; // sit on top of the floor
    blocks.push(new Block(boxX, boxY, boxW, boxH));

    // Add lava 2 tiles wide next to the 1x1 top tile (to its right, up high)
    if (typeof Lava !== 'undefined' && typeof lavas !== 'undefined') {
        const lavaW = tileSize * 2;
        const lavaH = tileSize; // 1 tile high lava
        const lavaX = topTileX + topTileW; // directly to the right of the top tile
        const lavaY = topTileY + Math.round(tileSize / 4); // 1/4 tile lower than the top tile
        lavas.push(new Lava(lavaX, lavaY, lavaW, lavaH));
    }

    // Add a 2x1 platform positioned 1 tile above the floor, with a 2-tile gap after the first block
    {
        const gapTiles = 2;
        const platW = tileSize * 2; // 2 tiles wide
        const platH = tileSize; // 1 tile high
        // move platform 3 tiles to the right from its previous placement, plus 2 more tiles as requested
        const platX = blockX + blockW + gapTiles * tileSize + 5 * tileSize;
        const platY = groundY - platH - tileSize; // 1 tile above the floor
        platforms.push(new Platform(platX, platY, platW, platH));
        // Add an identical 2x1 platform directly to the right of the existing one
        // Move the duplicate platform 1 tile left, and expand its width by 4 tiles to the right
        const secondPlatX = blockX + blockW + 9 * tileSize - tileSize; // 1 tile left
        const secondPlatY = platY - tileSize; // moved 1 tile up as before
        const secondPlatW = platW + 7 * tileSize; // extend 7 tiles to the right (added 3 tiles)
        platforms.push(new Platform(secondPlatX, secondPlatY, secondPlatW, platH));
        // Add three lasers to the right of the duplicate platform, each with its own button
        if (typeof Laser !== 'undefined' && typeof lasers !== 'undefined') {
            const laserW = 20;
            const baseLaserH = 160; // like in level1
            const count = 3;
            const gapTilesBetween = 2; // 2 tiles between lasers
            // start position to place lasers: moved 3 tiles left previously; now move an additional 4 tiles left
            const startX = secondPlatX + secondPlatW + tileSize - 7 * tileSize; // start to the right of platform, shifted left 7 tiles total
            for (let i = 0; i < count; i++) {
                let laserH = baseLaserH;
                const laserX = Math.round(startX + i * (laserW + gapTilesBetween * tileSize));
                let laserY = groundY - laserH + 2 * tileSize; // lowered 2 tiles from floor position
                // Prevent the laser from extending below the floor: shrink height if it would.
                const bottom = laserY + laserH;
                if (bottom > groundY) {
                    const excess = bottom - groundY;
                    laserH = Math.max(8, laserH - excess);
                    laserY = Math.min(laserY, groundY - laserH);
                }
                const myLaser = new Laser(laserX, laserY, laserW, laserH);
                myLaser.alwaysOn = true;
                lasers.push(myLaser);
                // Add a button above each laser to suppress it while pressed
                if (typeof Button !== 'undefined' && typeof buttons !== 'undefined') {
                    const btnW = tileSize;
                    const btnH = Math.round(tileSize / 2);
                    const btnX = Math.round(laserX + (laserW - btnW) / 2);
                    const btnY = laserY - btnH - tileSize; // one tile above the laser
                    buttons.push(new Button(btnX, btnY, btnW, btnH, myLaser));
                }
            }
        }
    }

    // Add a 2x2 block on the ground immediately to the right of the last laser
    if (typeof lasers !== 'undefined' && lasers.length > 0) {
        const lastLaser = lasers[lasers.length - 1];
        const twoW = tileSize * 2;
        const twoH = tileSize * 2;
        const twoX = Math.round(lastLaser.x + lastLaser.w + 4 * tileSize); // moved 3 tiles further right (gap of 4 tiles)
        const twoY = groundY - twoH; // sits on floor
        // place a static 2x2 platform (not pushable)
        platforms.push(new Platform(twoX, twoY, twoW, twoH));
        // position the portal two tiles to the left of this lower 2x2 block
        if (typeof portal !== 'undefined' && portal !== null) {
            // make portal 1.5x wider and move it 1 tile to the right,
            // then shorten the right side by 3/4 tile (reduce width)
            const expanded = Math.round((portal.w || portalW) * 1.5);
            const shrink = Math.round(tileSize * 0.75);
            portal.w = Math.max(8, expanded - shrink);
            portal.x = Math.max(0, twoX + 3 * tileSize);
        }
        // place a locked door standing on top of this lower 2x2 platform
        if (typeof Door !== 'undefined' && typeof doors !== 'undefined') {
            const doorW = tileSize; // door width 1 tile, centered on the 2x2
            const doorH = tileSize * 2; // 2 tiles tall
            const doorX = Math.round(twoX + (twoW - doorW) / 2);
            const doorY = twoY - doorH; // sit on top of the platform
            const door = new Door(doorX, doorY, doorW, doorH, 0); // requires key index 0
            doors.push(door);
            // also add to platforms so it blocks until opened
            platforms.push(door);
        }
        // add another identical 2x2 platform positioned two tiles above this one
        const upperW = twoW;
        const upperH = twoH;
        const upperX = twoX;
        const upperY = twoY - 2 * tileSize - upperH; // gap of 2 tiles between platforms
        platforms.push(new Platform(upperX, upperY, upperW, upperH));
        // add a long 8x1 platform on top of the upper 2x2, extending to the right
        const longW = tileSize * 8; // 8 tiles wide
        const longH = tileSize; // 1 tile high
        const longX = upperX; // align left with upper platform
        const longY = upperY - longH; // sit on top of the upper platform
        platforms.push(new Platform(longX, longY, longW, longH));
        // add a vertical platform under the right end of the long platform that reaches down to the floor
        const supportX = longX + longW - tileSize; // align at the rightmost tile of the long platform
        const supportY = longY + longH; // start just under the long platform (bottom of long = upperY)
        const supportH = Math.max(0, groundY - supportY);
        if (supportH > 0) platforms.push(new Platform(supportX, supportY, tileSize, supportH));
        // Add a ground button immediately to the right of this 2x2 block so it can be pressed by pushing the block onto it
        if (typeof Button !== 'undefined' && typeof buttons !== 'undefined' && typeof lasers !== 'undefined' && lasers.length > 0) {
            const btnW = tileSize;
            const btnH = Math.round(tileSize / 2);
            const btnX = Math.round(twoX - btnW); // place on the left side of the 2x2 block
            const btnY = groundY - btnH; // sit on floor
            // Instead of suppressing a laser, spawn a key above the first laser when pressed
            const firstLaser = lasers[0];
            let keySpawn = null;
                if (firstLaser) {
                    const keyX = Math.round(firstLaser.x + (firstLaser.w - 40) / 2 - 2 * tileSize); // moved 2 tiles left total
                    const keyY = Math.round(firstLaser.y - tileSize * 2);
                    keySpawn = { x: keyX, y: keyY, index: 0 };
                }
            // make this ground button only activatable by blocks (not players)
            buttons.push(new Button(btnX, btnY, btnW, btnH, null, keySpawn, false, 'ground'));
        }
    }

    // Add a second block to the right (always present regardless of player count)
    const widthTiles2 = 2; // make the big block 2 tiles wide
    const heightTiles2 = 5; // set to 5 tiles high as requested
    const blockW2 = tileSize * widthTiles2; // 80px
    const blockH2 = tileSize * heightTiles2; // 280px
    const gap = 0; // no gap between blocks
    const blockX2 = blockX + blockW + gap; // place directly to the right of the first block
    const blockY2 = groundY - blockH2 - tileSize; // lifted 1 tile like the first block
    platforms.push(new Platform(blockX2, blockY2, blockW2, blockH2));

    // (Removed the extra 2x11 block here — second-from-right block)
    // Add a thin vertical platform that starts 1 tile above the floor and runs to the top
    // Visible for all player counts; position it after the rightmost of block1/block2/block3 and shift 3 tiles right
    const widthTiles4 = 1; // 1 tile wide
    const blockW4 = tileSize * widthTiles4; // 40px
    // calculate base X: start after block1
    let baseX = blockX + blockW;
    if (typeof blockX2 !== 'undefined' && typeof blockW2 !== 'undefined') baseX = blockX2 + blockW2;
    if (typeof blockX3 !== 'undefined' && typeof blockW3 !== 'undefined') baseX = blockX3 + blockW3;
    const blockX4 = baseX + 5 * tileSize - 4 * tileSize; // moved 4 tiles left from previous placement
    const blockY4 = 0; // start at top
    const blockH4 = Math.max(0, groundY - tileSize - blockY4); // extend down to 1 tile above floor
    if (blockH4 > 0) {
        platforms.push(new Platform(blockX4, blockY4, blockW4, blockH4));
    }
    // --- carve a 1-tile-deep hole in the floor under the middle (tall) block ---
    // Determine hole position centered under the middle block (blockX2)
    // Only create hole area if blockX2 exists (i.e., we computed it above)
    try {
        const holeW = Math.round(tileSize * 1.25); // 1.25 tiles (en kvart blok større)
        // place hole so it ends at the right edge of the first block
        const holeX = (typeof blockX !== 'undefined') ? Math.round(blockX + blockW - holeW) : 800;
        const holeDepth = tileSize; // hole depth = 1 tile
        const floorH = 60;
        // Left floor segment (from floorX to hole)
        const leftW = Math.max(0, holeX - floorX);
        if (leftW > 0) platforms.push(new Platform(floorX, groundY, leftW, floorH));
        // Right floor segment (from hole end to floor end)
        const rightX = holeX + holeW;
        const rightW = Math.max(0, floorX + floorW - rightX);
        if (rightW > 0) platforms.push(new Platform(rightX, groundY, rightW, floorH));
        // Bottom of the hole: a thin platform one tile down so the hole is exactly 1 tile deep
        const bottomY = groundY + holeDepth;
        const bottomH = Math.max(0, floorH - holeDepth);
        if (bottomH > 0) platforms.push(new Platform(holeX, bottomY, holeW, bottomH));
    } catch (e) {
        // fallback: if something goes wrong, ensure there's a full floor
        platforms.push(new Platform(floorX, groundY, floorW, 60));
    }

    // No tall blocks or doors otherwise in this level — keep only floor, portal and the new blocks
}
