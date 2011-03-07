
function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3.create(0.0, 0.0, 0.0);
	this.texture = texture;

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
		var oldpos = vec3.create(this.pos);
		var dx = Math.random() * 2.0 - 1.0;
		var dy = Math.random() * 2.0 - 1.0;
		this.pos = vec3.create([oldpos[0]+dx, oldpos[1]+dy, oldpos[2]]);
		if (world.map.isWall(this.pos)) this.pos = oldpos;
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
