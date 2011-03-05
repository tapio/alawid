
function World() {

	// Create floor
	{
		const s = 10.0;
		var vertices = [
			-0.5, -0.5, 0.0,
			s-.5, -0.5, 0.0,
			s-.5, s-.5, 0.0,
			-0.5, s-.5, 0.0
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
	}
	this.floorBuffer = new VertexBuffer(vertices, texcoords, normals, indices);


	this.createWallBuffer = function(data) {
		var vertices = [], texcoords = [], normals = [], indices = [];
		for (var j = 0; j < data.length; ++j) {
			var row = data[j];
			for (var i = 0; i < row.length; ++i) {
				var c = row[i];
				if (c == "*") {
					lights.push(new PointLight([i, j, 1.0]));
				} else if (c == '#') {
					var cubeVertices = [
						// Front face
						-0.5+i, -0.5+j, 1.5,
						 0.5+i, -0.5+j, 1.5,
						 0.5+i,  0.5+j, 1.5,
						-0.5+i,  0.5+j, 1.5,
						// Back face
						-0.5+i, -0.5+j, 0.0,
						-0.5+i,  0.5+j, 0.0,
						 0.5+i,  0.5+j, 0.0,
						 0.5+i, -0.5+j, 0.0,
						// Top face
						-0.5+i,  0.5+j, 0.0,
						-0.5+i,  0.5+j, 1.5,
						 0.5+i,  0.5+j, 1.5,
						 0.5+i,  0.5+j, 0.0,
						// Bottom face
						-0.5+i, -0.5+j, 0.0,
						 0.5+i, -0.5+j, 0.0,
						 0.5+i, -0.5+j, 1.5,
						-0.5+i, -0.5+j, 1.5,
						// Right face
						 0.5+i, -0.5+j, 0.0,
						 0.5+i,  0.5+j, 0.0,
						 0.5+i,  0.5+j, 1.5,
						 0.5+i, -0.5+j, 1.5,
						// Left face
						-0.5+i, -0.5+j, 0.0,
						-0.5+i, -0.5+j, 1.5,
						-0.5+i,  0.5+j, 1.5,
						-0.5+i,  0.5+j, 0.0,
					];
					var cubeNormals = [
						// Front face
						 0.0,  0.0,  1.0,
						 0.0,  0.0,  1.0,
						 0.0,  0.0,  1.0,
						 0.0,  0.0,  1.0,
						// Back face
						 0.0,  0.0, -1.0,
						 0.0,  0.0, -1.0,
						 0.0,  0.0, -1.0,
						 0.0,  0.0, -1.0,
						// Top face
						 0.0,  1.0,  0.0,
						 0.0,  1.0,  0.0,
						 0.0,  1.0,  0.0,
						 0.0,  1.0,  0.0,
						// Bottom face
						 0.0, -1.0,  0.0,
						 0.0, -1.0,  0.0,
						 0.0, -1.0,  0.0,
						 0.0, -1.0,  0.0,
						// Right face
						 1.0,  0.0,  0.0,
						 1.0,  0.0,  0.0,
						 1.0,  0.0,  0.0,
						 1.0,  0.0,  0.0,
						// Left face
						-1.0,  0.0,  0.0,
						-1.0,  0.0,  0.0,
						-1.0,  0.0,  0.0,
						-1.0,  0.0,  0.0,
					];
					var cubeTexcoords = [
						// Front face
						0.0, 0.0,
						1.0, 0.0,
						1.0, 1.0,
						0.0, 1.0,
						// Back face
						1.0, 0.0,
						1.0, 1.0,
						0.0, 1.0,
						0.0, 0.0,
						// Top face
						0.0, 1.0,
						0.0, 0.0,
						1.0, 0.0,
						1.0, 1.0,
						// Bottom face
						1.0, 1.0,
						0.0, 1.0,
						0.0, 0.0,
						1.0, 0.0,
						// Right face
						1.0, 0.0,
						1.0, 1.0,
						0.0, 1.0,
						0.0, 0.0,
						// Left face
						0.0, 0.0,
						1.0, 0.0,
						1.0, 1.0,
						0.0, 1.0,
					];
					var k = vertices.length / 3; // Offset
					var cubeIndices = [
						0+k, 1+k, 2+k,      0+k, 2+k, 3+k,    // Front face
						4+k, 5+k, 6+k,      4+k, 6+k, 7+k,    // Back face
						8+k, 9+k, 10+k,     8+k, 10+k, 11+k,  // Top face
						12+k, 13+k, 14+k,   12+k, 14+k, 15+k, // Bottom face
						16+k, 17+k, 18+k,   16+k, 18+k, 19+k, // Right face
						20+k, 21+k, 22+k,   20+k, 22+k, 23+k  // Left face
					];
					vertices = vertices.concat(cubeVertices);
					texcoords = texcoords.concat(cubeTexcoords);
					normals = normals.concat(cubeNormals);
					indices = indices.concat(cubeIndices);
				}
			}
		}
		this.wallBuffer = new VertexBuffer(vertices, texcoords, normals, indices);
	}

	this.setLevel = function(data) {
		this.levelData = data;
		this.createWallBuffer(data);
	}

	this.setLevel([
		"##########",
		"# #      #",
		"#  ##  * #",
		"#     #  #",
		"#  #     #",
		"#   # #  #",
		"# #      #",
		"#   #  # #",
		"#  #    *#",
		"##########"
		]);

	this.isWall = function(pos) {
		const margin = 0.3;
		var xx = [pos[0] - margin, pos[0] + margin, pos[0] - margin, pos[0] + margin];
		var yy = [pos[1] - margin, pos[1] - margin, pos[1] + margin, pos[1] + margin];
		for (var i = 0; i < xx.length; ++i) {
			var x = Math.round(xx[i]), y = Math.round(yy[i]);
			if (x < 0 || y < 0 || x >= this.levelData[0].length || y >= this.levelData.length)
				return true;
			var c = this.levelData[y][x];
			if (c != " " && c != "*") return true;
		}
		return false;
	}

	this.draw = function() {
		gl.activeTexture(gl.TEXTURE0);
		gl.uniform1i(curProg.samplerUniform, 0);
		// Floor
		gl.uniform1f(curProg.materialShininessUniform, 10000.0);
		gl.bindTexture(gl.TEXTURE_2D, textures["floor"]);
		this.floorBuffer.draw();
		// Walls
		gl.uniform1f(curProg.materialShininessUniform, 32.0);
		gl.bindTexture(gl.TEXTURE_2D, textures["wall"]);
		this.wallBuffer.draw();
	}
}
