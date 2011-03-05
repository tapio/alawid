#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

uniform bool uUseLighting;
uniform bool uUseTextures;

uniform vec3 uAmbientColor;

uniform vec3 uPointLightingLocation;
uniform vec3 uPointLightingColor;

uniform sampler2D uSampler;


void main(void) {
	vec3 lightWeighting;
	if (!uUseLighting) {
		lightWeighting = vec3(1.0, 1.0, 1.0);
	} else {
		vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);

		float directionalLightWeighting = max(dot(normalize(vTransformedNormal), lightDirection), 0.0);
		lightWeighting = uAmbientColor + uPointLightingColor * directionalLightWeighting;
	}

	vec4 fragmentColor;
	if (uUseTextures) {
		fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	} else {
		fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}

