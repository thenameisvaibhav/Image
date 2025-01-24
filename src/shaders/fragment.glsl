float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
}



float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r) {
  r.xy = (p.x > 0.0) ? r.xy : r.zw;
  r.x = (p.y > 0.0) ? r.x : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}





uniform sampler2D uTexture;
uniform sampler2D uPrevTexture;
uniform float uProgress;
uniform int uDirection;
uniform sampler2D uDispTexture;

varying vec2 vUv;   
varying float vPushed;
void main() {
 vec2 uv = vUv;
    // float noiseFactor = noise(gl_FragCoord.xy * 0.05);
    float noiseFactor = 0.0;
    float dispTexture = texture2D(uDispTexture, uv).r;
    noiseFactor = dispTexture;

    
    vec2 distortedPosition = vec2(uv.x - float(uDirection) * (1.0 - uProgress) * noiseFactor, uv.y);
    float curTextureR = texture2D(uTexture, distortedPosition + vec2(vPushed * 0.062)).r;
    float curTextureG = texture2D(uTexture, distortedPosition + vec2(vPushed * 0.042)).g;
    float curTextureB = texture2D(uTexture, distortedPosition + vec2(vPushed * 0.022)).b;
    float curTextureA = texture2D(uTexture, distortedPosition).a;
    vec4 curTexture = vec4(curTextureR, curTextureG, curTextureB, curTextureA);

    vec2 distortedPositionPrev = vec2(uv.x + float(uDirection) * uProgress * noiseFactor, uv.y);
    vec4 prevTexture = texture2D(uPrevTexture, distortedPositionPrev);
  vec4 mixTexture = mix(prevTexture, curTexture, uProgress);
  vec2 centeredUv = (vUv - 0.5) * 2.0;
  float frame = sdRoundedBox(centeredUv, vec2(1.0), vec4(0.2, 0.0, 0.0, 0.2));
  frame = smoothstep(0.0, 0.002, -frame);
  mixTexture.a *= frame;  
  gl_FragColor = mixTexture;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
