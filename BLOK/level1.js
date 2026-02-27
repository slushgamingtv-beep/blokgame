function loadLevel1() {
    const groundY = canvas.height - 60;
    let tallBlockX = null;
    let tallBlockBottom = null;

    // start platform split so there is a gap under the overhang for the pushable block
        // start platform
        // Udvid platformen så den går til portalen
        platforms.push(new Platform(0, groundY, 2000, 60));

    // (hop-platform fjernet)

    // overhang efter hop-platform: placeret så en blok (h=40) netop kan skubbes ind under
    // platformens bottom vil være ved groundY - 40, så y = groundY - 40 - thickness
        // ekstra blok før blok 1: rører ved blok 1 men er 1 blok oppe i luften
        // gør denne blok kun 1 blok høj (40px); bevar bund placeret 1 blok over blok1 bund
        // bund = groundY - 80 => top = groundY - 120 when height = 40
        platforms.push(new Platform(710, groundY - 120, 40, 40));

        // høj blok efter hop-platform — 1 blok bred (40px) og 3 blokke høj (120px)
        // bund placeret 1 blok (40px) over gulvet => top = groundY - 40 - 120 = groundY - 160
        platforms.push(new Platform(750, groundY - 160, 40, 120));

    // lavere blok, kun tilgængelig med stacking
    // Gør blok 2 kun 1 blok høj og 1 blok bred (40x40), hold mellemrummet på 1 blok
    platforms.push(new Platform(830, groundY - 40, 40, 40));

    // ny blok efter blok 2: højde justeret så toppen svarer til laser-indikatorblokkenes top
    // bund forbliver 1 blok over gulvet (groundY - 40)
    // top = groundY - 200 => højde = (groundY - 40) - (groundY - 200) = 160
    platforms.push(new Platform(910, groundY - 200, 40, 160));

    // lodret blok ovenpå den høje blok: går fra toppen af canvas (0) til toppen af den høje blok
    // placeret samme x og bredde som den høje blok
    platforms.push(new Platform(910, 0, 40, groundY - 200));

    // efter den 5-bloks-høje blok: en lav bred blok 1 blok over jorden, 4 blokke bred (160px)
    // placér den direkte op ad den forrige blok så de rører: previous right = 910 + 40 = 950 => x = 950
    // gør den kun 2 blokke bred (80px)
    platforms.push(new Platform(950, groundY - 80, 80, 40));

    // place a key centered on the wide platform before the lasers
    if (typeof Key !== 'undefined') {
        const platX = 950;
        const platW = 80;
        const keyW = 40;
        const keyX = platX + Math.round((platW - keyW) / 2);
        const keyY = groundY - 80 - Math.round(28); // use Key.h (visual height)
        if (typeof keys !== 'undefined') keys.push(new Key(keyX, keyY, 0));
    }

    // pushable block starter centreret under blok 1
    blocks.push(new Block(750, groundY - 40));

    // efter den brede platform: tilføj 4 blinkende lasere med 1 blok mellemrum
    // placer laserne på gulvet (bund = groundY) og giv dem progressive blinkhastigheder
    if (typeof Laser !== 'undefined') {
        const laserW = 20;
        const gap = 80; // øget afstand: 2 blokke mellem hver laser
        const startX = 950 + 80 + gap; // starter lige efter brede platform
        const blinkFrames = [90, 60, 40, 60]; // først langsom, så hurtigere (sidste gjort langsommere)
        for (let i = 0; i < 4; i++) {
            const x = startX + i * (laserW + gap);
            const h = 160; // højde på laser (px)
            const y = groundY - h; // bund på groundY => står på gulvet
            const bf = blinkFrames[i] || 45;
            lasers.push(new Laser(x, y, laserW, h, bf));
            // indikatorblok over hver laser: 40px høj, normalt centreret.
            const indicatorH = 40;
            if (i === 0) {
                // make the first indicator wide enough to reach the tall block (starts at x=910)
                const indicatorX = 910; // align left to tall block left
                const indicatorW = Math.max(40, Math.round((x + laserW / 2) - indicatorX) + 20); // +20px (half block)
                const indicatorY = y - indicatorH;
                platforms.push(new Platform(indicatorX, indicatorY, indicatorW, indicatorH));
                // (key removed)
            } else {
                const indicatorW = 40;
                const indicatorX = x - (indicatorW - laserW) / 2;
                const indicatorY = y - indicatorH;
                platforms.push(new Platform(indicatorX, indicatorY, indicatorW, indicatorH));
            }
        }
    }

    // efter den sidste laser: tilføj en blok 1 blok over gulvet
    // beregn last laser x
    if (typeof Laser !== 'undefined') {
        const laserW = 20;
        const gap = 80;
        const startX = 950 + 80 + gap;
        const lastX = startX + 3 * (laserW + gap);
        const blockX = lastX + laserW + 40; // 1 blok (40px) gap efter sidste laser
        // flyt 1 blok til højre og 1 blok højere, og udvid blokken så den går helt til toppen
        const newX = blockX + 40; // 1 blok til højre
        const newTop = 0; // top of canvas
        const newHeight = (groundY - 80) - newTop; // går til toppen; tidligere ønsket 1 blok højere -> groundY - 80
        platforms.push(new Platform(newX, newTop, 40, newHeight));
        tallBlockX = newX;
        tallBlockBottom = newTop + newHeight;
    }

    // portal
    portal = {
        x: 1900,
        y: groundY - 120,
        w: 100,
        h: 120
    };

    // Door under the tall block that only opens if the key is collected
    if (typeof Door !== 'undefined') {
        const doorW = 40;
        // make the door extend from the bottom of the tall block down to the ground
        const blockBottomY = (tallBlockBottom !== null) ? tallBlockBottom : (groundY - 80);
        const doorH = Math.max(8, Math.round(groundY - blockBottomY));
        const doorX = (tallBlockX !== null) ? tallBlockX : (910 - 40);
        const doorY = blockBottomY;
        const door = new Door(doorX, doorY, doorW, doorH, 0); // requires key index 0
        if (typeof doors !== 'undefined') doors.push(door);
        // Add to platforms initially so it blocks passage until opened
        platforms.push(door);
    }
}