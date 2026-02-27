function loadLevel(level) {
    // ensure the global currentLevel matches the requested level
    if (typeof currentLevel !== 'undefined') currentLevel = level;
    resetArrays();
    spawnPlayers();
    if (level === 1) loadLevel1();
    else if (level === 2) loadLevel2();
    else if (level === 3) loadLevel3();
    // When programmatically loading level 3 (e.g., after a respawn), also run
    // the helper that adds the additional platforms/objects that are created
    // during initial game start (beginGame previously called this).
    if (level === 3 && typeof addBlockRightOfPlayers === 'function') addBlockRightOfPlayers();
}