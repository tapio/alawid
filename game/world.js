
/**
 * @brief Generates and manages a 2d ASCII map.
 */
function DungeonMap(w, h) {
	this.levelData = [];

	this.placeRandomly = function(what, howmany, nextToWall) {
		while (howmany > 0) {
			var i = rand(1, this.width()-2);
			var j = rand(1, this.height()-2);
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

	this.findEmpty = function() {
		while (true) {
			x = rand(1, this.width()-2);
			y = rand(1, this.height()-2);
			if (this.levelData[y][x] != "#" && this.levelData[y][x] != "+")
				return vec3.create([x, y, 0.0]);
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
				this.levelData[j][x] = " ";
		}

		// Some lights
		this.placeRandomly("*", rooms/3, true);
		// Some doors
		for (var i = 0; i < rooms;) {
			var pos = this.findEmpty();
			if ((this.isWall([pos[0]-1, pos[1]]) && this.isWall([pos[0]+1, pos[1]]))
				|| (this.isWall([pos[0], pos[1]-1]) && this.isWall([pos[0], pos[1]+1])))
			{
				this.levelData[pos[1]][pos[0]] = "+";
				++i;
			}
		}
		// Pick exit
		while (true) {
			var i = rand(1, this.width()-2);
			var j = rand(1, this.height()-2);
			if (this.levelData[j][i] == "#") {
				var wallCount = 0;
				if (this.levelData[j-1][i] == "#") ++wallCount;
				if (this.levelData[j+1][i] == "#") ++wallCount;
				if (this.levelData[j][i-1] == "#") ++wallCount;
				if (this.levelData[j][i+1] == "#") ++wallCount;
				if (wallCount == 3) {
					this.levelData[j][i] = "X";
					break;
				}
			}
		}
	}

	this.width = function() { return this.levelData[0].length; }
	this.height = function() { return this.levelData.length / this.levelData[0].length; }

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
			if (c == "#") return true;
		}
		return false;
	}

	this.toString = function() {
		var str = "";
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				str += this.levelData[j][i];
			}
			str += "\n";
		}
		return str;
	}

	this.generate(w, h);
	//console.log(this.toString());

}


/**
 * @brief Contains the world map and mesh.
 *
 * This class generates a 3d mesh for a 2d map and draws it.
 */
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

	this.createWallFace = function(p0, p1, n, doorway) {
		const slices = 3;
		var doorHeight = doorway ? 1.0 : 0.0;
		var va = [], ta = [], ia = [];
		var r0 = 0.0;
		for (var i = 0; i < slices; ++i) {
			var f0 = i / slices, f1 = (i+1) / slices;
			var q0 = [(p1[0]-p0[0])*f0+p0[0], (p1[1]-p0[1])*f0+p0[1]];
			var q1 = [(p1[0]-p0[0])*f1+p0[0], (p1[1]-p0[1])*f1+p0[1]];
			var r1 = (i == slices-1) ? 0.0 : Math.random();
			va = [
				q0[0]+r0*n[0], q0[1]+r0*n[1], doorHeight,
				q0[0]+r0*n[0], q0[1]+r0*n[1], this.wallHeight,
				q1[0]+r1*n[0], q1[1]+r1*n[1], this.wallHeight,
				q1[0]+r1*n[0], q1[1]+r1*n[1], doorHeight,
				];
			ta = [
				0.0, f0,
				this.wallHeight-doorHeight, f0,
				this.wallHeight-doorHeight, f1,
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
		this.wallHeight = Math.abs(cameraMaxHeight) + 1.0;
		this.vertices = []; this.texcoords = []; this.indices = [];
		for (var j = 0; j < data.length; ++j) {
			var row = data[j];
			for (var i = 0; i < row.length; ++i) {
				var c = row[i];
				if (c == '*') {
					lights.push(new PointLight([i, j, Math.random((this.wallHeight-1) * 0.9) + 1]));
				} else if (c == 'X') {
					c = '+';
					lights.push(new PointLight([i, j, 0.7], [0, 0, 0.9]));
				}
				if (c == '#' || c == '+') {
					var marg = (c == '+' ? wallMargin * 2.0 : wallMargin);
					// Corner points
					var north = false, south = false, west = false, east = false;
					var nw = [-halfGrid, -halfGrid], ne = [ halfGrid, -halfGrid];
					var sw = [-halfGrid,  halfGrid], se = [ halfGrid,  halfGrid];
					// Adjust corners according to neighbouring walls
					if (this.map.getBlock([i-1, j]) == "+") west = true;
					else if (this.map.getBlock([i-1, j]) != "#") {
						nw[0] += marg;
						sw[0] += marg;
						west = true;
					}
					if (this.map.getBlock([i+1, j]) == "+") east = true;
					else if (this.map.getBlock([i+1, j]) != "#") {
						ne[0] -= marg;
						se[0] -= marg;
						east = true;
					}
					if (this.map.getBlock([i, j-1]) == "+") north = true;
					else if (this.map.getBlock([i, j-1]) != "#") {
						ne[1] += marg;
						nw[1] += marg;
						north = true;
					}
					if (this.map.getBlock([i, j+1]) == "+") south = true;
					else if (this.map.getBlock([i, j+1]) != "#") {
						se[1] -= marg;
						sw[1] -= marg;
						south = true;
					}
					// Fill corners
					if (this.map.getBlock([i-1, j-1]) != "#") { west = true; north = true; }
					if (this.map.getBlock([i+1, j-1]) != "#") { east = true; north = true; }
					if (this.map.getBlock([i-1, j+1]) != "#") { west = true; south = true; }
					if (this.map.getBlock([i+1, j+1]) != "#") { east = true; south = true; }
					// Position in grid
					nw = [nw[0]+i, nw[1]+j]; ne = [ne[0]+i, ne[1]+j];
					sw = [sw[0]+i, sw[1]+j]; se = [se[0]+i, se[1]+j];
					// Create the faces
					if (north) this.createWallFace(ne, nw, [0.0, -wallMargin], c == '+'); // North wall
					if (east ) this.createWallFace(se, ne, [wallMargin, 0.0], c == '+'); // East wall
					if (south) this.createWallFace(sw, se, [0.0, wallMargin], c == '+'); // South wall
					if (west ) this.createWallFace(nw, sw, [-wallMargin, 0.0], c == '+'); // West wall
				}
			}
		}
		this.wallBuffer = new VertexBuffer(this.vertices, this.texcoords, this.indices);
		console.log("Vertices: ~" + this.vertices.length / 3);
		console.log("Triangles: ~" + this.indices.length / 3);
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
