
function World() {

	// Create floor
	const s = 100.0;
	var vertices = [
		-s,-s, 0.0,
		+s,-s, 0.0,
		+s,+s, 0.0,
		-s,+s, 0.0
		];
	var texcoords = [
		0.0, 0.0,
		s, 0.0,
		s, s,
		0.0, s,
		];
	var normals = [
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0
		];
	var indices = [
		0, 1, 2,    0, 2, 3
		];
	this.floorBuffer = new VertexBuffer(vertices, texcoords, normals, indices);

	this.draw = function() {
		mvPushMatrix();
		//mat4.identity(mvMatrix);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures["floor"]);
		gl.uniform1i(curProg.samplerUniform, 0);
		this.floorBuffer.draw();
		mvPopMatrix();
	}
}
