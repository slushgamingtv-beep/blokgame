function loadLevel3() {
    // Simple empty level: only a floor
    const groundY = canvas.height - 60;
    // Make a long floor platform
    platforms.push(new Platform(0, groundY, 2000, 60));
    // No other entities (no lasers, buttons, keys, doors)
}
