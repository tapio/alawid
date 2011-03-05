#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform float uMaterialShininess;

uniform vec3 uAmbientColor;

uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingSpecularColor;
uniform vec3 uPointLightingDiffuseColor;
uniform vec3 uPointLightingAttenuation;

uniform sampler2D uSampler;


void main(void) {
	vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
	vec3 normal = normalize(vTransformedNormal);

	vec3 eyeDirection = normalize(-vPosition.xyz);
	vec3 reflectionDirection = reflect(-lightDirection, normal);
	float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);

	float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);

	// Attenuation
	float attenuation = 1.0;
	float dist = distance(uPointLightingLocation, vPosition.xyz);
	if (dist != 0.0) {
		attenuation = clamp(
			1.0 / (
				uPointLightingAttenuation.x + 
				(uPointLightingAttenuation.y * dist) +
				(uPointLightingAttenuation.z * dist * dist)
				),
			0.0, 1.0);
	}

	vec3 lightWeighting = uAmbientColor
		+ uPointLightingSpecularColor * specularLightWeighting * attenuation
		+ uPointLightingDiffuseColor * diffuseLightWeighting * attenuation;

	vec4 fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
