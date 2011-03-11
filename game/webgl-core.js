// GL Initialization

var gl;

function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) { }
	if (!gl) alert("Could not initialise WebGL :-(\nPerhaps your browser is too old or incompatible. You might also have poor graphics card.");
}


// File loading

function loadFile(url, errorCallback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, false);
	request.send(null);
	if (request.status == 200) { // If we got HTTP status 200 (OK)
		 return request.responseText;
	} else { // Failed
		alert('Failed to download "' + url + '"');
	}
}


// Shader loading

function createShader(gl, source, type) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert((type == gl.VERTEX_SHADER ? "Vertex" : "Fragment")
			+ " shader compilation failed!\n" + gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function createProgram(vertexShaderFile, fragmentShaderFile, defines) {
	if (!defines) defines = "";
	var vertexShader = createShader(gl, defines+"\n"+loadFile('shaders/'+vertexShaderFile), gl.VERTEX_SHADER);
	var fragmentShader = createShader(gl, defines+"\n"+loadFile('shaders/'+fragmentShaderFile), gl.FRAGMENT_SHADER);
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
		alert("Could not initialize shaders!\n" + gl.getProgramInfoLog(program));

	program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
	gl.enableVertexAttribArray(program.vertexPositionAttribute);
	program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");
	gl.enableVertexAttribArray(program.vertexNormalAttribute);
	program.vertexTangentAttribute = gl.getAttribLocation(program, "aVertexTangent");
	gl.enableVertexAttribArray(program.vertexTangentAttribute);
	program.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
	gl.enableVertexAttribArray(program.textureCoordAttribute);

	program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	program.nMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
	program.textureSamplerUniform = gl.getUniformLocation(program, "uTextureSampler");
	program.normalMapSamplerUniform = gl.getUniformLocation(program, "uNormalMapSampler");
	program.materialShininessUniform = gl.getUniformLocation(program, "uMaterialShininess");
	program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
	program.specialLightIndexUniform = gl.getUniformLocation(program, "uSpecialLightIndex");
	program.lightCountUniform = gl.getUniformLocation(program, "uLightCount");
	program.lightPositionUniform = gl.getUniformLocation(program, "uLightPositions");
	program.lightAttenuationUniform = gl.getUniformLocation(program, "uLightAttenuations");
	return program;
}


// Texture handling

function handleLoadedTexture(texture) {
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

function loadTexture(file) {
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function () {
		handleLoadedTexture(texture)
	}
	texture.image.src = file;
	return texture;
}

function useTexture(name) {
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, textures[name]);
	if (textures[name + "_normalmap"]) {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures[name + "_normalmap"]);
	}
}


// Matrix stuff (ModelView, Projection)

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) throw "Invalid popMatrix!";
	mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(curProg.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(curProg.mvMatrixUniform, false, mvMatrix);

	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(curProg.nMatrixUniform, false, normalMatrix);
}


// Vetex buffer object capable of drawing itself

function VertexBuffer(vertices, texcoords, indices) {
	this.positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.positionBuffer.itemSize = 3;
	this.positionBuffer.numItems = vertices.length / 3;

	this.texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
	this.texcoordBuffer.itemSize = 2;
	this.texcoordBuffer.numItems = texcoords.length / 2;

	// Generate normals and tangents
	// Based on http://www.terathon.com/code/tangent.html
	var normals = [], tangents = [];
	// Initialize empty arrays
	for (var i = 0; i < vertices.length; ++i) {
		normals.push(0.0);
		tangents.push(0.0);
	}
	// Loop the triangles
	for (var i = 0; i < indices.length / 3; ++i) {
		// Get triangle vertex indices
		var i1 = indices[i*3], i2 = indices[i*3+1], i3 = indices[i*3+2];
		// Get triangle vertices
		var v1 = vec3.create([vertices[i1*3], vertices[i1*3+1], vertices[i1*3+2]]);
		var v2 = vec3.create([vertices[i2*3], vertices[i2*3+1], vertices[i2*3+2]]);
		var v3 = vec3.create([vertices[i3*3], vertices[i3*3+1], vertices[i3*3+2]]);
		// Create vectors out the vertices
		vec3.subtract(v2, v1);
		vec3.subtract(v3, v1);
		// Calculate normal with cross-product
		var n = vec3.create();
		vec3.cross(v2, v3, n);
		// Apply normal calculation results
		normals[i1*3+0] += n[0];
		normals[i1*3+1] += n[1];
		normals[i1*3+2] += n[2];
		normals[i2*3+0] += n[0];
		normals[i2*3+1] += n[1];
		normals[i2*3+2] += n[2];
		normals[i3*3+0] += n[0];
		normals[i3*3+1] += n[1];
		normals[i3*3+2] += n[2];
		// Texture coord mangling
		var s1 = texcoords[i2*2] - texcoords[i1*2];
		var s2 = texcoords[i3*2] - texcoords[i1*2];
		var t1 = texcoords[i2*2+1] - texcoords[i1*2+1];
		var t2 = texcoords[i3*2+1] - texcoords[i1*2+1];
		var r = 1.0 / (s1 * t2 - s2 * t1);
		// Tangent components
		var sx = (t2 * v2[0] - t1 * v3[0]) * r;
		var sy = (t2 * v2[1] - t1 * v3[1]) * r;
		var sz = (t2 * v2[2] - t1 * v3[2]) * r;
		// Apply tangent calculation results
		tangents[i1*3+0] += sx;
		tangents[i1*3+1] += sy;
		tangents[i1*3+2] += sz;
		tangents[i2*3+0] += sx;
		tangents[i2*3+1] += sy;
		tangents[i2*3+2] += sz;
		tangents[i3*3+0] += sx;
		tangents[i3*3+1] += sy;
		tangents[i3*3+2] += sz;
	}
	/*
	for (var i = 0; i < vertices.length / 3; ++i) {
		var t = vec3.create([tangents[i*3], tangents[i*3+1], tangents[i*3+2]]);
		var n = vec3.create([normals[i*3], normals[i*3+1], normals[i*3+2]]);
		var dot = (n, t);
		vec3.scale(n, dot);
		vec3.subtract(t, n);
		vec3.normalize(t);
		tangents[i*3+0] = t[0];
		tangents[i*3+1] = t[1];
		tangents[i*3+2] = t[2];
	}
	*/

	this.normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	this.normalBuffer.itemSize = 3;
	this.normalBuffer.numItems = normals.length / 3;

	this.tangentBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tangents), gl.STATIC_DRAW);
	this.tangentBuffer.itemSize = 3;
	this.tangentBuffer.numItems = tangents.length / 3;

	this.indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	this.indexBuffer.itemSize = 1;
	this.indexBuffer.numItems = indices.length;

	this.draw = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
		gl.vertexAttribPointer(curProg.vertexPositionAttribute, this.positionBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
		gl.vertexAttribPointer(curProg.textureCoordAttribute, this.texcoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(curProg.vertexNormalAttribute, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.vertexAttribPointer(curProg.vertexTangentAttribute, this.tangentBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		setMatrixUniforms();
		gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
}


// Lighting

var lights = [];
var maxLights = 8;
const NO_SPECULAR = 1000.0; // Shininess value that will disable specular color
const AMBIENT_LIGHT = [0.06, 0.06, 0.06];

function PointLight(position, diffuse, attenuation, specular) {
	this.position = position;
	this.diffuse = diffuse || vec3.create([0.9, 0.6, 0.1]);
	this.attenuation = attenuation || vec3.create([0.0, 0.0, 2.0]);
	this.specular = specular || vec3.create([1.0, 0.7, 0.2]);
	// NOTE: specular and diffuse color are hard-coded to shaders
	// due to nasty limits in varyings/uniforms
}

function setLightUniforms() {
	var lightCount = Math.min(lights.length, maxLights);
	gl.uniform1i(curProg.lightCountUniform, lightCount);

	function sortLights(a, b) {
		return player.distance(a.position) - player.distance(b.position);
	}

	if (lightCount < lights.length) {
		// Player's torch jiggles, so we make artificially
		// sure that it is the closest one.
		var torchpos = vec3.create(lights[0].position);
		lights[0].position = player.pos;
		lights.sort(sortLights);
		lights[0].position = torchpos;
	}
	gl.uniform1i(curProg.specialLightIndexUniform, -1);

	var position = [], attenuation = [];
	for (var i = 0; i < lightCount; ++i) {
		var lightPos = vec3.create(lights[i].position);
		mat4.multiplyVec3(mvMatrix, lightPos);
		function concat(a, b) { return a.concat([b[0], b[1], b[2]]); }
		position = concat(position, lightPos);
		attenuation = concat(attenuation, lights[i].attenuation);
		// HACK: identify special exit light
		if (lights[i].diffuse[2] == 0.9) {
			gl.uniform1i(curProg.specialLightIndexUniform, i);
			attenuation[attenuation.length-1] *= 1.5;
		}
	}
	gl.uniform3fv(curProg.lightPositionUniform, position);
	gl.uniform3fv(curProg.lightAttenuationUniform, attenuation);
	gl.uniform3fv(curProg.ambientColorUniform, AMBIENT_LIGHT);
}


// Utilities

function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

function rand(lo, hi) {
	return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function sign(num) { return ((num > 0) ? 1 : ((num < 0) ? -1 : 0)); }

function roundvec(vec) {
	return vec3.create([Math.round(vec[0]), Math.round(vec[1]), Math.round(vec[2])]);
}

function matchPos(p1, p2) {
	return Math.round(p1[0]) == Math.round(p2[0])
		&& Math.round(p1[1]) == Math.round(p2[1]);
}

function gridDistance(p1, p2) {
	return Math.max(
		Math.abs(Math.round(p1[0]) - Math.round(p2[0])),
		Math.abs(Math.round(p1[1]) - Math.round(p2[1]))
		);
}

function fract(num) {
	return num - Math.floor(num);
}

function $() {
	var elements = new Array();
	for (var i = 0; i < arguments.length; ++i) {
		var element = arguments[i];
		if (typeof element == 'string')
			element = document.getElementById(element);
		if (arguments.length == 1)
			return element;
		elements.push(element);
	}
	return elements;
}
