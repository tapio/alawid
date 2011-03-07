
function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3(0, 0, 0);
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

	this.draw = function() {
		mvPushMatrix();
		mat4.translate(mvMatrix, this.pos);
		gl.disable(gl.DEPTH_TEST);
		gl.uniform1f(curProg.materialShininessUniform, NO_SPECULAR);
		useTexture(this.texture);
		this.buffer.draw();
		gl.enable(gl.DEPTH_TEST);
		mvPopMatrix();
	}
}
