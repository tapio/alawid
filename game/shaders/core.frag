#ifdef GL_ES
precision highp float;
precision highp int;
#endif

// MAX_LIGHTS is defined by calling code.
// Limit varying vectors to 8 and uniform vectors to 16.

uniform float uMaterialShininess;

uniform vec3 uAmbientColor;

uniform int uLightCount;
uniform int uSpecialLightIndex;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightAttenuations[MAX_LIGHTS];

uniform sampler2D uTextureSampler;
uniform sampler2D uNormalMapSampler;

varying vec4 vPosition;
varying vec2 vTextureCoord;
varying vec3 vViewVector;
varying vec3 vLightVectors[MAX_LIGHTS];


void main(void) {
	const vec3 diffuseColor = vec3(0.9, 0.6, 0.1);
	const vec3 specialColor = vec3(0.6, 0.1, 0.9);

	vec3 lightWeighting = vec3(0.0, 0.0, 0.0);
	vec3 viewVec = normalize(vViewVector);

	vec3 bump = normalize(texture2D(uNormalMapSampler, vTextureCoord.st).xyz * 2.0 - 1.0);
	vec3 refl = reflect(-viewVec, bump);

	for (int i = 0; i < MAX_LIGHTS; ++i) {
		if (i >= uLightCount) break;
		vec3 lightColor = diffuseColor;
		if (i == uSpecialLightIndex) lightColor = specialColor;
		vec3 specularColor = min(lightColor + vec3(0.2, 0.2, 0.2), 1.0);
		vec3 lightVec = normalize(vLightVectors[i]);
		float diffuse = max(dot(lightVec, bump), 0.0);

		float specular = 0.0;
		if (uMaterialShininess < 1000.0) {
			specular = pow(clamp(dot(refl, lightVec), 0.0, 1.0), uMaterialShininess);
		}

		// Attenuation
		float attenuation = 1.0;
		// We use length() instead of distance() because of a bug in some ATI cards/drivers
		float dist = length(uLightPositions[i] - vPosition.xyz);
		if (dist != 0.0) {
			attenuation = clamp(
				1.0 / (
					uLightAttenuations[i].x + 
					(uLightAttenuations[i].y * dist) +
					(uLightAttenuations[i].z * dist * dist)
					),
				0.0, 1.0);
		}

		lightWeighting += attenuation * (specularColor * specular + lightColor * diffuse);
	}

	lightWeighting += uAmbientColor;

	vec4 fragmentColor = texture2D(uTextureSampler, vTextureCoord.st);
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
