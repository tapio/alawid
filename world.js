
function DungeonMap(w, h) {
	this.levelData = [];

	this.placeRandomly = function(what, howmany, nextToWall) {
		while (howmany > 0) {
			var i = Math.floor(Math.random() * (this.width()-2)) + 1;
			var j = Math.floor(Math.random() * (this.height()-2)) + 1;
			if (this.levelData[j][i] == " ") {
				if (!nextToWall
					|| this.levelData[j-1][i] == "#" || this.levelData[j+1][i] == "#"
					|| this.levelData[j][i-1] == "#" || this.levelData[j][i+1] == "#")
				{
					this.levelData[j][i] = what;
					--howmany;
				}
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
		this.placeRandomly("*", rooms/3, true);
	}

	this.width = function() { return this.levelData[0].length; }
	this.height = function() { return this.levelData.length / this.levelData[0].length; }

	this.generate(w, h);

	this.getBlock = function(pos) {
		var x = Math.round(pos[0]), y = Math.round(pos[1]);
		if (x < 0 || y < 0 || x >= this.width() || y >= this.height())
			return " ";
		return this.levelData[y][x];
	}

	this.isWall = function(pos) {
		const margin = 0.3;
		var xx = [pos[0] - margin, pos[0] + margin, pos[0] - margin, pos[0] + margin];
		var yy = [pos[1] - margin, pos[1] - margin, pos[1] + margin, pos[1] + margin];
		for (var i = 0; i < xx.length; ++i) {
			var x = Math.round(xx[i]), y = Math.round(yy[i]);
			if (x < 0 || y < 0 || x >= this.width() || y >= this.height())
				return true;
			var c = this.levelData[y][x];
			if (c != " " && c != "*") return true;
		}
		return false;
	}

}


function World() {
	const s = 35.0;
	const wallMargin = 0.2;
	const halfGrid = 0.5;
	// Create floor
	var floorvertices = [
		-0.5, -0.5, 0.0,
		s-.5, -0.5, 0.0,
		s-.5, s-.5, 0.0,
		-0.5, s-.5, 0.0
		];
	var floortexcoords = [
		0.0, 0.0,
		s, 0.0,
		s, s,
		0.0, s,
		];
	var floorindices = [
		0, 1, 2,    0, 2, 3
		];
	this.floorBuffer = new VertexBuffer(floorvertices, floortexcoords, floorindices);

	this.createWallFace = function(p0, p1, n) {
		const slices = 3;
		var va = [], ta = [], ia = [];
		var r0 = 0.0;
		for (var i = 0; i < slices; ++i) {
			var f0 = i / slices, f1 = (i+1) / slices;
			var q0 = [(p1[0]-p0[0])*f0+p0[0], (p1[1]-p0[1])*f0+p0[1]];
			var q1 = [(p1[0]-p0[0])*f1+p0[0], (p1[1]-p0[1])*f1+p0[1]];
			var r1 = (i == slices-1) ? 0.0 : Math.random();
			va = [
				q0[0]+r0*n[0], q0[1]+r0*n[1], 0.0,
				q0[0]+r0*n[0], q0[1]+r0*n[1], this.wallHeight,
				q1[0]+r1*n[0], q1[1]+r1*n[1], this.wallHeight,
				q1[0]+r1*n[0], q1[1]+r1*n[1], 0.0,
				];
			ta = [
				0.0, f0,
				this.wallHeight, f0,
				this.wallHeight, f1,
				0.0, f1,
			];
			r0 = r1;
			var k = this.vertices.length / 3;
			ia = [ 0+k, 1+k, 2+k,    0+k, 2+k, 3+k ];
			this.vertices = this.vertices.concat(va);
			this.texcoords = this.texcoords.concat(ta);
			this.indices = this.indices.concat(ia);
		}
	}

	this.createWallBuffer = function(data) {
		this.wallHeight = Math.abs(cameraHeight) + 1.0;
		this.vertices = []; this.texcoords = []; this.indices = [];
		for (var j = 0; j < data.length; ++j) {
			var row = data[j];
			for (var i = 0; i < row.length; ++i) {
				var c = row[i];
				if (c == "*") {
					lights.push(new PointLight([i, j, Math.random((this.wallHeight-1) * 0.9) + 1]));
				} else if (c == '#') {
					// Corner points
					var north = false, south = false, west = false, east = false;
					var nw = [-halfGrid, -halfGrid], ne = [ halfGrid, -halfGrid];
					var sw = [-halfGrid,  halfGrid], se = [ halfGrid,  halfGrid];
					// Adjust corner according to neighbouring walls
					if (this.map.getBlock([i-1, j]) != "#") {
						nw[0] += wallMargin;
						sw[0] += wallMargin;
						west = true;
					}
					if (this.map.getBlock([i+1, j]) != "#") {
						ne[0] -= wallMargin;
						se[0] -= wallMargin;
						east = true;
					}
					if (this.map.getBlock([i, j-1]) != "#") {
						ne[1] += wallMargin;
						nw[1] += wallMargin;
						north = true;
					}
					if (this.map.getBlock([i, j+1]) != "#") {
						se[1] -= wallMargin;
						sw[1] -= wallMargin;
						south = true;
					}
					// Position in grid
					nw = [nw[0]+i, nw[1]+j]; ne = [ne[0]+i, ne[1]+j];
					sw = [sw[0]+i, sw[1]+j]; se = [se[0]+i, se[1]+j];
					// Create the faces
					if (north) this.createWallFace(ne, nw, [0.0, -wallMargin]); // North wall
					if (east ) this.createWallFace(se, ne, [wallMargin, 0.0]); // East wall
					if (south) this.createWallFace(sw, se, [0.0, wallMargin]); // South wall
					if (west ) this.createWallFace(nw, sw, [-wallMargin, 0.0]); // West wall
				}
			}
		}
		this.wallBuffer = new VertexBuffer(this.vertices, this.texcoords, this.indices);
		this.vertices = []; this.texcoords = []; this.indices = [];
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
