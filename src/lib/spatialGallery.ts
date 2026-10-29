export type GlassScene = {
  setPalette: (index: number) => void;
  setPointer: (x: number, y: number) => void;
  setPaused: (value: boolean) => void;
  destroy: () => void;
};

/** A small, transparent optical sculpture for the spatial project gallery. */
export function createGlassScene(canvas: HTMLCanvasElement): GlassScene | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const releaseContext = () => { gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  const vertex = `attribute vec2 aPosition; void main(){gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment = `
    precision highp float;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uPalette;
    mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
    vec3 backdrop(vec2 p){
      vec3 col=vec3(.17,.12,.29);
      float band=sin(p.x*2.6+p.y*2.1+uTime*.24);
      col+=vec3(.08,.19,.31)*exp(-2.5*dot(p-vec2(-.65,.5),p-vec2(-.65,.5)));
      col+=vec3(.25,.09,.36)*exp(-2.5*dot(p-vec2(.65,-.5),p-vec2(.65,-.5)));
      col+=mix(vec3(.03,.27,.32),vec3(.3,.08,.35),.5+.5*sin(uPalette*.8))*pow(.5+.5*band,10.)*.7;
      float lines=pow(.5+.5*sin(p.x*26.+p.y*9.),26.);
      col+=vec3(.12,.16,.25)*lines*.16;
      return col;
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;
      vec2 p=uv*2.7;
      p-=uPointer*vec2(.07,.04);
      vec3 col=backdrop(p);
      vec2 q=rot(-.42+sin(uTime*.12)*.08)*p;
      q.y*=1.13;
      float angle=atan(q.y,q.x);
      float radius=length(q);
      float ripple=.035*sin(angle*3.+uTime*.5)+.018*cos(angle*5.-uTime*.3);
      float center=.91+ripple;
      float halfWidth=.23+.035*sin(angle*2.-uTime*.28);
      float tube=(radius-center)/halfWidth;
      float mask=1.-smoothstep(.97,1.015,abs(tube));
      float height=sqrt(max(0.,1.-tube*tube));
      vec2 direction=normalize(q+vec2(.001));
      vec2 normal=direction*tube;
      vec2 refracted=p+rot(.42)*(normal*(.3+.2*height));
      vec3 glass;
      glass.r=backdrop(refracted+normal*.042).r;
      glass.g=backdrop(refracted).g;
      glass.b=backdrop(refracted-normal*.042).b;
      glass*=1.4;
      float fresnel=pow(1.-height,2.4);
      glass+=fresnel*vec3(.25,.55,.64);
      float streak=pow(max(0.,dot(normalize(vec3(normal,height)),normalize(vec3(-.5,.8,.6)))),26.);
      glass+=vec3(.75,.96,1.)*streak*1.5;
      float rim=pow(max(0.,1.-abs(abs(tube)-.92)),34.);
      glass+=rim*mix(vec3(.65,.48,1.),vec3(.35,.95,1.),.5+.5*sin(angle*2.+uTime*.1))*.7;
      glass+=vec3(.12,.25,.34)*height*.16;
      col=mix(col,glass,mask);
      float outerGlow=exp(-22.*abs(radius-center-halfWidth));
      col+=outerGlow*vec3(.1,.25,.3)*.15;
      col*=clamp(1.-.16*dot(uv,uv),.75,1.);
      // Only the optical sculpture and its soft glow cover the page background.
      float coverage=max(mask*(.64+.3*fresnel),outerGlow*.12);
      gl_FragColor=vec4(clamp(col,0.,1.)*coverage,coverage);
    }`;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) { if (vs) gl.deleteShader(vs); if (fs) gl.deleteShader(fs); releaseContext(); return null; }
  const program = gl.createProgram();
  if (!program) { gl.deleteShader(vs); gl.deleteShader(fs); releaseContext(); return null; }
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); gl.deleteShader(vs); gl.deleteShader(fs); releaseContext(); return null; }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program,"uResolution");
  const pointer = gl.getUniformLocation(program,"uPointer");
  const time = gl.getUniformLocation(program,"uTime");
  const palette = gl.getUniformLocation(program,"uPalette");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false, visible = true, disposed = false, lost = false;
  let x = 0, y = 0, selected = 0, elapsed = 0, last = 0, frame = 0;
  const draw = () => {
    if (disposed || lost) return;
    gl.useProgram(program);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform2f(resolution,canvas.width,canvas.height);
    gl.uniform2f(pointer,x,y); gl.uniform1f(time,elapsed); gl.uniform1f(palette,selected);
    gl.drawArrays(gl.TRIANGLES,0,6);
  };
  const animate = (now: number) => {
    frame = 0;
    if (disposed || lost || paused || !visible || document.hidden || preference.matches) { last=0; return; }
    elapsed += last ? Math.min((now-last)/1000,.06) : 0;
    last = now; draw(); frame=requestAnimationFrame(animate);
  };
  const sync = () => {
    if (frame) cancelAnimationFrame(frame);
    frame=0; last=0; draw();
    if (!disposed && !lost && !paused && visible && !document.hidden && !preference.matches) frame=requestAnimationFrame(animate);
  };
  const resize = () => {
    const scale=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.round(canvas.clientWidth*scale));
    canvas.height=Math.max(1,Math.round(canvas.clientHeight*scale));
    draw();
  };
  const resizeObserver=new ResizeObserver(resize); resizeObserver.observe(canvas);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry?.isIntersecting??true;sync();}); intersection.observe(canvas);
  const onLost=(event:Event)=>{event.preventDefault();lost=true;canvas.style.opacity="0";sync();};
  // Keeping the CSS sculpture underneath means context loss still has a composed fallback.
  canvas.addEventListener("webglcontextlost",onLost);
  document.addEventListener("visibilitychange",sync); preference.addEventListener("change",sync);
  resize(); sync();
  return {
    setPalette(value){selected=value;draw();},
    setPointer(px,py){x=px;y=py;if(paused||preference.matches)draw();},
    setPaused(value){paused=value;sync();},
    destroy(){disposed=true;if(frame)cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();document.removeEventListener("visibilitychange",sync);preference.removeEventListener("change",sync);canvas.removeEventListener("webglcontextlost",onLost);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);releaseContext();},
  };
}

const symbols = [
  '<path d="M106 75h75v109h-75zM119 99h49m-49 15h49m-49 15h35m-35 25h49"/><path d="M119 75v-9h75v109h-13"/>',
  '<circle cx="150" cy="125" r="58"/><path d="m172 103-11 33-33 11 11-33zM150 59v16m0 100v16m-66-66h16m100 0h16"/>',
  '<rect x="78" y="73" width="144" height="104" rx="9"/><path d="M78 98h144M111 99v78m17-52h29m-29 17h69m-69 17h50"/><circle cx="91" cy="86" r="2"/><circle cx="101" cy="86" r="2"/>',
  '<path d="m72 94 48-19 58 19 50-19v98l-50 19-58-19-48 19zM120 75v98m58-79v98"/><path d="M171 113c0 18-21 37-21 37s-21-19-21-37a21 21 0 1 1 42 0z"/><circle cx="150" cy="112" r="7"/>',
  '<rect x="103" y="63" width="94" height="128" rx="8"/><circle cx="150" cy="99" r="15"/><path d="M126 128c0-24 48-24 48 0m-49 19h50m-50 17h36"/>',
  '<path d="m115 92-33 33 33 33m70-66 33 33-33 33m-26-76-18 98"/>',
  '<path d="m115 88-27 27 68 68 27-27zM88 88l27 27m55-43-18 18 10 17 17 10 18-18c12 36-17 55-42 42l-41 41-23-23 41-41c-13-25 6-54 38-46z"/>',
  '<path d="M99 82c27-31 76-17 76 13 0 32-76 28-76 61 0 30 49 44 76 13M174 83c-27-31-76-17-76 13 0 32 76 28 76 61 0 30-49 44-76 13"/><circle cx="210" cy="79" r="5"/><circle cx="81" cy="179" r="4"/>',
  '<path d="M104 89h92c19 0 39 69 18 76-15 5-29-19-38-19h-52c-9 0-23 24-38 19-21-7-1-76 18-76zM109 111v25m-13-13h26"/><circle cx="183" cy="114" r="4"/><circle cx="197" cy="128" r="4"/>',
];

export const galleryColors = ["#8de2ff","#ae9fff","#94b7ff","#7ce9ca","#ffb3d3","#ffc58c","#9fe9ba","#c3a2ff","#ff9fca"];
export function projectArtwork(index:number):string {
  const color=galleryColors[index%galleryColors.length]??"#8de2ff";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><defs><radialGradient id="g"><stop stop-color="${color}" stop-opacity=".2"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient><pattern id="p" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="${color}" stroke-opacity=".08"/></pattern><filter id="s"><feGaussianBlur stdDeviation="3"/></filter></defs><rect width="300" height="250" fill="#14102a" fill-opacity=".45"/><rect width="300" height="250" fill="url(#p)"/><circle cx="150" cy="125" r="135" fill="url(#g)"/><g stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".3" filter="url(#s)">${symbols[index%9]}</g><g stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${symbols[index%9]}</g><g fill="${color}" opacity=".65"><circle cx="43" cy="51" r="2"/><circle cx="260" cy="192" r="2"/><path d="M42 202h17m-8-8v17" stroke="${color}"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
