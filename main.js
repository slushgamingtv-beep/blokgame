window.startGame = function(n) {
	window.playerCount = n;
	// Replace the player-select content with a level selection screen
	const sel = document.getElementById('player-select');
	sel.innerHTML = `
		<div class="dialog">
			<div class="center"><h2>Vælg bane</h2></div>
			<div class="button-row">
				<button id="lvl1">Level 1</button>
				<button id="lvl2">Level 2</button>
				<button id="lvl3">Level 3</button>
			</div>
		</div>
	`;

	document.getElementById('lvl1').addEventListener('click', () => beginGame(1));
	document.getElementById('lvl2').addEventListener('click', () => beginGame(2));
	document.getElementById('lvl3').addEventListener('click', () => beginGame(3));
};

function setupTouchControls(n) {
	let controls = document.getElementById("touch-controls");
	controls.innerHTML = "";
	for (let i = 0; i < n; i++) {
		let div = document.createElement("div");
		div.className = "p-controls";
		div.innerHTML = `
			<button class="control-btn left" data-player="${i}" data-dir="left">←</button>
			<button class="control-btn jump" data-player="${i}" data-dir="jump">⭡</button>
			<button class="control-btn right" data-player="${i}" data-dir="right">→</button>
		`;
		controls.appendChild(div);

		div.querySelectorAll('.control-btn').forEach(btn => {
			btn.addEventListener('touchstart', e => {
				e.preventDefault();
				let player = parseInt(btn.dataset.player);
				let dir = btn.dataset.dir;
				if (typeof setPlayerMove === 'function') setPlayerMove(player, dir);
				if (typeof keyState !== 'undefined') {
					if (player === 0) {
						if (dir === 'left') keyState['ArrowLeft'] = true;
						if (dir === 'right') keyState['ArrowRight'] = true;
						if (dir === 'jump') keyState['ArrowUp'] = true;
					} else if (player === 1) {
						if (dir === 'left') keyState['a'] = true;
						if (dir === 'right') keyState['d'] = true;
						if (dir === 'jump') keyState['w'] = true;
					}
				}
			});
			btn.addEventListener('touchend', e => {
				e.preventDefault();
				let player = parseInt(btn.dataset.player);
				let dir = btn.dataset.dir;
				if (typeof stopPlayerAction === 'function') stopPlayerAction(player, dir);
				if (typeof keyState !== 'undefined') {
					if (player === 0) {
						if (dir === 'left') keyState['ArrowLeft'] = false;
						if (dir === 'right') keyState['ArrowRight'] = false;
						if (dir === 'jump') keyState['ArrowUp'] = false;
					} else if (player === 1) {
						if (dir === 'left') keyState['a'] = false;
						if (dir === 'right') keyState['d'] = false;
						if (dir === 'jump') keyState['w'] = false;
					}
				}
			});
			btn.addEventListener('mousedown', e => {
				let player = parseInt(btn.dataset.player);
				let dir = btn.dataset.dir;
				if (typeof setPlayerMove === 'function') setPlayerMove(player, dir);
				if (typeof keyState !== 'undefined') {
					if (player === 0) {
						if (dir === 'left') keyState['ArrowLeft'] = true;
						if (dir === 'right') keyState['ArrowRight'] = true;
						if (dir === 'jump') keyState['ArrowUp'] = true;
					} else if (player === 1) {
						if (dir === 'left') keyState['a'] = true;
						if (dir === 'right') keyState['d'] = true;
						if (dir === 'jump') keyState['w'] = true;
					}
				}
			});
			btn.addEventListener('mouseup', e => {
				let player = parseInt(btn.dataset.player);
				let dir = btn.dataset.dir;
				if (typeof stopPlayerAction === 'function') stopPlayerAction(player, dir);
				if (typeof keyState !== 'undefined') {
					if (player === 0) {
						if (dir === 'left') keyState['ArrowLeft'] = false;
						if (dir === 'right') keyState['ArrowRight'] = false;
						if (dir === 'jump') keyState['ArrowUp'] = false;
					} else if (player === 1) {
						if (dir === 'left') keyState['a'] = false;
						if (dir === 'right') keyState['d'] = false;
						if (dir === 'jump') keyState['w'] = false;
					}
				}
			});
		});
	}

	// Center 'Giv op' button that makes the player lose a life.
	// Insert it into the middle of the player controls instead of appending.
	const centerDiv = document.createElement('div');
	centerDiv.className = 'center-control';
	centerDiv.innerHTML = `<button id="giveup-btn" class="control-btn giveup">Giv op</button>`;
	// insert roughly in the middle of the children
	const insertIndex = Math.floor(n / 2);
	const ref = controls.children[insertIndex] || null;
	controls.insertBefore(centerDiv, ref);
	const giveup = document.getElementById('giveup-btn');
	if (giveup) {
		giveup.addEventListener('touchstart', e => {
			e.preventDefault();
			if (typeof loseLife === 'function') loseLife();
		});
		giveup.addEventListener('mousedown', e => {
			if (typeof loseLife === 'function') loseLife();
		});
	}
}

// Create a 1x1 block (40x40) positioned to the right of the spawned avatars.
window.addBlockRightOfPlayers = function() {
	const n = typeof window.playerCount === 'number' ? window.playerCount : 2;
	const groundY = (typeof canvas !== 'undefined') ? (canvas.height - 60) : 660;
	const spawnX = 120;
	const spacing = 50; // player spacing used in spawnPlayers
	const lastPlayerX = spawnX + (n - 1) * spacing;
	const bx = lastPlayerX + 80; // place two tiles to the right
	const by = groundY - 40; // sit on top of ground
	if (typeof platforms !== 'undefined' && typeof Platform !== 'undefined') {
		platforms.push(new Platform(bx, by, 40, 40));
		// also create a 2-block-high static platform immediately to the right of the 1x1
		const bx2 = bx + 40; // one tile to the right
		const by2 = groundY - 80; // two tiles tall -> top at groundY - 80
		platforms.push(new Platform(bx2, by2, 40, 80));
		// add a 3-block-high static platform immediately to the right of the 2-block platform
		const bx3 = bx2 + 40; // next tile to the right
		const by3 = groundY - 120; // three tiles tall -> top at groundY - 120
		platforms.push(new Platform(bx3, by3, 40, 120));
		// also create another 3-block-high platform one tile to the right of the previous 3-high
		const bx3b = bx3 + 40;
		const by3b = groundY - 160; // place on ground (four tiles tall)
		platforms.push(new Platform(bx3b, by3b, 40, 160));

		// add a 5-block-high platform immediately to the right of the 4-high
		const bx5 = bx3b + 40;
		const by5 = groundY - 200; // five tiles tall -> top at groundY - 200
		platforms.push(new Platform(bx5, by5, 40, 200));
		// rightmost platform: make it a 1x1 block positioned 3 blocks above the ground
		// move the rightmost 1x1 block 7 tiles further to the right
		const bx4 = (bx3 + 80) + 3 * 40; // moved 1 tile to the right from previous
		const by4 = groundY - 200; // keep same vertical placement (1 tile up)
		// increase width by 4 tiles (was 1 tile wide) and extend 3 more tiles to the right
		const wideW = 40 * 5;
		platforms.push(new Platform(bx4, by4, wideW + 3 * 40, 40));
		// add lava under the wide platform down to the ground
		if (typeof Lava !== 'undefined' && typeof lavas !== 'undefined') {
			const lavaX = Math.max(0, bx4 - 2 * 40); // shift 2 tiles left, clamp to 0
			const lavaH = 40; // 1 block high
			const lavaY = groundY - lavaH + 10; // sit a quarter block lower (10px)
			const lavaW = wideW + 3 * 40; // extend 3 tiles to the right
			lavas.push(new Lava(lavaX, lavaY, lavaW, lavaH));
			// place a 1x1 block immediately to the right of the lava (sits on ground)
			const rightBlockX = lavaX + lavaW;
			const rightBlockY = groundY - 40;
			platforms.push(new Platform(rightBlockX, rightBlockY, 40, 40));
			// duplicate: place an identical column-style block 5 tiles to the right
			const copyBlockX = rightBlockX + 5 * 40;
			// create a door on the ground first (so we can size the column to meet it)
			if (typeof Door !== 'undefined' && typeof doors !== 'undefined') {
				const doorW = 40;
				const doorH = 80; // 2 tiles tall
				const doorX = copyBlockX; // aligned under the column
				const doorY = groundY - doorH; // sit on ground
				const door = new Door(doorX, doorY, doorW, doorH, 0);
				doors.push(door);
				platforms.push(door);
				// place a larger 4x4 (160x160) pushable block directly to the right of the door,
				// and then the smaller 2x2 to its right (they are swapped compared to before)
				if (typeof Block !== 'undefined' && typeof blocks !== 'undefined') {
					const bigBoxX = doorX + doorW; // directly to the right of the door
					const bigBoxY = groundY - 120; // three tiles high, sit on ground (3x3 => 120px)
						blocks.push(new Block(bigBoxX, bigBoxY, 120, 120));
						// create an elevator platform in the floor directly under the 3x3 box
						if (typeof MovingPlatform !== 'undefined' && typeof platforms !== 'undefined') {
							const elevW = 120; // match the 3x3 box width
							const elevX = bigBoxX; // align under the big box
							// start the elevator one block down in the floor
							const elevY = groundY; // sunk one tile below the floor surface
							// to reach 6 blocks above the floor surface, travel needs to be 7 tiles from this sunk base
							const travel = 7 * 40; // move up so the final top is 6 blocks above the floor
							const speed = 4; // pixels per frame
							var elevator = new MovingPlatform(elevX, elevY, elevW, 40, travel, speed);
							platforms.push(elevator);
							// place the level-4 portal where the elevator ends when fully raised
							if (typeof portal !== 'undefined') {
								const portalW = 100;
								const portalH = 120;
								const px = elevX + Math.round((elevW - portalW) / 2);
								const py = Math.max(0, elevator.targetY - portalH);
								portal = { x: px, y: py, w: portalW, h: portalH };
							}
						}
					// place the smaller 2x2 immediately to the right of the 3x3
					const smallBoxX = bigBoxX + 120; // directly after the 3x3
					const smallBoxY = groundY - 80; // two tiles high, sit on ground
					blocks.push(new Block(smallBoxX, smallBoxY, 80, 80));
				}
				// now create a tall platform that spans from the top down to the door's top
				const columnTopY = 0;
				const columnH = Math.max(0, doorY - columnTopY);
				if (columnH > 0) platforms.push(new Platform(copyBlockX, columnTopY, 40, columnH));

						// place an extra tall column (reach the ceiling) 12 tiles to the right of the tall column
						const distantBlockX = copyBlockX + 12 * 40; // offset from column
						const distantColumnTop = 0;
						const distantColumnH = Math.max(0, groundY - distantColumnTop);
						if (distantColumnH > 0) platforms.push(new Platform(distantBlockX, distantColumnTop, 40, distantColumnH));
						// small 1x1 block directly to the left of the distant column
						// make this platform 2 blocks wide and position it immediately left of the distant column
						const leftOfDistantX = distantBlockX - 80;
						const leftOfDistantY = groundY - 4 * 40; // 4 blocks above ground
						platforms.push(new Platform(leftOfDistantX, leftOfDistantY, 80, 40));
						// place a button centered on top of this 2-tile-wide platform
						// this button controls the elevator (toggleElevator)
						if (typeof Button !== 'undefined' && typeof buttons !== 'undefined') {
							const btnW2 = 40;
							const btnH2 = Math.round(40 / 2);
							const btnX2 = leftOfDistantX + Math.round((80 - btnW2) / 2);
							const btnY2 = leftOfDistantY - btnH2; // sits on top of the platform
							// keep the button pressed while occupied so elevator runs while pressed
							buttons.push(new Button(btnX2, btnY2, btnW2, btnH2, typeof elevator !== 'undefined' ? elevator : null, null, true, 'latch'));
						}
			}
			// place a button immediately to the right of the 1x1 block
			if (typeof Button !== 'undefined' && typeof buttons !== 'undefined') {
				const btnW = 40;
				const btnH = Math.round(40 / 2);
				const btnX = rightBlockX + 40; // directly after the 1x1 block
				const btnY = groundY - btnH; // sits on ground
				// ground button: unbind the rope when pressed
				buttons.push(new Button(btnX, btnY, btnW, btnH, null, null, true, 'unbindRope'));
			}
			// place a key under the middle of the wide platform
			if (typeof Key !== 'undefined' && typeof keys !== 'undefined') {
				const platformW = wideW + 3 * 40;
				const keyX = bx4 + Math.round((platformW - 40) / 2);
				const keyY = by4 + 40 + 4; // just below platform
				keys.push(new Key(keyX, keyY, 0));
			}
		}
	}
};

function beginGame(level) {
	// hide the selection and start
	document.getElementById('player-select').style.display = 'none';
	// unpause the game loop in case we came from Game Over
	window.gamePaused = false;
	setupTouchControls(window.playerCount || 2);
	loadLevel(level);
	// For Level 3, automatically create a 1x1 block to the right of avatars
	// Level 3 setup is handled by loadLevel -> loadLevel3 and will call helpers as needed.
	gameLoop();
}