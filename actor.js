
function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3.create(0.0, 0.0, 0.0);
	this.texture = texture;
	this.target = this.pos;
	this.moving = false;

	// Create sprite
	var vertices = [
		-0.5,-0.5, 0.0,
		+0.5,-0.5, 0.0,
		+0.5,+0.5, 0.0,
		-0.5,+0.5, 0.0
		];
	var texcoords = [
		0.0, 1.0,
		1.0, 1.0,
		1.0, 0.0,
		0.0, 0.0,
		];
	var indices = [
		0, 1, 2,    0, 2, 3
		];
	this.buffer = new VertexBuffer(vertices, texcoords, indices);

	this.ai = function() {
		if (this.moving) return;
		var dx = rand(-1, 1);
		var dy = rand(-1, 1);
		var target = vec3.create([this.pos[0]+dx, this.pos[1]+dy, this.pos[2]]);
		if (!world.map.isWall(target)) this.move(target);
	}

	this.move = function(target) {
		this.target = vec3.create(target);
		this.moving = true;
	}

	this.updateMoving = function() {
		vec3.lerp(this.pos, this.target, 0.2);
		if (Math.abs(this.pos[0]-this.target[0]) + Math.abs(this.pos[1]-this.target[1]) < 0.1) {
			this.moving = false;
			this.pos = roundvec(this.pos);
		}
	}

	this.draw = function() {
		mvPushMatrix();
		this.pos[2] = 0.1;
		mat4.translate(mvMatrix, this.pos);
		gl.uniform1f(curProg.materialShininessUniform, NO_SPECULAR);
		useTexture(this.texture);
		this.buffer.draw();
		mvPopMatrix();
	}
}
