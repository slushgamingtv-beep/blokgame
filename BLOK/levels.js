function loadLevel(level) {
    // ensure the global currentLevel matches the requested level
    if (typeof currentLevel !== 'undefined') currentLevel = level;
    resetArrays();
    spawnPlayers();
    if (level === 1) loadLevel1();
    else if (level === 2) loadLevel2();
    else if (level === 3) loadLevel3();
}