
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

const torchMaxTime = 60;

function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3.create(0.0, 0.0, 0.0);
	this.texture = texture;
	this.target = this.pos;
	this.moving = false;
	this.condition = 100.0;
	if (type == "player") {
		this.rightHand = new Weapon("sword", [2, 1, 6]);
		this.leftHand = "torch";
		this.torch = torchMaxTime;
		this.torches = 3;
	} else if (type == "rat") {
		this.rightHand = new Weapon("teeth", [1, 1, 6]);
	} else if (type == "goblin") {
		this.rightHand = new Weapon("sword", [2, 1, 6]);
	}

	this.buffer = new VertexBuffer(SQUARE_VERTICES, SQUARE_TEXCOORDS, SQUARE_INDICES);

	this.dead = function() { return this.condition <= 0; }

	this.ai = function() {
		if (this.dead() || this.moving) return;
		var dx = rand(-1, 1);
		var dy = rand(-1, 1);
		var target = vec3.create([this.pos[0]+dx, this.pos[1]+dy, this.pos[2]]);
		this.move(target);
	}

	this.move = function(target) {
		if (this.dead()) return;
		// Check wall collision
		if (world.map.isWall(target))
			return false;
		// Check monster's collision to player
		if (this.type != "player") {
			// Attack
			if (matchPos(player.pos, target)) {
				player.condition -= this.rightHand.damage();
				return true;
			}
		}
		// Collisions to monsters
		for (var i = 0; i < monsters.length; ++i) {
			if (this != monsters[i] && !monsters[i].dead()) {
				if (matchPos(monsters[i].pos, target)) {
					if (this.type == "player") {
						// Attack
						monsters[i].condition -= this.rightHand.damage();
					}
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
						items[i].condition = 0;
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
