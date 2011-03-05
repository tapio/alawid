#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform bool uUseTextures;

uniform sampler2D uSampler;

void main(void) {
	vec4 fragmentColor;
	if (uUseTextures) {
		fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	} else {
		fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
	gl_FragColor = vec4(fragmentColor.rgb * vLightWeighting, fragmentColor.a);
}
