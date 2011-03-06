
function DungeonMap(w, h) {
	this.levelData = [];

	this.placeRandomly = function(what, howmany) {
		while (howmany > 0) {
			var i = Math.floor(Math.random() * this.levelData[0].length);
			var j = Math.floor(Math.random() * this.levelData.length / this.levelData[0].length);
			if (this.levelData[j][i] == " ") {
				this.levelData[j][i] = what;
				--howmany;
			}
		}
	}

	this.generate = function(w, h) {
		// Borders and floor
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				this.levelData.push([]);
				//if (i == 0 || j == 0 || i == w-1 || j == h-1)
					this.levelData[j].push("#");
				//else this.levelData[j].push(" ");
			}
		}

		var roomsize = rand(3,4);
		var rooms = Math.floor(w * h / (roomsize * roomsize * 4)); //rand(10, Math.max(3, Math.floor(Math.pow((w*h),0.4))));
		var x, y, ox, oy;

		// Pick a starting position
		while (true) {
			x = rand(roomsize+1, w-roomsize-1);
			y = rand(roomsize+1, h-roomsize-1);
			if (this.levelData[y][x] == "#") break;
		}
		this.startx = x; this.starty = y;

		// Create rooms
		for (var room = 0; room < rooms; ++room) {
			var rw = rand(2, roomsize);
			var rh = rand(2, roomsize);
			var xx = x - rand(0, rw-1);
			var yy = y - rand(0, rh-1);

			// Floor for the room
			for (var j = yy; j < yy + rh; ++j) {
				for (var i = xx; i < xx + rw; ++i) {
					this.levelData[j][i] = " ";
				}
			}
			ox = x; oy = y;

			// Don't create a dead end corridor
			if (room == rooms-1) break;

			// Pick new room location
			while (true) {
				x = rand(roomsize+1, w-roomsize-1);
				y = rand(roomsize+1, h-roomsize-1);
				if (this.levelData[y][x] == "#" && Math.abs(ox-x) + Math.abs(oy-y) < 30)
					break;
			}
			// Do corridors
			var swapx = x < ox;
			for (var i = swapx ? x : ox; i < (swapx ? ox : x); ++i)
				this.levelData[oy][i] = " ";
			var swapy = y < oy;
			for (var j = swapy ? y : oy; j < (swapy ? oy : y); ++j)
				this.levelData[x][j] = " ";
		}

		// Some lights
		this.placeRandomly("*", rooms);
	}

	this.generate(w, h);

	this.getBlock = function(pos) {
		var x = Math.round(pos[0]), y = Math.round(pos[1]);
		if (x < 0 || y < 0 || x >= this.levelData[0].length || y >= this.levelData.length)
			return " ";
		return this.levelData[y][x];
	}

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

}


function World() {
	const s = 35.0;
	// Create floor
	{
		var vertices = [
			-0.5, -0.5, 0.0,
			s-.5, -0.5, 0.0,
			s-.5, s-.5, 0.0,
			-0.5, s-.5, 0.0
			];
		var normals = [
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0,
			0.0, 0.0, 1.0
			];
		var texcoords = [
			0.0, 0.0,
			s, 0.0,
			s, s,
			0.0, s,
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
					lights.push(new PointLight([i, j, Math.random(h * 0.5) + 1]));
				} else if (c == '#') {
					const h = 10.0;
					var cubeVertices = [
						// Front face
						-0.5+i, -0.5+j, h,
						 0.5+i, -0.5+j, h,
						 0.5+i,  0.5+j, h,
						-0.5+i,  0.5+j, h,
						// Back face
						-0.5+i, -0.5+j, 0.0,
						-0.5+i,  0.5+j, 0.0,
						 0.5+i,  0.5+j, 0.0,
						 0.5+i, -0.5+j, 0.0,
						// Top face
						-0.5+i,  0.5+j, 0.0,
						-0.5+i,  0.5+j, h,
						 0.5+i,  0.5+j, h,
						 0.5+i,  0.5+j, 0.0,
						// Bottom face
						-0.5+i, -0.5+j, 0.0,
						 0.5+i, -0.5+j, 0.0,
						 0.5+i, -0.5+j, h,
						-0.5+i, -0.5+j, h,
						// Right face
						 0.5+i, -0.5+j, 0.0,
						 0.5+i,  0.5+j, 0.0,
						 0.5+i,  0.5+j, h,
						 0.5+i, -0.5+j, h,
						// Left face
						-0.5+i, -0.5+j, 0.0,
						-0.5+i, -0.5+j, h,
						-0.5+i,  0.5+j, h,
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
						0.0, h,
						0.0, 0.0,
						1.0, 0.0,
						1.0, h,
						// Bottom face
						1.0, h,
						0.0, h,
						0.0, 0.0,
						1.0, 0.0,
						// Right face
						h, 0.0,
						h, 1.0,
						0.0, 1.0,
						0.0, 0.0,
						// Left face
						0.0, 0.0,
						h, 0.0,
						h, 1.0,
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

	this.map = new DungeonMap(s, s);
	this.createWallBuffer(this.map.levelData);

	this.draw = function() {
		// Floor
		gl.uniform1f(curProg.materialShininessUniform, NO_SPECULAR);
		useTexture("floor");
		this.floorBuffer.draw();
		// Walls
		gl.uniform1f(curProg.materialShininessUniform, 32.0);
		useTexture("wall");
		this.wallBuffer.draw();
	}
}
