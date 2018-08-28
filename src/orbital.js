var orbitals = [];
var coms = [];
var def = [];

/** @enum {number} */
var ORBITAL_TYPE = {
	STAR: 0,
	PLANET: 1,
	SATELLITE: 2,
	MINING: 3,
	DEFENSE: 4
}

function Orbital(color, size, x, y, orbit, distance, speed, angle) {
	if (angle === undefined) angle = 0;
	var t = {};
	t.name = "Some Shithole Planet";
	t.type = ORBITAL_TYPE.STAR;
	t.x = x;
	t.y = y;
	t.color = color;
	t.size = size;
	t.isSun = false;
	t.id = orbitals.length.toString();
	t.hp = 100;
	t.upgrades = [];
	if (orbit) {
		t.orbit = {
			planet: orbit,
			distance: distance,
			speed: speed,
			angle: angle
		};
	}
	t.update = function() {

		// Update orbit.
		if (t.orbit) {
			var e = t.orbit;
			e.angle += e.speed;
			t.x = e.distance * Math.cos(e.angle) + e.planet.x;
			t.y = e.distance * Math.sin(e.angle) + e.planet.y;
		}

	}
	t.render = function() {
		renderTrail(t);
	}
	orbitals.push(t);
	return t;
};

function sun(color, size, x, y) {
	var t = Orbital(color, size, x, y, null, null, null, null);
	t.name = "The Sun";
	t.type = ORBITAL_TYPE.STAR;
	t.isSun = true;
	return t;
}

function planet(color, size, orbit, distance, speed, angle) {
	if (angle === undefined) angle = 0;
	var t = Orbital(color, size, 0, 0, orbit, distance + size / 2, speed, angle);
	t.name = "Planet";
	t.type = ORBITAL_TYPE.PLANET;
	t.update = extend(t.update, function() {

	})
	return t;
}

function createStation(what) {
	window[what]()
}

function miningStation(orbit) {
	var angle = splitToMax(miningStation.max, orbit, coms);
	if (angle === undefined)
		return;
	var t = Orbital(getHSL(212, 100, 97), 2, 0, 0, orbit, orbit.size * 3, -0.005, null);
	t.name = "Mining Station";
	t.type = ORBITAL_TYPE.MINING;
	t.update = extend(t.update, function() {
		base.minerals += base.mineRate;
	})
	return t;
}

miningStation.max = 4;

function satellite(orbit) {
	var angle = splitToMax(satellite.max, orbit, coms);
	if (angle === undefined)
		return;
	var t = Orbital(getHSL(160, 100, 50), 2, 0, 0, orbit, orbit.size * 5, 0.01, angle);
	t.name = "Satellite";
	t.type = ORBITAL_TYPE.SATELLITE;
	t.index = coms.length;
	t.cache = sprSatellite;
	t.update = extend(t.update, function() {
		base.energy += base.energyRate;
	})
	coms.push(t);
	return t;
}

satellite.max = 3;
satellite.create = function() {

}

function defenseStation(orbit) {
	var angle = splitToMax(defenseStation.max, orbit, def);
	if (angle === undefined)
		return;
	var t = Orbital(getHSL(33, 100, 50), 2, 0, 0, orbit, orbit.size * 7, 0.005, angle);
	t.name = "Defense Platform";
	t.type = ORBITAL_TYPE.DEFENSE;
	t.index = def.length;
	def.push(t);
	t.module = defenseStation.modules.laser(t, 1);
	t.update = extend(t.update, t.module.update);
	t.render = extend(t.render, t.module.render);
	return t;
}

/**
 * @param {Object} t Orbital.
 * @return {Array}
 */
function getDefenseStationUpgrades(t) {

	if (!t.module) return [];

	var arr = [];

	if (t.module.type === "laser") {
		arr.push({
			text: "Laser (Level " + (t.module.level + 1) + ")",
			img: null, func: null
		});
	} else {
		arr.push({
			text: "Laser (Level 1)",
			img: null, func: null
		});
	}

	if (t.module.type === "Beam") {
		arr.push({
			text: "Beam (Level " + (t.module.level + 1) + ")",
			img: null, func: null
		});
	} else {
		arr.push({
			text: "Beam (Level 1)",
			img: null, func: null
		});
	}

	if (t.module.type === "Rockets") {
		arr.push({
			text: "Rockets (Level " + (t.module.level + 1) + ")",
			img: null, func: null
		});
	} else {
		arr.push({
			text: "Rockets (Level 1)",
			img: null, func: null
		});
	}

	return arr;

}

defenseStation.max = 2;

defenseStation.modules = {

	// Beam weapon module.
	beam: function(station, level) {
		var cost = 100;
		var damage = 10.5;
		var length = 1000;
		var target = null;
		var angle = null;
		var angleTarget = null;
		var buffer = 0.1;
		return {
			type: "beam",
			level: level,
			update: function() {
				target = EnemyShip.furthest(station, length);
				if (!target) return;
				angleTarget = getAngle(station, target);
				if (angle == null) angle = angleTarget;
				angle += Math.sign(getAngleDifference(angleTarget, angle)) * 0.01;
				var n = EnemyShip.allInstances.length;
				while (n--) {
					var inst = EnemyShip.allInstances[n];
					var instAngle = getAngle(station, inst);
					var distance = getDistance(inst, station);
					var difference = getAngleDifference(angle, instAngle)
					if (distance < length && Math.abs(difference) < buffer) {
						inst.hp -= damage;
					}
				}
			},
			render: function() {
				if (!target) return;
				ctx.beginPath();
				//ctx.strokeStyle = "#FF0";
				ctx.lineWidth = 6 + Math.sin(performance.now()/5) * 3;

				var grd=ctx.createRadialGradient(station.x, station.y / View.tilt,100,station.x, station.y / View.tilt,1000);
				grd.addColorStop(0,"#FF0");
				grd.addColorStop(1,"rgba(0, 0, 0, 0)");
				ctx.strokeStyle = grd;

				ctx.moveTo(station.x, station.y / View.tilt);
				var x = station.x - length * Math.cos(angle);
				var y = station.y - length * Math.sin(angle);
				ctx.lineTo(x, y / View.tilt);
				ctx.stroke();
			}
		}
	},

	// Laser weapon module.
	laser: function(station, level) {
		var range = 1000;
		var shootTimer = 0;
		var shootCost = 0.1;
		return {
			type: "laser",
			level: level,
			update: function() {
				if (shootTimer-- <= 0) {
					shootTimer = 2;
					var target = EnemyShip.nearest(station, range);
					if (target && base.energy >= shootCost) {
						base.energy -= shootCost;
						var miss = Math.random() > 0.5;
						var life = miss ? 2000 : getDistance(station, target);
						var dir = getAngle(station, target);
						Laser.create(station.x, station.y, dir, life, "#FF0");
						if (!miss) {
							target.hp -= 2;
						}
					}
				}
			},
			render: function() {}
		}
	}

}
