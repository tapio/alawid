
const SQUARE_VERTICES = [
	-0.5,-0.5, 0.0,
	+0.5,-0.5, 0.0,
	+0.5,+0.5, 0.0,
	-0.5,+0.5, 0.0
	];
const SQUARE_TEXCOORDS = [
	0.0, 1.0,
	1.0, 1.0,
	1.0, 0.0,
	0.0, 0.0,
	];
const SQUARE_INDICES = [
	0, 1, 2,    0, 2, 3
	];

function Weapon(name, damage) {
	this.name = name;
	this.dmgCnt = damage[0];
	this.dmgLo = damage[1];
	this.dmgHi = damage[2];

	this.damage = function() {
		var dmg = 0;
		for (var i = 0; i < this.dmgCnt; ++i)
			dmg += rand(this.dmgLo, this.dmgHi);
		return dmg;
	}
}

const torchMaxTime = 40;

function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3.create(0.0, 0.0, 0.0);
	this.texture = texture || type;
	this.target = this.pos;
	this.moving = false;
	this.condition = 100.0;
	if (type == "player") {
		this.rightHand = new Weapon("sword", [2, 1, 6]);
		this.leftHand = "torch";
		this.torch = torchMaxTime;
		this.torches = 3;
		this.potions = 1;
	} else if (type == "rat") {
		this.rightHand = new Weapon("teeth", [1, 1, 4]);
		this.condition = 40;
	} else if (type == "kobold") {
		this.rightHand = new Weapon("spear", [1, 1, 6]);
		this.condition = 55;
	} else if (type == "goblin") {
		this.condition = 70;
		this.rightHand = new Weapon("crude sword", [2, 1, 4]);
	} else if (type == "dragon") {
		this.condition = 200;
		this.rightHand = new Weapon("fire breath", [3, 4, 7]);
	}

	this.buffer = new VertexBuffer(SQUARE_VERTICES, SQUARE_TEXCOORDS, SQUARE_INDICES);

	this.dead = function() { return this.condition <= 0; }

	this.distance = function(targetpos) {
		var dx = targetpos[0] - this.pos[0];
		var dy = targetpos[1] - this.pos[1];
		return Math.sqrt(dx*dx+dy*dy);
	}

	this.ai = function() {
		if (this.dead() || this.moving) return;
		var dx = Math.round(player.target[0]) - Math.round(this.pos[0]);
		var dy = Math.round(player.target[1]) - Math.round(this.pos[1]);
		var seeDist = (this.type == "dragon" ? 7 : 3);
		if (player.leftHand == "torch") ++seeDist;
		if (Math.max(Math.abs(dx), Math.abs(dy)) < seeDist) {
			if (this.type == "rat" && player.leftHand == "torch"
				&& Math.max(Math.abs(dx), Math.abs(dy)) == 2)
			{
				// Rats are afraid of light
				dx = -sign(dx);
				dy = -sign(dy);
			} else {
				// Attack player
				dx = sign(dx);
				dy = sign(dy);
			}
		} else {
			// Wander aimlessly
			dx = rand(-1, 1);
			dy = rand(-1, 1);
		}
		this.move([this.pos[0]+dx, this.pos[1]+dy, this.pos[2]]);
	}

	this.attack = function(opponent) {
		var dmg = this.rightHand.damage();
		opponent.condition -= dmg;
		splatters.push(new Actor("splatter", opponent.pos));
		splatters[splatters.length-1].condition = new Date().getTime();
		if (this.type == "player")
			addMessage("You hit "+opponent.type+" by "+dmg+"!");
		else if (opponent.type == "player")
			addMessage("Enemy "+this.type+" hits you by "+dmg+"!");
	}

	this.move = function(target) {
		if (this.dead()) return;
		// Check wall collision
		if (world.map.isWall(target))
			return false;
		// NOTE: Collisions are checked against Actor.target,
		// because that is the "real" position disregarding animation.

		// Check monster's collision to player
		if (this.type != "player") {
			// Attack
			if (matchPos(player.target, target)) {
				this.attack(player);
				return true;
			}
		}
		// Collisions to monsters
		for (var i = 0; i < monsters.length; ++i) {
			if (this != monsters[i] && !monsters[i].dead()) {
				if (matchPos(monsters[i].target, target)) {
					if (this.type == "player") // Attack
						this.attack(monsters[i])
					return true;
				}
			}
		}
		// Collision to items
		if (this.type == "player") {
			for (var i = 0; i < items.length; ++i) {
				if (!items[i].dead() && matchPos(items[i].pos, target)) {
					if (items[i].type == "torch") {
						++this.torches;
						if (player.leftHand != "torch") player.torch = torchMaxTime;
						items[i].condition = 0;
						addMessage("You picked up "+items[i].type+".");
					} else if (items[i].type == "health potion") {
						++this.potions;
						items[i].condition = 0;
						addMessage("You picked up "+items[i].type+".");
					}

				}
			}
		}
		// Move
		this.target = vec3.create(target);
		this.moving = true;
		return true;
	}

	this.updateMoving = function() {
		if (this.dead()) return;
		// Check for exit
		if (this.type == "player") {
			if (world.map.levelData[Math.round(this.pos[1])][Math.round(this.pos[0])] == 'X') {
				nextLevel();
				return;
			}
		}
		vec3.lerp(this.pos, this.target, 0.2);
		if (Math.abs(this.pos[0]-this.target[0]) + Math.abs(this.pos[1]-this.target[1]) < 0.01) {
			this.moving = false;
			this.pos = roundvec(this.pos);
		}
	}

	this.draw = function() {
		if (this.dead()) return;
		mvPushMatrix();
		this.pos[2] = 0.1;
		mat4.translate(mvMatrix, this.pos);
		gl.uniform1f(curProg.materialShininessUniform, 8.0);
		useTexture(this.texture);
		this.buffer.draw();
		mvPopMatrix();
	}
}
