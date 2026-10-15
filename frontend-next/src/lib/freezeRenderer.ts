/**
 * Draws the crest turning to ice, in the style of a "freezing ice transition":
 * a ragged frost front spreads out from where the crest was tapped, glowing as it
 * moves, and leaves thick, glossy ice behind it. The ice is made of cracked crystal
 * plates, bulges a little past the crest's outline, and the crest shows through it.
 *
 * The ice itself, and the moment each pixel freezes, never change during the
 * animation, so they're drawn once into textures. Each frame only blends them.
 */

/** The canvas is 120% of the crest's size, so the ice has room to grow past the outline. */
export const CREST_PAD = 0.1 / 1.2;

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const SHARED = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uLogo;
uniform float uPad;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float bell(float x) {
  return exp(-x * x);
}

vec2 crestUv(vec2 p) {
  return (p - uPad) / (1.0 - 2.0 * uPad);
}

// The crest, premultiplied, and transparent outside its square.
vec4 crest(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uLogo, uv);
}
`;

const BAKE = `${SHARED}
uniform vec2 uOrigin;
uniform float uMode;

vec2 hash2(vec2 p) {
  float h = hash(p);
  return vec2(h, hash(p + h * 17.0 + 3.1));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.07 + vec2(17.3, 9.1);
    a *= 0.5;
  }
  return v;
}

// Crystal plates (Voronoi cells). x: gap to the second-nearest centre, small along plate borders.
// yz: direction to the nearest centre, used to make each plate bulge.
vec3 plates(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  vec2 toCentre = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 r = g + 0.1 + hash2(n + g) * 0.8 - f;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        toCentre = r;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  return vec3(sqrt(d2) - sqrt(d1), toCentre);
}

void main() {
  vec2 p = vUv;
  vec2 uv = crestUv(p);

  // Grow the outline outward in soft lumps: the ice is thicker than the crest.
  float reach = 0.02 + 0.025 * fbm(p * 5.0 + 21.0);
  float grown = crest(uv).a;
  float thick = grown;
  for (int k = 0; k < 16; k++) {
    float angle = float(k) * 0.3927;
    vec2 dir = vec2(cos(angle), sin(angle));
    float near = crest(uv + dir * reach * 0.5).a;
    float far = crest(uv + dir * reach).a;
    grown = max(grown, max(near, far));
    thick += near + far;
  }
  thick /= 33.0;

  if (uMode > 0.5) {
    // When each point freezes: its distance from the tap, plus a ragged, fractal front.
    float span = max(max(length(uOrigin), length(uOrigin - vec2(1.0, 0.0))), max(length(uOrigin - vec2(0.0, 1.0)), length(uOrigin - vec2(1.0))));
    float t = length(p - uOrigin) / span;
    t += (fbm(p * 4.5 + 3.1) - 0.5) * 0.34 + (fbm(p * 16.0 - 7.7) - 0.5) * 0.14;
    float v = floor(clamp((t + 0.3) / 1.6, 0.0, 1.0) * 65535.0 + 0.5);
    float hi = floor(v / 256.0);
    gl_FragColor = vec4(hi / 255.0, (v - hi * 256.0) / 255.0, grown, 1.0);
    return;
  }

  float shape = smoothstep(0.4, 0.6, grown);
  vec3 big = plates(p * 13.0);
  vec3 fine = plates(p * 30.0 + 7.0);
  float border = 1.0 - smoothstep(0.0, 0.08, big.x);
  float crack = 1.0 - smoothstep(0.0, 0.05, fine.x);

  // Each plate bulges a little, and noise gives the surface a melted unevenness.
  float e = 0.004;
  float h = fbm(p * 8.0);
  vec2 slope = vec2(fbm((p + vec2(e, 0.0)) * 8.0) - h, fbm((p + vec2(0.0, e)) * 8.0) - h) / e;
  vec3 normal = normalize(vec3(-(slope * 0.035 + big.yz * 0.6), 1.0));
  vec3 light = normalize(vec3(-0.5, -0.6, 0.65));
  float diffuse = clamp(dot(normal, light), 0.0, 1.0);
  float specular = pow(clamp(dot(normal, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 40.0);

  // The crest shows through, bent by the ice.
  vec4 under = crest(uv - normal.xy * 0.03);
  vec3 seen = under.a > 0.001 ? under.rgb / under.a : vec3(0.0);
  float lum = dot(seen, vec3(0.299, 0.587, 0.114)) * under.a;

  vec3 deep = vec3(0.03, 0.2, 0.42);
  vec3 cyan = vec3(0.3, 0.72, 0.95);
  vec3 pale = vec3(0.88, 0.97, 1.0);
  float shade = clamp(0.06 + lum * 2.4 + (fbm(p * 3.0 + 5.0) - 0.5) * 0.25, 0.0, 1.0);
  vec3 ice = mix(deep, cyan, smoothstep(0.0, 0.5, shade));
  ice = mix(ice, pale, smoothstep(0.5, 1.0, shade));
  // Keep the crest's own detail visible through the ice.
  ice = mix(ice, seen * 1.25, 0.3 * under.a);
  ice = mix(ice, pale, border * 0.35 + crack * 0.12);
  ice *= 0.72 + 0.4 * diffuse;
  ice += specular * 0.8;
  // Thin ice at the rim catches the light.
  ice = mix(ice, pale, (1.0 - smoothstep(0.3, 0.85, thick)) * 0.55);

  float alpha = shape * mix(0.82, 0.97, smoothstep(0.35, 0.8, thick));
  gl_FragColor = vec4(min(ice, vec3(1.0)) * alpha, alpha);
}`;

const COMPOSITE = `${SHARED}
uniform sampler2D uIce;
uniform sampler2D uMap;
uniform float uProgress;
uniform float uGlint;
uniform float uTime;

void main() {
  vec4 base = crest(crestUv(vUv));
  // Textures drawn into a framebuffer are stored bottom-up.
  vec2 baked = vec2(vUv.x, 1.0 - vUv.y);
  vec4 map = texture2D(uMap, baked);
  vec4 ice = texture2D(uIce, baked);

#ifdef GL_FRAGMENT_PRECISION_HIGH
  float when = (floor(map.r * 255.0 + 0.5) * 256.0 + floor(map.g * 255.0 + 0.5)) / 65535.0;
#else
  float when = map.r;
#endif
  float t = when * 1.6 - 0.3;
  float front = mix(-0.25, 1.3, uProgress);
  float frozen = 1.0 - smoothstep(front - 0.012, front + 0.012, t);
  vec4 color = mix(base, ice, frozen);

  // White frost just behind the advancing front.
  color.rgb += vec3(0.82, 0.96, 1.0) * bell((front - t - 0.035) * 20.0) * frozen * ice.a * 0.55;

  // The front glows as it moves, with sparkles flickering along it.
  float moving = smoothstep(0.0, 0.05, uProgress) * (1.0 - smoothstep(0.9, 1.0, uProgress));
  float line = bell((t - front) * 50.0) * smoothstep(0.2, 0.6, map.b) * moving;
  vec2 sparkCell = floor(vUv * 120.0);
  float spark = step(0.93, hash(sparkCell + floor(uTime * 15.0))) * (1.0 - smoothstep(0.0, 0.45, length(fract(vUv * 120.0) - 0.5)));
  color.rgb += vec3(0.55, 0.94, 1.0) * line * (0.9 + spark * 2.0);
  color.a = max(color.a, min(1.0, line * 0.9));

  // Once frozen, a glint runs across the ice.
  float glint = bell(((vUv.x + vUv.y) * 0.5 - mix(-0.15, 1.15, uGlint)) * 7.0) * step(0.0001, uGlint) * step(uGlint, 0.9999);
  color.rgb += vec3(0.85, 0.97, 1.0) * glint * ice.a * frozen * 0.4;

  // Tiny twinkles in the ice.
  vec2 twinkleCell = floor(vUv * 60.0);
  float twinkle = step(0.975, hash(twinkleCell + 11.0)) * (1.0 - smoothstep(0.0, 0.3, length(fract(vUv * 60.0) - 0.5)));
  twinkle *= 0.5 + 0.5 * sin(uTime * 5.0 + hash(twinkleCell) * 6.2831);
  color.rgb += vec3(twinkle) * frozen * ice.a * 0.6;

  gl_FragColor = color;
}`;

export interface FreezeRenderer {
  /** progress: 0 → 1 as the frost spreads. glint: 0 → 1 as the glint crosses the finished ice. */
  draw(progress: number, glint: number, seconds: number): void;
  dispose(): void;
}

/**
 * Sets up WebGL on `canvas` for `logo` with the frost starting at `origin` (0–1 across the canvas).
 * Returns null when WebGL isn't available, so the caller can fall back to something simpler.
 */
export function createFreezeRenderer(
  canvas: HTMLCanvasElement,
  logo: HTMLImageElement,
  origin: { x: number; y: number }
): FreezeRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const release = () => gl.getExtension("WEBGL_lose_context")?.loseContext();

  try {
    const width = canvas.width;
    const height = canvas.height;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Couldn't create a shader.");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "");
      return shader;
    };
    const link = (fragment: string) => {
      const program = gl.createProgram();
      if (!program) throw new Error("Couldn't create a program.");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "");
      return program;
    };
    const bake = link(BAKE);
    const composite = link(COMPOSITE);

    // One triangle that covers the whole canvas.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texture = (filter: number) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === gl.NEAREST ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    // The crest, resampled to a power-of-two square so it can have mipmaps and stay smooth when shrunk.
    const square = document.createElement("canvas");
    square.width = square.height = 1024;
    square.getContext("2d")?.drawImage(logo, 0, 0, 1024, 1024);
    gl.activeTexture(gl.TEXTURE0);
    texture(gl.LINEAR_MIPMAP_LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, square);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Draw the static ice (unit 1) and the freeze timing (unit 2) once.
    const target = (unit: number, filter: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const tex = texture(filter);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return framebuffer;
    };
    const iceTarget = target(1, gl.LINEAR);
    const mapTarget = target(2, gl.NEAREST);

    gl.useProgram(bake);
    gl.viewport(0, 0, width, height);
    gl.uniform1i(gl.getUniformLocation(bake, "uLogo"), 0);
    gl.uniform1f(gl.getUniformLocation(bake, "uPad"), CREST_PAD);
    gl.uniform2f(gl.getUniformLocation(bake, "uOrigin"), origin.x, origin.y);
    const mode = gl.getUniformLocation(bake, "uMode");
    for (const [value, framebuffer] of [
      [0, iceTarget],
      [1, mapTarget],
    ] as const) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.uniform1f(mode, value);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(composite);
    gl.uniform1i(gl.getUniformLocation(composite, "uLogo"), 0);
    gl.uniform1i(gl.getUniformLocation(composite, "uIce"), 1);
    gl.uniform1i(gl.getUniformLocation(composite, "uMap"), 2);
    gl.uniform1f(gl.getUniformLocation(composite, "uPad"), CREST_PAD);
    const progress = gl.getUniformLocation(composite, "uProgress");
    const glint = gl.getUniformLocation(composite, "uGlint");
    const time = gl.getUniformLocation(composite, "uTime");

    return {
      draw(progressValue, glintValue, seconds) {
        gl.uniform1f(progress, progressValue);
        gl.uniform1f(glint, glintValue);
        gl.uniform1f(time, seconds);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose: release,
    };
  } catch (error) {
    console.warn("Crest ice effect unavailable:", error);
    release();
    return null;
  }
}
