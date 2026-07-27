const canvas = document.querySelector('#lab-canvas');
const ctx = canvas.getContext('2d');
const ui = {
  tabs: [...document.querySelectorAll('.tab')], play: document.querySelector('#play-toggle'),
  label: document.querySelector('#canvas-label'), hint: document.querySelector('#canvas-hint'),
  kicker: document.querySelector('#lesson-kicker'), title: document.querySelector('#lesson-title'),
  body: document.querySelector('#lesson-body'), controls: document.querySelector('#controls'),
  formula: document.querySelector('#formula'), matrix: document.querySelector('#matrix-output'), fps: document.querySelector('#fps'),
  change: document.querySelector('#what-you-change'), gpu: document.querySelector('#what-gpu-does'), hack: document.querySelector('#next-hack')
};
const state = {
  view: 'mesh', playing: true, last: performance.now(), fps: 60, time: 0, drag: null,
  mesh: { cols: 7, rows: 5, offsets: new Map() },
  deform: { amplitude: 54, frequency: 1.35, speed: 1.1, phase: 0 },
  skeleton: { shoulder: -18, elbow: 62, pulse: true }
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const rad = d => d * Math.PI / 180;
const mix = (a,b,t) => a + (b-a)*t;
const smooth = (a,b,x) => { const t = clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const v = (x,y) => ({x,y});
const add = (a,b) => v(a.x+b.x,a.y+b.y);
const sub = (a,b) => v(a.x-b.x,a.y-b.y);
const scale = (a,s) => v(a.x*s,a.y*s);
const rotate = (p,a) => v(p.x*Math.cos(a)-p.y*Math.sin(a),p.x*Math.sin(a)+p.y*Math.cos(a));
const fmt = n => Number(n).toFixed(2);

function logicalPoint(event) {
  const box = canvas.getBoundingClientRect();
  return v((event.clientX-box.left)*canvas.width/box.width,(event.clientY-box.top)*canvas.height/box.height);
}
function clear() { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#081722';ctx.fillRect(0,0,canvas.width,canvas.height); }
function gridBackground() { ctx.save();ctx.strokeStyle='rgba(104,230,232,.075)';ctx.lineWidth=1;for(let x=0;x<900;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,560);ctx.stroke();}for(let y=0;y<560;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}ctx.restore(); }
function line(a,b,color='#4c7890',width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function dot(p,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();}
function text(t,p,color='#bcd4e5',size=13,align='left') {ctx.fillStyle=color;ctx.font=`${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;ctx.textAlign=align;ctx.fillText(t,p.x,p.y);}
function meshPoint(col,row) {
  const {cols,rows,offsets}=state.mesh; const base=v(115+col*(670/(cols-1)),105+row*(340/(rows-1)));
  const offset=offsets.get(`${col}:${row}`)||v(0,0);return add(base,offset);
}
function drawMesh() {
  const {cols,rows}=state.mesh; clear();gridBackground();
  for(let r=0;r<rows-1;r++) for(let c=0;c<cols-1;c++) {
    const a=meshPoint(c,r),b=meshPoint(c+1,r),d=meshPoint(c,r+1),e=meshPoint(c+1,r+1);
    ctx.fillStyle=`hsla(${190+r*8+c*4},75%,56%,.10)`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(e.x,e.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
    line(a,b);line(a,d);if(c===cols-2)line(b,e);if(r===rows-2)line(d,e);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const p=meshPoint(c,r);dot(p,5,'#68e6e8');text(`v${r*cols+c}`,add(p,v(8,-9)),'#84a9bd',10);}
  text('一个 quad 通常被拆成两个 triangles： (a,b,e) + (a,e,d)',v(450,500),'#ffd66b',13,'center');
  ui.matrix.textContent=`vertex count = ${cols*rows}\ntriangle count = ${(cols-1)*(rows-1)*2}\nexample v0 = [${fmt(meshPoint(0,0).x)}, ${fmt(meshPoint(0,0).y)}, 1]`;
}
function deformPoint(c,r,phase=state.deform.phase) {
  const cols=20, rows=8;const u=c/(cols-1),vv=r/(rows-1);const base=v(85+u*730,150+vv*260); const envelope=Math.sin(Math.PI*vv);
  const y=base.y+state.deform.amplitude*Math.sin(Math.PI*2*state.deform.frequency*u+phase)*envelope;
  return v(base.x,y);
}
function drawDeform() {
  clear();gridBackground();const cols=20,rows=8;
  ctx.save();ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(148,175,194,.28)';
  for(let r=0;r<rows;r++)line(v(85,150+r*260/(rows-1)),v(815,150+r*260/(rows-1)),'rgba(148,175,194,.28)');
  for(let c=0;c<cols;c++)line(v(85+c*730/(cols-1),150),v(85+c*730/(cols-1),410),'rgba(148,175,194,.28)');ctx.restore();
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const p=deformPoint(c,r);if(c<cols-1)line(p,deformPoint(c+1,r),'#68e6e8',1.5);if(r<rows-1)line(p,deformPoint(c,r+1),'#68e6e8',1.5);if((r===0||r===rows-1)&&c%2===0)dot(p,3,'#ffd66b');}
  const probe=deformPoint(10,4);dot(probe,7,'#f087bd');line(v(probe.x,280),probe,'#f087bd',1);text('同一个 u,v 顶点被公式重算坐标',v(probe.x+12,probe.y-12),'#f6b4d3',11);
  const {amplitude,frequency,phase}=state.deform;ui.matrix.textContent=`u = 10 / 19 = 0.53\nv = 4 / 7 = 0.57\ny' = y + A·sin(2πfu+φ)·sin(πv)\nA=${fmt(amplitude)}, f=${fmt(frequency)}, φ=${fmt(phase)}\nprobe y' = ${fmt(probe.y)}`;
}
function bonePositions() { const root=v(160,360), l1=185,l2=150,a0=rad(state.skeleton.shoulder),a1=rad(state.skeleton.elbow);const joint=add(root,rotate(v(l1,0),a0));const end=add(joint,rotate(v(l2,0),a0+a1));return {root,joint,end,l1,l2,a0,a1}; }
function skinnedPoint(bind) { const {root,joint,l1,a0,a1}=bonePositions();const w1=smooth(l1-52,l1+60,bind.x),w0=1-w1;const p0=add(root,rotate(bind,a0));const p1=add(joint,rotate(v(bind.x-l1,bind.y),a0+a1));return {p:add(scale(p0,w0),scale(p1,w1)),w0,w1,p0,p1}; }
function drawSkeleton() {
  clear();gridBackground();const {root,joint,end,l1,l2,a0,a1}=bonePositions();const cols=18,rows=4,total=l1+l2;
  for(let r=0;r<rows-1;r++)for(let c=0;c<cols-1;c++){const bind=(cc,rr)=>v(cc*total/(cols-1),mix(-28,28,rr/(rows-1)));const a=skinnedPoint(bind(c,r)),b=skinnedPoint(bind(c+1,r)),d=skinnedPoint(bind(c,r+1)),e=skinnedPoint(bind(c+1,r+1));ctx.fillStyle=`hsla(${mix(195,326,(a.w1+b.w1+d.w1+e.w1)/4)},80%,62%,.20)`;ctx.beginPath();ctx.moveTo(a.p.x,a.p.y);ctx.lineTo(b.p.x,b.p.y);ctx.lineTo(e.p.x,e.p.y);ctx.lineTo(d.p.x,d.p.y);ctx.closePath();ctx.fill();line(a.p,b.p,'rgba(220,242,255,.52)');line(a.p,d.p,'rgba(220,242,255,.52)');if(c===cols-2)line(b.p,e.p,'rgba(220,242,255,.52)');if(r===rows-2)line(d.p,e.p,'rgba(220,242,255,.52)');}
  line(root,joint,'#ffd66b',10);line(joint,end,'#f087bd',10);dot(root,11,'#ffe6a0');dot(joint,11,'#ffd0e8');dot(end,10,'#d9fbff');text('bone 0',add(root,v(-22,-22)),'#ffd66b',12);text('bone 1',add(joint,v(10,-18)),'#f087bd',12);
  const probe=skinnedPoint(v(l1+10,0));dot(probe.p,7,'#68e6e8');text(`w0=${fmt(probe.w0)}  w1=${fmt(probe.w1)}`,add(probe.p,v(12,22)),'#a8eff1',11);
  ui.matrix.textContent=`M0 = T(root) · R(${fmt(state.skeleton.shoulder)}°)\nM1 = M0 · T(${l1},0) · R(${fmt(state.skeleton.elbow)}°)\nP' = w0·(M0·P) + w1·(M1·P)\nprobe bind x=${l1+10}: w0=${fmt(probe.w0)}, w1=${fmt(probe.w1)}\nend effector = [${fmt(end.x)}, ${fmt(end.y)}]`;
}
const lessons={
  mesh:{label:'顶点网格 · 拖动任意亮点',hint:'拖动亮色顶点，观察相邻 triangles 怎样跟着改变。',kicker:'01 · MESH',title:'网格不是一张图，它是一组顶点',body:'一个平面由顶点（vertex）和三角形（triangle）组成。你拖动的不是“图片局部”，而是一条顶点坐标；共享这个顶点的所有三角形都会重新铺开。',formula:'Pᵢ = Pᵢ,base + ΔPᵢ',change:'调节网格密度，或拖动一个 vertex。你正在直接修改 mesh 数据。',gpu:'GPU 的 vertex shader 会对每个 vertex 做同类计算；rasterizer 再填满三角形内部。',hack:'二开：给每个 vertex 增加 color 属性，按 displacement 大小改变颜色。'},
  deform:{label:'公式形变 · 灰虚线是 bind pose',hint:'调节振幅与频率。虚线是原始顶点，亮线是同一批顶点经函数重算后的位置。',kicker:'02 · DEFORMATION',title:'形变就是每一帧重算顶点位置',body:'不用逐点手动画动画。只要定义一个输入坐标到输出坐标的函数，渲染循环会在每帧把所有顶点重新计算。例如正弦波用 u 位置、频率和时间相位驱动 y。',formula:"y' = y + A·sin(2π·f·u + φ)·sin(π·v)",change:'改振幅 A、频率 f 或播放时间相位 φ。你在改同一条 vertex function 的参数。',gpu:'在 WebGL 中，这类公式通常就写在 vertex shader，GPU 会并行计算所有顶点。',hack:'二开：把 sin 换成 noise，或同时修改 x，做旗帜、果冻和水面。'},
  skeleton:{label:'骨骼蒙皮 · 拖动末端可做两骨骼 IK',hint:'拖动骨骼末端，或调节肩/肘角度。网格顶点会按 skinning weight 混合两根骨骼的变换。',kicker:'03 · SKELETON',title:'骨骼动画：先动骨头，再混合网格',body:'骨头本身只是变换矩阵。每个 mesh vertex 保存对哪些骨头有多大影响（weight）。最终位置是多个骨头变换后的位置按权重加权求和。',formula:"P' = Σᵢ wᵢ · (Mᵢ · Bᵢ⁻¹ · P)",change:'改肩、肘角度或拖动 end effector。你在改 bone transform，weight 保持不变。',gpu:'实际角色会把 bone matrices 和 weights 上传给 GPU，vertex shader 对每个顶点做 linear blend skinning。',hack:'二开：增加第三根骨头，或把 weight 可视化成可刷的热力图。'}
};
function slider(label,key,min,max,step,value,callback){return `<div class="control-row"><label for="${key}">${label}</label><output id="${key}-out">${value}</output><input id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;}
function renderControls(){const v=state.view;if(v==='mesh'){ui.controls.innerHTML=slider('列数','mesh-cols',3,12,1,state.mesh.cols,0)+slider('行数','mesh-rows',3,9,1,state.mesh.rows,0)+`<button class="control-button" id="mesh-reset">重置所有顶点</button>`;bindRange('mesh-cols',x=>{state.mesh.cols=+x;state.mesh.offsets.clear();});bindRange('mesh-rows',x=>{state.mesh.rows=+x;state.mesh.offsets.clear();});document.querySelector('#mesh-reset').onclick=()=>state.mesh.offsets.clear();}
else if(v==='deform'){ui.controls.innerHTML=slider('振幅 A','amp',0,105,1,state.deform.amplitude,0)+slider('频率 f','freq',.25,3.2,.05,state.deform.frequency,0)+slider('速度','speed',0,3,.05,state.deform.speed,0)+`<button class="control-button" id="deform-reset">重置公式参数</button>`;bindRange('amp',x=>state.deform.amplitude=+x);bindRange('freq',x=>state.deform.frequency=+x);bindRange('speed',x=>state.deform.speed=+x);document.querySelector('#deform-reset').onclick=()=>Object.assign(state.deform,{amplitude:54,frequency:1.35,speed:1.1,phase:0});}
else{ui.controls.innerHTML=slider('肩角 θ₀','shoulder',-135,135,1,state.skeleton.shoulder,'°')+slider('肘角 θ₁','elbow',-145,145,1,state.skeleton.elbow,'°')+`<button class="control-button" id="skeleton-reset">回到教学 pose</button>`;bindRange('shoulder',x=>state.skeleton.shoulder=+x,'°');bindRange('elbow',x=>state.skeleton.elbow=+x,'°');document.querySelector('#skeleton-reset').onclick=()=>Object.assign(state.skeleton,{shoulder:-18,elbow:62});}}
function bindRange(id,fn,suffix=''){const input=document.querySelector(`#${id}`),out=document.querySelector(`#${id}-out`);input.oninput=()=>{fn(input.value);out.textContent=`${input.value}${suffix}`;};}
function setView(view){state.view=view;ui.tabs.forEach(t=>t.classList.toggle('active',t.dataset.view===view));const l=lessons[view];ui.label.textContent=l.label;ui.hint.textContent=l.hint;ui.kicker.textContent=l.kicker;ui.title.textContent=l.title;ui.body.textContent=l.body;ui.formula.textContent=l.formula;ui.change.textContent=l.change;ui.gpu.textContent=l.gpu;ui.hack.textContent=l.hack;renderControls();}
function draw(){if(state.view==='mesh')drawMesh();else if(state.view==='deform')drawDeform();else drawSkeleton();}
function frame(now){const dt=Math.min(.05,(now-state.last)/1000);state.last=now;state.fps=mix(state.fps,1/Math.max(dt,.001),.08);if(state.playing){state.time+=dt;if(state.view==='deform')state.deform.phase+=dt*state.deform.speed;if(state.view==='skeleton'&&state.skeleton.pulse){/* user-driven pose remains stable by design */}}draw();ui.fps.textContent=`${Math.round(state.fps)} fps`;requestAnimationFrame(frame);}
canvas.addEventListener('pointerdown',e=>{const p=logicalPoint(e);if(state.view==='mesh'){let best=null,d=18;for(let r=0;r<state.mesh.rows;r++)for(let c=0;c<state.mesh.cols;c++){const q=meshPoint(c,r),dist=Math.hypot(p.x-q.x,p.y-q.y);if(dist<d){d=dist;best={c,r,q};}}if(best){state.drag={kind:'mesh',...best,start:p,offset:state.mesh.offsets.get(`${best.c}:${best.r}`)||v(0,0)};canvas.setPointerCapture(e.pointerId);}}else if(state.view==='skeleton'){state.drag={kind:'ik'};canvas.setPointerCapture(e.pointerId);applyIK(p);}});
canvas.addEventListener('pointermove',e=>{if(!state.drag)return;const p=logicalPoint(e);if(state.drag.kind==='mesh'){const {c,r,start,offset}=state.drag;state.mesh.offsets.set(`${c}:${r}`,add(offset,sub(p,start)));}else applyIK(p);});
canvas.addEventListener('pointerup',()=>state.drag=null);canvas.addEventListener('pointercancel',()=>state.drag=null);
function applyIK(target){const {root,l1,l2}=bonePositions();const local=sub(target,root),d=clamp(Math.hypot(local.x,local.y),20,l1+l2-2);const elbow=Math.acos(clamp((d*d-l1*l1-l2*l2)/(2*l1*l2),-1,1));const shoulder=Math.atan2(local.y,local.x)-Math.atan2(l2*Math.sin(elbow),l1+l2*Math.cos(elbow));state.skeleton.shoulder=shoulder*180/Math.PI;state.skeleton.elbow=elbow*180/Math.PI;const a=document.querySelector('#shoulder'),b=document.querySelector('#elbow');if(a){a.value=state.skeleton.shoulder;document.querySelector('#shoulder-out').textContent=`${Math.round(state.skeleton.shoulder)}°`;}if(b){b.value=state.skeleton.elbow;document.querySelector('#elbow-out').textContent=`${Math.round(state.skeleton.elbow)}°`;}}
ui.tabs.forEach(tab=>tab.addEventListener('click',()=>setView(tab.dataset.view)));ui.play.onclick=()=>{state.playing=!state.playing;ui.play.textContent=state.playing?'暂停动效':'播放动效';};
setView('mesh');requestAnimationFrame(frame);
