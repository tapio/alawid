#ifdef GL_ES
precision highp float;
#endif

#define MAX_LIGHTS 12

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform float uMaterialShininess;

uniform vec3 uAmbientColor;

uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightDiffuseColors[MAX_LIGHTS];
uniform vec3 uLightSpecularColors[MAX_LIGHTS];
uniform vec3 uLightAttenuations[MAX_LIGHTS];

uniform int uEnableNormalMap;
uniform sampler2D uTextureSampler;
uniform sampler2D uNormalMapSampler;


void main(void) {
	vec3 lightWeighting = vec3(0.0, 0.0, 0.0);
	vec3 normal = normalize(vTransformedNormal);
	vec3 eyeDirection = normalize(-vPosition.xyz);

	vec3 bump = normal;
	if (uEnableNormalMap > 0) {
		bump = normalize(texture2D(uNormalMapSampler, vTextureCoord.st).xyz * 2.0 - 1.0);
	}

	for (int i = 0; i < MAX_LIGHTS; ++i) {
		if (i >= uLightCount) break;
		vec3 lightDirection = normalize(uLightPositions[i] - vPosition.xyz);
		float diffuse = max(dot(normal, lightDirection), 0.0);

		vec3 reflectionDirection = reflect(-lightDirection, normal);
		float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);

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
