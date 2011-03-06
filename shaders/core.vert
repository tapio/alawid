#define MAX_LIGHTS 10

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexTangent;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];

varying vec4 vPosition;
varying vec2 vTextureCoord;
varying vec3 vViewVector;
varying vec3 vLightVectors[MAX_LIGHTS];

void main(void) {
	vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;

	vec3 n = normalize(uNMatrix * aVertexNormal);
	vec3 t = normalize(uNMatrix * aVertexTangent);
	vec3 b = cross(n, t);
	vec3 v = vec3(0, 0, 0);
	for (int i = 0; i < MAX_LIGHTS; ++i) {
		if (i >= uLightCount) break;
		vec3 lightVec = uLightPositions[i] - vPosition.xyz;
		v.x = dot(lightVec, t);
		v.y = dot(lightVec, b);
		v.z = dot(lightVec, n);
		vLightVectors[i] = v;
	}

	vec3 viewVec = -vPosition.xyz;
	vViewVector = vec3(dot(viewVec, t), dot(viewVec, b), dot(viewVec, n));

	gl_Position = uPMatrix * vPosition;
}

