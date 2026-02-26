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
		const bx4 = (bx3 + 80) + 7 * 40; // original position + 7 tiles
		const by4 = groundY - 160; // keep same vertical placement
		platforms.push(new Platform(bx4, by4, 40, 40));
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
	if (level === 3 && typeof addBlockRightOfPlayers === 'function') addBlockRightOfPlayers();
	gameLoop();
}