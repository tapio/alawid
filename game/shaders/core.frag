#ifdef GL_ES
precision highp float;
#endif

#define MAX_LIGHTS 8

uniform float uMaterialShininess;

uniform vec3 uAmbientColor;

uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightDiffuseColors[MAX_LIGHTS];
uniform vec3 uLightSpecularColors[MAX_LIGHTS];
uniform vec3 uLightAttenuations[MAX_LIGHTS];

uniform bool uEnableNormalMap;
uniform sampler2D uTextureSampler;
uniform sampler2D uNormalMapSampler;

varying vec4 vPosition;
varying vec2 vTextureCoord;
varying vec3 vViewVector;
varying vec3 vLightVectors[MAX_LIGHTS];


void main(void) {
	vec3 lightWeighting = vec3(0.0, 0.0, 0.0);
	vec3 viewVec = normalize(vViewVector);

	vec3 bump = vec3(0.0, 0.0, 0.0);
	if (uEnableNormalMap) {
		bump = normalize(texture2D(uNormalMapSampler, vTextureCoord.st).xyz * 2.0 - 1.0);
	}
	vec3 refl = reflect(-viewVec, bump);

	for (int i = 0; i < MAX_LIGHTS; ++i) {
		if (i >= uLightCount) break;
		vec3 lightVec = normalize(vLightVectors[i]);
		float diffuse = max(dot(lightVec, bump), 0.0);

		float specular = 0.0;
		if (uMaterialShininess < 1000.0) {
			specular = pow(clamp(dot(refl, lightVec), 0.0, 1.0), uMaterialShininess);
		}

		// Attenuation
		float attenuation = 1.0;
		float dist = distance(uLightPositions[i], vPosition.xyz);
		if (dist != 0.0) {
			attenuation = clamp(
				1.0 / (
					uLightAttenuations[i].x + 
					(uLightAttenuations[i].y * dist) +
					(uLightAttenuations[i].z * dist * dist)
					),
				0.0, 1.0);
		}

		lightWeighting += attenuation * (uLightSpecularColors[i] * specular + uLightDiffuseColors[i] * diffuse);
	}

	lightWeighting += uAmbientColor;

	vec4 fragmentColor = texture2D(uTextureSampler, vTextureCoord.st);
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
