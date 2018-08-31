var Canvas = document.getElementById("c");
var ctx = Canvas.getContext("2d", { alpha: false });
var NOOP = function() {};
var ENABLE_MUSIC = false;
var ENABLE_VOICE = false;
var PI = Math.PI;
var TAU = PI * 2;

/**
 * Game states.
 * @enum {number}
 */
var GAME_STATE = {
	LOADING: 0,
	RUNNING: 1,
	CREATE: 2,
	PAUSED: 3
}

/**
 * The different types for Orbitals.
 * @enum {number}
 */
var ORBITAL_TYPE = {
	STAR: 0,
	PLANET: 1,
	SATELLITE: 2,
	MINING: 3,
	DEFENSE: 4,
	MOON: 5
}

/**
 * Buff types for applying to ships.
 * @enum {number}
 */
var BUFF_TYPE = {
	SPEED: 0,
	RANGE: 1
}
