attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexTangent;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 vPosition;
varying vec3 vTransformedNormal;
varying vec3 vTangent;
varying vec2 vTextureCoord;

uniform int uEnableNormalMap;

void main(void) {
	if (uEnableNormalMap == 1) {
		vTangent = aVertexTangent; //(uMVMatrix * vec4(aVertexTangent, 1.0)).xyz;
	}
	vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
	vTransformedNormal = uNMatrix * aVertexNormal;
	gl_Position = uPMatrix * vPosition;
}

