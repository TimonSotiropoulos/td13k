// Cache stuff.
var starSystem;
var gameState = GAME_STATE.LOADING;
var maxDistance = 64;

const GAME_SPEED_SUPERMAN = 180;
const GAME_SPEED_FAST = 120;
const GAME_SPEED_NORMAL = 60;
const GAME_SPEED_SLOW = 30;

var gameSpeed = 2;

// Disables right click context menu.
window.addEventListener("contextmenu", function(e) {
	e.preventDefault();
}, false);

//
Settings.init();


document.addEventListener("keypress", function(e) {
	// Pause the game.
	if (e.key === " ") {
		Tutorial.complete(TUTORIAL_EVENT.PAUSE);
		if (gameState === GAME_STATE.PAUSED) {
			gameState = GAME_STATE.RUNNING;
		} else {
			gameState = GAME_STATE.PAUSED;
		}
	}

	// Game Speed Settings
	if (e.key === "1") { tickLength = 1000 / GAME_SPEED_SLOW; gameSpeed = 1; }
	if (e.key === "2") { tickLength = 1000 / GAME_SPEED_NORMAL; gameSpeed = 2; }
	if (e.key === "3") { tickLength = 1000 / GAME_SPEED_FAST; gameSpeed = 3; }
	if (e.key === "4") { tickLength = 1000 / GAME_SPEED_SUPERMAN; gameSpeed = 4; }

	// Build hotkeys
	if (e.key === "q") { hotkeyBuild(ORBITAL_TYPE.SATELLITE, undefined); }
	if (e.key === "w") { hotkeyBuild(ORBITAL_TYPE.MINING, undefined); }
	if (e.key === "e") { hotkeyBuild(ORBITAL_TYPE.DEFENSE, ORBITAL_MODULE_TYPE.LASER); }
	if (e.key === "r") { hotkeyBuild(ORBITAL_TYPE.DEFENSE, ORBITAL_MODULE_TYPE.BEAM); }
	if (e.key === "t") { hotkeyBuild(ORBITAL_TYPE.DEFENSE, ORBITAL_MODULE_TYPE.ROCKET); }
	if (e.key === "y") { hotkeyBuild(ORBITAL_TYPE.DEFENSE, ORBITAL_MODULE_TYPE.EMP); }
	if (e.key === "u") { hotkeyBuild(ORBITAL_TYPE.DEFENSE, ORBITAL_MODULE_TYPE.LIGHTNING); }

	// Cancel Build hotkey
	if (e.key === 'c') { Build.cancelBlueprint(); }

});

var hotkeyBuild = function(type, modType) {
	var cost = Orbital.getCost(type, modType);
	if (Base.minerals <= cost) {
		return false;
	} else {
		var name = Orbital.getName(type, modType);
		speak("Select an area to build the " + name);
		Build.createBlueprint(type, modType, cost);
		return false;
	}
}

var Game = {

	init: function() {

		// Clear any previous game.
		Orbital.orbitals.length = 0;
		starSystem = SystemGenerator.generate();
		Orbital.orbitals.forEach(function(e) { e.update(); });
		View.init();
		Build.init();
		Laser.clear();
		WaveManager.init();
		EnemyShip.init();
		Tutorial.start();
		Gui.setup();

	}

}



// Update game.
var lastTick = performance.now();
var tickLength = 1000 / 60; // Logic steps per second
var last = 0;
(function frame(timestamp) {

	requestAnimationFrame(frame);
	var nextTick = lastTick + tickLength;
	Fps.update(1 / ((timestamp - last) / 1000));
	last = timestamp;

	if (timestamp > nextTick) {
		var timeSinceTick = timestamp - lastTick;
		var numTicks = Math.floor(timeSinceTick / tickLength);
		update(Math.min(numTicks, 60));
		render();
		lastTick = timestamp;
	}
})(lastTick);

function update(repeat) {

	if (gameState === GAME_STATE.LOADING) {
		LoadingScreen.update();
	} else {

		// Base destroyed.
		if (Orbital.orbitals.indexOf(Base.planet) === -1) {
			gameState = GAME_STATE.LOADING;
			//Game.init();
		}

		hoverName = "";
		View.update();
		Gui.update();
		Tutorial.update();

		if (Build.pending) {
			Build.update();
		}

		if (gameState === GAME_STATE.RUNNING) {
			clickNearest();
			Orbital.orbitals.forEach(function(e) { e.update(); });
			WaveManager.update();
			EnemyShip.update();
			Laser.update();
			Rocket.update();
		}

	}

	Mouse.update();

	// Repeat update.
	if (--repeat) {
		update(repeat);
	}

}

function render() {

	// Draw background
	View.clear();
	drawBackground();
	drawStarscape();

	if (gameState === GAME_STATE.LOADING) {
		View.reset();
		LoadingScreen.render();
	} else {
		View.position();
		Orbital.orbitals.forEach(function(e) { e.render(); });
		ctx.globalAlpha = 1;
		renderAllTrails();
		renderAllOrbits();
		renderAllBodies();
		EnemyShip.render();
		renderComLines();
		Laser.render();
		Rocket.render();

		// Draw line to closer planet.
		var nearest = Orbital.nearest(Mouse.vx, Mouse.vy);
		ctx.scale(1, 1 / View.tilt);
		if (getDistance(nearest, { x: Mouse.vx, y: Mouse.vy }) < maxDistance) {

			// Draw line.
			ctx.beginPath();
			ctx.moveTo(nearest.x, nearest.y);
			ctx.lineTo(Mouse.vx, Mouse.vy);
			ctx.strokeStyle = "#FFF";
			ctx.stroke();

			// Draw reticle.
			ctx.beginPath();
			ctx.arc(nearest.x, nearest.y, 30, 0, TAU);
			ctx.lineWidth = 3;
			ctx.stroke();

		}

		// Draw building radius.
		if (Build.pending) {
			Build.render();
		}

		var centerX = Canvas.width / 2;
		var centerY = Canvas.height / 2;
		ctx.setTransform(1, 0, 0, 1, centerX, centerY);
		View.reset();
		Gui.render();
		// drawDebug();

	}
}
