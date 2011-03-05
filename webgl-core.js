
// GL Initialization

var gl;

function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	} catch (e) { }
	if (!gl) alert("Could not initialise WebGL, sorry :-(");
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
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function createProgram(vertexShaderFile, fragmentShaderFile) {
	var vertexShader = createShader(gl, loadFile('shaders/'+vertexShaderFile), gl.VERTEX_SHADER);
	var fragmentShader = createShader(gl, loadFile('shaders/'+fragmentShaderFile), gl.FRAGMENT_SHADER);
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
		alert("Could not initialise shaders");

	program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
	gl.enableVertexAttribArray(program.vertexPositionAttribute);
	program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");
	gl.enableVertexAttribArray(program.vertexNormalAttribute);
	program.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
	gl.enableVertexAttribArray(program.textureCoordAttribute);

	program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
	program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
	program.nMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
	program.samplerUniform = gl.getUniformLocation(program, "uSampler");
	program.useTexturesUniform = gl.getUniformLocation(program, "uUseTextures");
	program.useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
	program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
	program.pointLightingLocationUniform = gl.getUniformLocation(program, "uPointLightingLocation");
	program.pointLightingColorUniform = gl.getUniformLocation(program, "uPointLightingColor");
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
