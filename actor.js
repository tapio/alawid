
function Actor(type, pos, texture) {
	this.type = type;
	this.pos = pos || vec3(0, 0, 0);
	this.texture = texture;

	// Create sprite
	var vertices = [
		-1.0, 0.0, -1.0,
		 1.0, 0.0,  1.0,
		 1.0, 0.0,  1.0,
		-1.0, 0.0, -1.0
		];
	var texcoords = [
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		];
	var normals = [
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0
		];
	var indices = [
		0, 1, 2,    0, 2, 3
		];
	this.buffer = new VertexBuffer(vertices, texcoords, normals, indices);

	this.draw = function() {
		mvPushMatrix();
		mat4.translate(mvMatrix, this.pos);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(curProg.samplerUniform, 0);
		this.buffer.draw();
		mvPopMatrix();
	}
}
