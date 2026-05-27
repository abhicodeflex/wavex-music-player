'use strict';

// ══════════════════════════════════════
// SPLASH SCREEN
// ══════════════════════════════════════
const splashScreen = document.getElementById('splashScreen');


// ── CLOCK
(function clk(){const n=new Date(),p=v=>String(v).padStart(2,'0');document.getElementById('clock').textContent=p(n.getHours())+':'+p(n.getMinutes())+':'+p(n.getSeconds());setTimeout(clk,1000);})();

function mpSs(m){document.getElementById('mp-sb').textContent='● '+m;}
function fmt(s){s=Math.round(s||0);return Math.floor(s/60)+':'+(String(s%60).padStart(2,'0'));}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

// ── TAB SWITCH ────────────────────────────────────────────────────────
let activeTab='music';
function switchTab(tab){
  activeTab=tab;
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+tab).classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');

  document.getElementById("tab-music").onclick = () => switchTab('music');
document.getElementById("tab-voice").onclick = () => switchTab('voice');
}

// ── SHARED MODAL ─────────────────────────────────────────────────────
let modalCb=null;
function openModal(title,def,okLabel,cb){
  document.getElementById('mlbl').textContent=title;
  document.getElementById('mok').textContent=okLabel||'Save';
  document.getElementById('minp').value=def||'';
  modalCb=cb;
  document.getElementById('mover').style.display='flex';
  setTimeout(()=>document.getElementById('minp').focus(),80);
}
function closeModal(){document.getElementById('mover').style.display='none';modalCb=null;}
function submitModal(){
  const v=document.getElementById('minp').value.trim();
  if(!v){document.getElementById('minp').focus();return;}
  const cb=modalCb;closeModal();if(cb)cb(v);
}
document.getElementById('mok').onclick=submitModal;
document.getElementById('mcancel').onclick=closeModal;
document.getElementById('minp').onkeydown=e=>{if(e.key==='Enter')submitModal();if(e.key==='Escape')closeModal();};
document.getElementById('mover').onclick=e=>{if(e.target===document.getElementById('mover'))closeModal();};

// ══════════════════════════════════════════
// BACKGROUND CANVAS (shared)
// ══════════════════════════════════════════
const bgC=document.getElementById('bg'),bgG=bgC.getContext('2d');
let W,H,bgT=0;
let sV=0,sB=0,sM=0,sT=0;
// voice analyser hook
let wallAn2=null,wallDat2=null,micActive2=false;
function rzBg(){W=bgC.width=window.innerWidth;H=bgC.height=window.innerHeight;}
rzBg();window.addEventListener('resize',rzBg);
const pts=[];for(let i=0;i<70;i++)pts.push({a:Math.random()*Math.PI*2,r:60+Math.random()*240,sp:(Math.random()-.5)*.003,sz:Math.random()*2+.5});

// music analyser shared refs
let wallAn=null,wallDat=null;
// music player state refs needed by drawWv (declared here to avoid TDZ error)
let pAn=null,pDat=null,isPlay=false;

function gwA(){
  const an = activeTab==='voice'?(wallAn2):(wallAn);
  const dt = activeTab==='voice'?(wallDat2):(wallDat);
  if(!an||!dt)return;
  an.getByteFrequencyData(dt);
  const l=dt.length;let b=0,m=0,t=0,tot=0;
  for(let i=0;i<l;i++){tot+=dt[i];if(i<l*.05)b+=dt[i];else if(i<l*.2)m+=dt[i];else t+=dt[i];}
  const lp=.15;
  sV+=(tot/(l*255)-sV)*lp;sB+=(b/(l*.05*255)-sB)*lp;sM+=(m/(l*.15*255)-sM)*lp;sT+=(t/(l*.8*255)-sT)*lp;
}

function drawBg(){
  gwA();
  bgG.clearRect(0,0,W,H);bgG.fillStyle='#000810';bgG.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,sc=Math.min(W,H)/520;
  bgG.save();bgG.translate(cx,cy);bgG.scale(sc,sc);
  const T=bgT*.012,vb=sB,vm=sM,vt=sT,vv=sV;
  const bgl=bgG.createRadialGradient(0,0,0,0,0,280+vb*120);bgl.addColorStop(0,`rgba(0,${40+Math.round(vb*60)},${60+Math.round(vb*80)},${.5+vb*.4})`);bgl.addColorStop(1,'rgba(0,0,0,0)');bgG.fillStyle=bgl;bgG.beginPath();bgG.arc(0,0,280+vb*120,0,Math.PI*2);bgG.fill();
  bgG.strokeStyle=`rgba(0,180,170,${.04+vv*.07})`;bgG.lineWidth=.5;for(let x=-420;x<=420;x+=42){bgG.beginPath();bgG.moveTo(x,-420);bgG.lineTo(x,420);bgG.stroke();}for(let y=-420;y<=420;y+=42){bgG.beginPath();bgG.moveTo(-420,y);bgG.lineTo(420,y);bgG.stroke();}
  const activeAn=activeTab==='voice'?wallAn2:wallAn;const activeData=activeTab==='voice'?wallDat2:wallDat;
  if(activeAn&&activeData){for(let i=0;i<64;i++){const ang=(i/64)*Math.PI*2-Math.PI/2,val=activeData[Math.floor(i*activeData.length/64)]/255;bgG.strokeStyle=`rgba(0,${180+Math.round(val*75)},${170+Math.round(val*85)},${.35+val*.55})`;bgG.lineWidth=2.5;bgG.lineCap='round';bgG.beginPath();bgG.moveTo(Math.cos(ang)*215,Math.sin(ang)*215);bgG.lineTo(Math.cos(ang)*(215+val*90),Math.sin(ang)*(215+val*90));bgG.stroke();}}
  for(let i=0;i<48;i++){const ang=(i/48)*Math.PI*2+T*(.25+vm*1.5),len=10+vb*18;bgG.strokeStyle=`rgba(0,215,205,${Math.min(1,.35+.3*Math.sin(T*3+i*.35)+vb*.4)})`;bgG.lineWidth=2+vb*2;bgG.lineCap='round';bgG.beginPath();bgG.moveTo(Math.cos(ang)*(200-len/2),Math.sin(ang)*(200-len/2));bgG.lineTo(Math.cos(ang)*(200+len/2),Math.sin(ang)*(200+len/2));bgG.stroke();}
  bgG.strokeStyle=`rgba(0,200,190,${.12+vb*.4})`;bgG.lineWidth=1+vb*2;bgG.beginPath();bgG.arc(0,0,185+vb*15,0,Math.PI*2);bgG.stroke();
  for(let i=0;i<10;i++){const sa=(i/10)*Math.PI*2-T*(.5+vm*2),ea=sa+(Math.PI*2/10)*(.62+vm*.3);bgG.strokeStyle=`rgba(0,210,200,${Math.min(1,.5+.35*Math.sin(T*1.8+i*.7)+vm*.4)})`;bgG.lineWidth=3+vm*3;bgG.lineCap='round';bgG.beginPath();bgG.arc(0,0,168+vm*12,sa,ea);bgG.stroke();}
  bgG.strokeStyle=`rgba(0,190,180,${.15+vm*.25})`;bgG.lineWidth=.8;bgG.beginPath();bgG.arc(0,0,148,0,Math.PI*2);bgG.stroke();
  for(let i=0;i<7;i++){const sa=(i/7)*Math.PI*2+T*(.65+vt*2.5),ea=sa+(Math.PI*2/7)*(.55+vt*.3);bgG.strokeStyle=`rgba(60,235,225,${Math.min(1,.42+.4*Math.sin(T*2+i)+vt*.5)})`;bgG.lineWidth=2+vt*2;bgG.lineCap='round';bgG.beginPath();bgG.arc(0,0,135+vt*10,sa,ea);bgG.stroke();}
  for(let i=0;i<30;i++){const ang=(i/30)*Math.PI*2-T*.22,isL=i%5===0,r1=118,r2=r1+(isL?12+vv*20:6+vv*8);bgG.strokeStyle=`rgba(0,210,200,${isL?.8+vv*.15:.25+vv*.3})`;bgG.lineWidth=isL?2:1;bgG.lineCap='round';bgG.beginPath();bgG.moveTo(Math.cos(ang)*r1,Math.sin(ang)*r1);bgG.lineTo(Math.cos(ang)*r2,Math.sin(ang)*r2);bgG.stroke();}
  for(let i=0;i<5;i++){const sa=(i/5)*Math.PI*2+T*(1.1+vt*3),ea=sa+(Math.PI*2/5)*(.45+vt*.4);bgG.strokeStyle=`rgba(120,245,235,${Math.min(1,.38+.4*Math.sin(T*2.5+i*1.2)+vt*.4)})`;bgG.lineWidth=1.5+vt*2;bgG.lineCap='round';bgG.beginPath();bgG.arc(0,0,105,sa,ea);bgG.stroke();}
  bgG.strokeStyle='rgba(0,195,185,0.1)';bgG.lineWidth=.8;bgG.beginPath();bgG.arc(0,0,88,0,Math.PI*2);bgG.stroke();
  for(let i=0;i<6;i++){const ang=T*(1.3+vv*4)+(i*Math.PI*2/6),r=96+14*Math.sin(T*3.5+i)+vb*30,x=Math.cos(ang)*r,y=Math.sin(ang)*r,al=Math.min(1,.5+.5*Math.abs(Math.sin(T*4+i))+vv*.3);bgG.fillStyle=`rgba(100,255,240,${al})`;bgG.beginPath();bgG.arc(x,y,2.5+vv*4,0,Math.PI*2);bgG.fill();}
  const pulse=(.86+.14*Math.sin(T*2.8))*(1+vb*.5),cr=(62+vb*40)*pulse;
  const og=bgG.createRadialGradient(0,0,0,0,0,cr*2.8);og.addColorStop(0,`rgba(0,230,215,${(.2+vb*.4)*pulse})`);og.addColorStop(.5,`rgba(0,180,170,${(.07+vb*.2)*pulse})`);og.addColorStop(1,'rgba(0,0,0,0)');bgG.fillStyle=og;bgG.beginPath();bgG.arc(0,0,cr*2.8,0,Math.PI*2);bgG.fill();
  const mg=bgG.createRadialGradient(0,0,0,0,0,cr*1.6);mg.addColorStop(0,`rgba(150,255,248,${(.28+vb*.5)*pulse})`);mg.addColorStop(1,'rgba(0,0,0,0)');bgG.fillStyle=mg;bgG.beginPath();bgG.arc(0,0,cr*1.6,0,Math.PI*2);bgG.fill();
  const cf=bgG.createRadialGradient(-12,-12,0,0,0,cr);cf.addColorStop(0,`rgba(240,255,254,${Math.min(1,.98*pulse)})`);cf.addColorStop(.4,`rgba(${160+Math.round(vb*95)},250,244,${Math.min(1,.75*pulse)})`);cf.addColorStop(.8,`rgba(0,${190+Math.round(vb*65)},${180+Math.round(vb*75)},${.35*pulse})`);cf.addColorStop(1,`rgba(0,100,90,${.1*pulse})`);bgG.fillStyle=cf;bgG.beginPath();bgG.arc(0,0,cr,0,Math.PI*2);bgG.fill();
  bgG.strokeStyle=`rgba(0,235,220,${Math.min(1,.75*pulse+vb*.5)})`;bgG.lineWidth=2+vb*3;bgG.beginPath();bgG.arc(0,0,cr,0,Math.PI*2);bgG.stroke();
  pts.forEach(p=>{p.a+=p.sp*(1+sT*3);const al=Math.min(1,.12+.4*Math.abs(Math.sin(T*1.5+p.a))+sT*.3);bgG.fillStyle=`rgba(0,220,210,${al})`;bgG.beginPath();bgG.arc(Math.cos(p.a)*p.r,Math.sin(p.a)*p.r,p.sz*(1+sT*2),0,Math.PI*2);bgG.fill();});
  const bSz=195+vv*20;bgG.strokeStyle=`rgba(0,200,190,${.3+vv*.4})`;bgG.lineWidth=1.5;bgG.lineCap='square';
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{const bx=sx*bSz,by=sy*bSz,bl=24+vb*12;bgG.beginPath();bgG.moveTo(bx+sx*-bl,by);bgG.lineTo(bx,by);bgG.lineTo(bx,by+sy*-bl);bgG.stroke();});
  const sy2=((T*35)%460)-230,sg=bgG.createLinearGradient(-230,sy2,230,sy2);sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(.4,`rgba(0,210,200,${.06+vv*.09})`);sg.addColorStop(.6,`rgba(0,210,200,${.06+vv*.09})`);sg.addColorStop(1,'rgba(0,0,0,0)');bgG.fillStyle=sg;bgG.fillRect(-230,sy2-1,460,2);bgG.restore();
  const vig=bgG.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.75);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,`rgba(0,4,12,${.75-vv*.2})`);bgG.fillStyle=vig;bgG.fillRect(0,0,W,H);
  bgT++;requestAnimationFrame(drawBg);
}
drawBg();

// ── ARC CANVAS ────────────────────────────────────────────────────────
const arcC=document.getElementById('arc'),arcG=arcC.getContext('2d');
let arcT=0;
function drawArc(){
  const CW=196,CH=196,cx=98,cy=98;arcG.clearRect(0,0,CW,CH);
  const T=arcT*.012,vb=sB,vm=sM,vt=sT;
  const bg2=arcG.createRadialGradient(cx,cy,0,cx,cy,86+vb*35);bg2.addColorStop(0,`rgba(0,${30+Math.round(vb*50)},${50+Math.round(vb*60)},${.4+vb*.3})`);bg2.addColorStop(1,'rgba(0,0,0,0)');arcG.fillStyle=bg2;arcG.beginPath();arcG.arc(cx,cy,86+vb*35,0,Math.PI*2);arcG.fill();
  for(let i=0;i<32;i++){const ang=(i/32)*Math.PI*2+T*(.25+vm*1.5),r=90,len=5+vb*12;arcG.strokeStyle=`rgba(0,215,205,${Math.min(1,.35+.3*Math.sin(T*3+i*.4)+vb*.4)})`;arcG.lineWidth=2;arcG.lineCap='round';arcG.beginPath();arcG.moveTo(Math.cos(ang)*(r-len/2)+cx,Math.sin(ang)*(r-len/2)+cy);arcG.lineTo(Math.cos(ang)*(r+len/2)+cx,Math.sin(ang)*(r+len/2)+cy);arcG.stroke();}
  for(let i=0;i<6;i++){const sa=(i/6)*Math.PI*2-T*(.5+vm*2),ea=sa+(Math.PI*2/6)*(.62+vm*.3);arcG.strokeStyle=`rgba(0,210,200,${Math.min(1,.55+.3*Math.sin(T*1.8+i*.7)+vm*.4)})`;arcG.lineWidth=2.5+vm*2;arcG.lineCap='round';arcG.beginPath();arcG.arc(cx,cy,75+vm*8,sa,ea);arcG.stroke();}
  for(let i=0;i<5;i++){const sa=(i/5)*Math.PI*2+T*(.65+vt*2.5),ea=sa+(Math.PI*2/5)*(.55+vt*.3);arcG.strokeStyle=`rgba(60,235,225,${Math.min(1,.42+.35*Math.sin(T*2+i)+vt*.5)})`;arcG.lineWidth=1.5+vt*2;arcG.lineCap='round';arcG.beginPath();arcG.arc(cx,cy,61+vt*7,sa,ea);arcG.stroke();}
  const pulse=(.86+.14*Math.sin(T*2.8))*(1+vb*.5),cr=(25+vb*15)*pulse;
  const og2=arcG.createRadialGradient(cx,cy,0,cx,cy,cr*2.5);og2.addColorStop(0,`rgba(0,230,215,${(.2+vb*.4)*pulse})`);og2.addColorStop(1,'rgba(0,0,0,0)');arcG.fillStyle=og2;arcG.beginPath();arcG.arc(cx,cy,cr*2.5,0,Math.PI*2);arcG.fill();
  const cf2=arcG.createRadialGradient(cx-5,cy-5,0,cx,cy,cr);cf2.addColorStop(0,`rgba(240,255,254,${Math.min(1,.98*pulse)})`);cf2.addColorStop(.5,`rgba(${160+Math.round(vb*95)},250,244,${Math.min(1,.7*pulse)})`);cf2.addColorStop(1,`rgba(0,${190+Math.round(vb*65)},180,${.3*pulse})`);arcG.fillStyle=cf2;arcG.beginPath();arcG.arc(cx,cy,cr,0,Math.PI*2);arcG.fill();
  arcG.strokeStyle=`rgba(0,235,220,${Math.min(1,.75*pulse+vb*.4)})`;arcG.lineWidth=1.5;arcG.beginPath();arcG.arc(cx,cy,cr,0,Math.PI*2);arcG.stroke();
  arcT++;requestAnimationFrame(drawArc);
}
drawArc();

// ── WAVEFORM ──────────────────────────────────────────────────────────
const wvC=document.getElementById('wv'),wvG=wvC.getContext('2d');
const wvH=new Array(200).fill(0);
function drawWv(){
  const WW=wvC.offsetWidth||400,WH=44;wvC.width=WW;wvG.clearRect(0,0,WW,WH);
  let val=0;if(pAn&&pDat){pAn.getByteFrequencyData(pDat);let s=0;for(let i=0;i<pDat.length;i++)s+=pDat[i];val=s/(pDat.length*255);}
  wvH.push(.06+val*(isPlay?1:.15)+Math.random()*.01);wvH.shift();
  wvG.strokeStyle='rgba(0,220,200,0.6)';wvG.lineWidth=1.5;wvG.lineCap='round';wvG.beginPath();
  for(let i=0;i<wvH.length;i++){const x=(i/wvH.length)*WW,y=WH/2-wvH[i]*(WH*.44);i===0?wvG.moveTo(x,y):wvG.lineTo(x,y);}
  wvG.stroke();wvG.strokeStyle='rgba(0,100,90,0.2)';wvG.lineWidth=.5;wvG.beginPath();wvG.moveTo(0,WH/2);wvG.lineTo(WW,WH/2);wvG.stroke();
  requestAnimationFrame(drawWv);
}
drawWv();

// ══════════════════════════════════════════
// MUSIC PLAYER ENGINE
// ══════════════════════════════════════════
let DB=null;
function initDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open('JarvisMusic5',1);
    req.onerror=()=>reject(req.error);
    req.onupgradeneeded=(e)=>{const d=e.target.result;if(!d.objectStoreNames.contains('playlists'))d.createObjectStore('playlists',{keyPath:'id',autoIncrement:true});if(!d.objectStoreNames.contains('tracks'))d.createObjectStore('tracks',{keyPath:'id',autoIncrement:true});};
    req.onsuccess=(e)=>{DB=e.target.result;resolve(DB);};
  });
}
function dbAdd(store,data){return new Promise((res,rej)=>{const tx=DB.transaction([store],'readwrite'),s=tx.objectStore(store),r=s.add(data);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function dbPut(store,data){return new Promise((res,rej)=>{const tx=DB.transaction([store],'readwrite'),s=tx.objectStore(store),r=s.put(data);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function dbDelete(store,id){return new Promise((res,rej)=>{const tx=DB.transaction([store],'readwrite'),s=tx.objectStore(store),r=s.delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error);});}
function dbGetAll(store){return new Promise((res,rej)=>{const tx=DB.transaction([store],'readonly'),s=tx.objectStore(store),r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}

let playlists=[],tracks=[],activePl=null,curTr=null;
let aud=null,actx=null,gainN=null,srcN=null;
let isShuffle=false,isRepeat=false;

// ── PANEL TOGGLE & RESIZE
const panelState={pl:{collapsed:false,width:190},tr:{collapsed:false,width:220}};
function togglePanel(which){panelState[which].collapsed=!panelState[which].collapsed;applyPanelState(which);document.getElementById('tog-'+which).classList.toggle('active',!panelState[which].collapsed);}
function expandPanel(which){panelState[which].collapsed=false;applyPanelState(which);document.getElementById('tog-'+which).classList.add('active');}
function applyPanelState(which){
  const col=document.getElementById(which+'-col'),rh=document.getElementById('rh-'+which),state=panelState[which];
  if(state.collapsed){col.classList.add('collapsed');col.style.width='32px';col.style.minWidth='32px';if(rh)rh.style.display='none';}
  else{col.classList.remove('collapsed');col.style.width=state.width+'px';col.style.minWidth=state.width+'px';if(rh)rh.style.display='';}
}
document.getElementById('tog-pl').onclick=()=>togglePanel('pl');
document.getElementById('tog-tr').onclick=()=>togglePanel('tr');


function initResize(handleId,which){
  const handle=document.getElementById(handleId);
  handle.addEventListener('mousedown',(e)=>{
    e.preventDefault();const startX=e.clientX,startW=panelState[which].width;handle.classList.add('dragging');
    function onMove(ev){const delta=ev.clientX-startX,newW=Math.max(130,Math.min(420,startW+delta));panelState[which].width=newW;const col=document.getElementById(which+'-col');col.style.width=newW+'px';col.style.minWidth=newW+'px';}
    function onUp(){handle.classList.remove('dragging');window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);}
    window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);
  });
}
initResize('rh-pl','pl');initResize('rh-tr','tr');

// ── PLAYLIST UI
document.getElementById('btn-newpl').onclick=()=>{openModal('New Playlist','','Create',async name=>{try{const id=await dbAdd('playlists',{name});playlists.push({id,name});renderPlaylists();selectPlaylist(id);mpSs('Created: '+name);}catch(e){mpSs('Error: '+e.message);}});};

// Example of adding a track to a playlist

function renderPlaylists(){
  const el=document.getElementById('pl-list');el.innerHTML='';
  if(!playlists.length){el.innerHTML='<div class="hint">No playlists yet<br>Click + New above</div>';return;}
  playlists.forEach(pl=>{
    const cnt=tracks.filter(t=>t.plId===pl.id).length;
    const d=document.createElement('div');d.className='pli'+(pl.id===activePl?' sel':'');
    d.innerHTML=`<span class="pli-icon">♫</span><div class="pinfo"><div class="pn">${esc(pl.name)}</div><div class="pc">${cnt} track${cnt!==1?'s':''}</div></div><div class="pacts"><button class="pact" data-act="rename" data-id="${pl.id}" title="Rename">✎</button><button class="pact del" data-act="delete" data-id="${pl.id}" title="Delete">✕</button></div>`;
    d.onclick=e=>{
      const btn=e.target.closest('[data-act]');
      if(btn){e.stopPropagation();if(btn.dataset.act==='rename'){openModal('Rename Playlist',pl.name,'Save',async newName=>{pl.name=newName;await dbPut('playlists',{id:pl.id,name:pl.name});renderPlaylists();if(activePl===pl.id)document.getElementById('tr-title').textContent=newName;mpSs('Renamed to: '+newName);});}else{deletePl(pl.id,pl.name);}}
      else selectPlaylist(pl.id);
    };
    el.appendChild(d);
  });
}


async function deletePl(id,name){
  if(!confirm(`Delete "${name}"?\nAll songs inside will be removed.`))return;
  const toRemove=tracks.filter(t=>t.plId===id);
  for(const t of toRemove){if(t.blobURL)URL.revokeObjectURL(t.blobURL);await dbDelete('tracks',t.id);}
  tracks=tracks.filter(t=>t.plId!==id);
  await dbDelete('playlists',id);playlists=playlists.filter(p=>p.id!==id);
  if(activePl===id){activePl=null;document.getElementById('tr-title').textContent='Select playlist';document.getElementById('btn-add').disabled=true;renderTracks();}
  renderPlaylists();mpSs('Deleted playlist');
}

function selectPlaylist(id){
  activePl=id;const pl=playlists.find(p=>p.id===id);
  document.getElementById('tr-title').textContent=pl?pl.name:'—';
  document.getElementById('btn-add').disabled=false;
  renderPlaylists();renderTracks();
}

// ── TRACK UI
function renderTracks(){
  const el=document.getElementById('tr-list');el.innerHTML='';
  if(!activePl){el.innerHTML='<div class="hint">← Select a playlist first</div>';return;}
  const list=tracks.filter(t=>t.plId===activePl);
  if(!list.length){el.innerHTML='<div class="hint">No songs yet<br>Click Add to import</div>';return;}
  list.forEach((tr,i)=>{
    const d=document.createElement('div');d.className='tri'+(tr.id===curTr?' sel':'');
    d.innerHTML=`<span class="tnum">${i+1}</span><div class="teq"><span class="eb"></span><span class="eb"></span><span class="eb"></span></div><div class="tinfo"><div class="tn">${esc(tr.name)}</div><div class="ta">${esc(tr.artist||'Unknown')}</div></div><span class="td">${fmt(tr.dur)}</span><button class="trm" data-id="${tr.id}" title="Remove">✕</button>`;
    d.onclick=e=>{if(e.target.closest('.trm')){e.stopPropagation();removeTrack(tr.id);return;}loadTrack(tr.id,true);};
    el.appendChild(d);
  });
}
// track
document.getElementById('btn-add').onclick=()=>{if(activePl)document.getElementById('fin').click();};
document.getElementById('fin').onchange=async e=>{
  if(!activePl){mpSs('Select a playlist first!');e.target.value='';return;}
  const files=Array.from(e.target.files);if(!files.length)return;
  mpSs(`Importing ${files.length} file${files.length!==1?'s':''}...`);
  for(const f of files){try{const ab=await f.arrayBuffer();const blob=new Blob([ab],{type:f.type});const blobURL=URL.createObjectURL(blob);const name=f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();const dur=await getDuration(blobURL);const data={plId:activePl,name,artist:'',dur,fileData:ab,fileType:f.type};const newId=await dbAdd('tracks',data);data.id=newId;data.blobURL=blobURL;tracks.push(data);renderTracks();renderPlaylists();}catch(err){mpSs('Import error: '+err.message);}}
  mpSs(`Done — ${files.length} track${files.length!==1?'s':''} added`);e.target.value='';
};
function getDuration(url){return new Promise(r=>{const a=new Audio(url);a.onloadedmetadata=()=>r(a.duration);a.onerror=()=>r(0);});}

async function removeTrack(id){
  const tr=tracks.find(t=>t.id===id);if(!tr)return;
  if(tr.blobURL)URL.revokeObjectURL(tr.blobURL);
  await dbDelete('tracks',id);tracks=tracks.filter(t=>t.id!==id);
  if(curTr===id){stopAudio();document.getElementById('pcont').style.display='none';document.getElementById('empty').style.display='flex';}
  renderTracks();renderPlaylists();mpSs('Track removed');
}

// ── AUDIO ENGINE
function initCtx(){if(actx)return;actx=new(window.AudioContext||window.webkitAudioContext)();gainN=actx.createGain();gainN.gain.value=parseFloat(document.getElementById('vl').value);gainN.connect(actx.destination);}
function stopAudio(){if(aud){aud.pause();aud=null;}if(srcN){try{srcN.disconnect();}catch(e){}srcN=null;}wallAn=null;pAn=null;pDat=null;isPlay=false;curTr=null;document.getElementById('pico').textContent='▶';document.getElementById('bpl').classList.remove('on');}

function loadTrack(id,autoplay){
  const tr=tracks.find(t=>t.id===id);if(!tr)return;
  stopAudio();curTr=id;
  aud=new Audio(tr.blobURL);aud.volume=parseFloat(document.getElementById('vl').value);
  initCtx();
  pAn=actx.createAnalyser();pAn.fftSize=1024;pAn.smoothingTimeConstant=0.8;pDat=new Uint8Array(pAn.frequencyBinCount);
  try{srcN=actx.createMediaElementSource(aud);srcN.connect(pAn);pAn.connect(gainN);wallAn=pAn;wallDat=pDat;}catch(e){wallAn=null;}
  aud.ontimeupdate=()=>{if(!aud||!aud.duration)return;document.getElementById('pgf').style.width=(aud.currentTime/aud.duration*100)+'%';document.getElementById('ptc').textContent=fmt(aud.currentTime);};
  aud.onended=onTrackEnd;
  const pl=playlists.find(p=>p.id===tr.plId);
  document.getElementById('npt').textContent=tr.name;document.getElementById('npa').textContent=tr.artist||'Unknown';
  document.getElementById('atn').textContent=tr.name;document.getElementById('ata').textContent=tr.artist||'';document.getElementById('atp').textContent=pl?pl.name:'';
  document.getElementById('ptt').textContent=fmt(tr.dur);document.getElementById('pgf').style.width='0%';document.getElementById('ptc').textContent='0:00';
  document.getElementById('empty').style.display='none';document.getElementById('pcont').style.display='flex';
  renderTracks();mpSs('▶ '+tr.name+(pl?' — '+pl.name:''));
  if(autoplay)doPlay();
}
function onTrackEnd(){if(isRepeat){if(aud){aud.currentTime=0;aud.play();}return;}const list=tracks.filter(t=>t.plId===activePl);if(!list.length)return;let idx=list.findIndex(t=>t.id===curTr);idx=isShuffle?Math.floor(Math.random()*list.length):idx+1;if(idx>=list.length){isPlay=false;document.getElementById('pico').textContent='▶';document.getElementById('bpl').classList.remove('on');return;}loadTrack(list[idx].id,true);}
function doPlay(){if(!aud)return;if(actx&&actx.state==='suspended')actx.resume();aud.play();isPlay=true;document.getElementById('pico').textContent='⏸';document.getElementById('bpl').classList.add('on');}
function doPause(){if(!aud)return;aud.pause();isPlay=false;document.getElementById('pico').textContent='▶';document.getElementById('bpl').classList.remove('on');mpSs('Paused');}

document.getElementById('bpl').onclick=()=>{if(!curTr){const list=activePl?tracks.filter(t=>t.plId===activePl):[];if(list.length)loadTrack(list[0].id,true);return;}isPlay?doPause():doPlay();};
document.getElementById('bpr').onclick=()=>{const list=tracks.filter(t=>t.plId===activePl);if(!list.length)return;let idx=list.findIndex(t=>t.id===curTr);idx=isShuffle?Math.floor(Math.random()*list.length):Math.max(0,idx-1);loadTrack(list[idx].id,isPlay);};
document.getElementById('bnx').onclick=()=>{const list=tracks.filter(t=>t.plId===activePl);if(!list.length)return;let idx=list.findIndex(t=>t.id===curTr);idx=isShuffle?Math.floor(Math.random()*list.length):Math.min(list.length-1,idx+1);loadTrack(list[idx].id,isPlay);};
document.getElementById('bsh').onclick=()=>{isShuffle=!isShuffle;document.getElementById('bsh').classList.toggle('on',isShuffle);};
document.getElementById('brp').onclick=()=>{isRepeat=!isRepeat;document.getElementById('brp').classList.toggle('on',isRepeat);};
document.getElementById('vl').oninput=e=>{const v=parseFloat(e.target.value);if(gainN)gainN.gain.value=v;if(aud)aud.volume=v;};
document.getElementById('pgb').onclick=e=>{if(!aud||!aud.duration)return;const r=document.getElementById('pgb').getBoundingClientRect();aud.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*aud.duration;};

// ── BOOT
async function boot(){
  try{
    await initDB();mpSs('Database connected...');
    playlists=await dbGetAll('playlists');
    const rawTracks=await dbGetAll('tracks');
    for(const t of rawTracks){if(t.fileData&&t.fileType){const blob=new Blob([t.fileData],{type:t.fileType});t.blobURL=URL.createObjectURL(blob);}tracks.push(t);}
    renderPlaylists();
    if(playlists.length>0)selectPlaylist(playlists[0].id);
    mpSs(`Ready — ${playlists.length} playlist${playlists.length!==1?'s':''}, ${tracks.length} track${tracks.length!==1?'s':''} loaded`);
  }catch(e){mpSs('Storage error: '+e.message);}
}
boot();

// ══════════════════════════════════════════
// VOICE RECORDER ENGINE
// ══════════════════════════════════════════
let mediaRec=null,chunks=[],recStream=null,recAudioCtx=null;
let recInterval=null,recSecs=0,currentBlob=null,currentAudio=null;
let isPlaying2=false,isRecording=false,messages=[],msgCount=0,playingAudio=null;

function fmtV(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}

document.getElementById('start-btn').addEventListener('click',async()=>{
  const btn=document.getElementById('start-btn');
  btn.textContent='Connecting...';btn.disabled=true;
  try{
    recStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    recAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
    wallAn2=recAudioCtx.createAnalyser();wallAn2.fftSize=1024;wallAn2.smoothingTimeConstant=0.75;
    wallDat2=new Uint8Array(wallAn2.frequencyBinCount);
    const micSrc=recAudioCtx.createMediaStreamSource(recStream);
    micSrc.connect(wallAn2);
    micActive2=true;
    document.getElementById('vr-init').style.display='none';
    document.getElementById('vr-active').style.display='flex';
    document.getElementById('rec-status').textContent='Mic active — press Record';
    // Re-enable rec button (it starts disabled)
    document.getElementById('btn-rec').disabled=false;
  }catch(e){
    btn.textContent='MIC DENIED — RETRY';btn.disabled=false;
    console.error('Mic error:',e);
  }
});

function startRecording(){
  if(!recStream){document.getElementById('rec-status').textContent='No mic stream!';return;}
  // Stop any previous recording
  if(mediaRec&&mediaRec.state!=='inactive'){mediaRec.stop();}
  clearInterval(recInterval);
  chunks=[];
  // Pick best supported mime type
  const mimeType=['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/mp4'].find(t=>{try{return MediaRecorder.isTypeSupported(t);}catch(e){return false;}})||'';
  try{
    mediaRec=new MediaRecorder(recStream,mimeType?{mimeType}:{});
  }catch(e){
    mediaRec=new MediaRecorder(recStream);
  }
  mediaRec.ondataavailable=e=>{if(e.data&&e.data.size>0)chunks.push(e.data);};
  mediaRec.onstop=()=>{
    const type=mediaRec.mimeType||'audio/webm';
    currentBlob=new Blob(chunks,{type});
    document.getElementById('btn-play').disabled=false;
    document.getElementById('btn-save').disabled=false;
    document.getElementById('btn-dl').disabled=false;
    document.getElementById('rec-status').textContent='Recording complete — play or save';
  };
  mediaRec.onerror=e=>{document.getElementById('rec-status').textContent='Recorder error: '+e.error;};
  mediaRec.start(100);
  isRecording=true;recSecs=0;
  document.getElementById('big-timer').textContent='00:00';
  recInterval=setInterval(()=>{recSecs++;document.getElementById('big-timer').textContent=fmtV(recSecs);},1000);
  document.getElementById('btn-rec').disabled=true;
  document.getElementById('btn-stop').disabled=false;
  document.getElementById('btn-play').disabled=true;
  document.getElementById('btn-save').disabled=true;
  document.getElementById('btn-dl').disabled=true;
  document.getElementById('rec-dot').classList.add('pulse');
  document.getElementById('rec-status').textContent='● Recording...';
  document.getElementById('btn-rec').classList.add('active');
  // Reconnect mic to wall analyser so visualizer stays active
  if(recAudioCtx&&recStream){
    try{
      wallAn2=recAudioCtx.createAnalyser();wallAn2.fftSize=1024;wallAn2.smoothingTimeConstant=0.75;
      wallDat2=new Uint8Array(wallAn2.frequencyBinCount);
      const src=recAudioCtx.createMediaStreamSource(recStream);src.connect(wallAn2);
    }catch(e){}
  }
}

document.getElementById('btn-rec').addEventListener('click',()=>{
  if(!recStream){document.getElementById('rec-status').textContent='Please activate mic first!';return;}
  startRecording();
});

document.getElementById('btn-stop').addEventListener('click',()=>{
  if(mediaRec&&mediaRec.state!=='inactive')mediaRec.stop();
  clearInterval(recInterval);isRecording=false;
  document.getElementById('rec-dot').classList.remove('pulse');
  document.getElementById('btn-rec').classList.remove('active');
  document.getElementById('btn-rec').disabled=false;document.getElementById('btn-stop').disabled=true;
  document.getElementById('rec-status').textContent='Stopped';
});

function playCurrentBlob(){
  if(!currentBlob)return;
  if(currentAudio){currentAudio.pause();currentAudio=null;}
  const url=URL.createObjectURL(currentBlob);currentAudio=new Audio(url);
  if(!recAudioCtx)recAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
  wallAn2=recAudioCtx.createAnalyser();wallAn2.fftSize=1024;wallAn2.smoothingTimeConstant=0.75;wallDat2=new Uint8Array(wallAn2.frequencyBinCount);
  try{const src=recAudioCtx.createMediaElementSource(currentAudio);src.connect(wallAn2);wallAn2.connect(recAudioCtx.destination);}catch(e){currentAudio.volume=1;}
  isPlaying2=true;document.getElementById('play-icon').className='ti ti-player-pause';document.getElementById('btn-play').classList.add('active');
  document.getElementById('rec-status').textContent='Playing...';
  currentAudio.ontimeupdate=()=>{if(currentAudio.duration){document.getElementById('prog-fill').style.width=(currentAudio.currentTime/currentAudio.duration*100)+'%';document.getElementById('big-timer').textContent=fmtV(Math.round(currentAudio.currentTime));}};
  currentAudio.onended=()=>{isPlaying2=false;document.getElementById('play-icon').className='ti ti-player-play';document.getElementById('btn-play').classList.remove('active');document.getElementById('prog-fill').style.width='100%';document.getElementById('rec-status').textContent='Done';document.getElementById('big-timer').textContent=fmtV(recSecs);};
  currentAudio.play();
}
function pausePlay2(){
  if(!currentAudio)return;
  if(isPlaying2){currentAudio.pause();isPlaying2=false;document.getElementById('play-icon').className='ti ti-player-play';document.getElementById('btn-play').classList.remove('active');document.getElementById('rec-status').textContent='Paused';}
  else{currentAudio.play();isPlaying2=true;document.getElementById('play-icon').className='ti ti-player-pause';document.getElementById('btn-play').classList.add('active');document.getElementById('rec-status').textContent='Playing...';}
}
document.getElementById('prog-wrap').addEventListener('click',e=>{if(!currentAudio||!currentAudio.duration)return;const r=document.getElementById('prog-wrap').getBoundingClientRect(),pct=(e.clientX-r.left)/r.width;currentAudio.currentTime=pct*currentAudio.duration;document.getElementById('prog-fill').style.width=(pct*100)+'%';});
document.getElementById('btn-play').addEventListener('click',()=>{if(currentAudio&&!currentAudio.ended)pausePlay2();else playCurrentBlob();});

document.getElementById('btn-save').addEventListener('click',()=>{
  if(!currentBlob)return;
  msgCount++;
  const defaultName=`Voice message ${msgCount}`;
  messages.push({id:msgCount,url:URL.createObjectURL(currentBlob),blob:currentBlob,dur:recSecs,name:defaultName});
  renderMsgs();document.getElementById('rec-status').textContent=`Saved: "${defaultName}"`;
});

document.getElementById('btn-dl').addEventListener('click',()=>{
  if(!currentBlob)return;
  const a=document.createElement('a');a.href=URL.createObjectURL(currentBlob);a.download='voice_message.webm';document.body.appendChild(a);a.click();document.body.removeChild(a);
});

function renderMsgs(){
  const msgList=document.getElementById('msg-list');
  msgList.innerHTML='';
  if(!messages.length){msgList.innerHTML='<div class="empty-msg" id="empty-msg">No messages yet</div>';return;}
  messages.forEach(m=>{
    const el=document.createElement('div');el.className='msg-row';
    el.innerHTML=`<span class="msg-name" title="Click to rename" id="mn-${m.id}"><i class="ti ti-microphone" style="font-size:12px;margin-right:6px"></i>${m.name}</span><span class="msg-dur">${fmtV(m.dur)}</span><button class="msg-btn" id="pm-${m.id}" title="Play"><i class="ti ti-player-play"></i></button><button class="msg-btn" title="Rename" onclick="renameMsg(${m.id})"><i class="ti ti-pencil"></i></button><button class="msg-btn" title="Download" onclick="dlMsg(${m.id})"><i class="ti ti-download"></i></button><button class="msg-btn" title="Delete" onclick="delMsg(${m.id})" style="border-color:rgba(220,80,80,0.3);color:rgba(220,100,100,0.7)"><i class="ti ti-trash"></i></button>`;
    el.querySelector(`#pm-${m.id}`).addEventListener('click',()=>playMsg(m.id));
    el.querySelector(`#mn-${m.id}`).addEventListener('click',()=>renameMsg(m.id));
    msgList.appendChild(el);
  });
}

window.renameMsg=function(id){
  const m=messages.find(x=>x.id===id);if(!m)return;
  openModal('Rename Voice Message',m.name,'Save',newName=>{
    m.name=newName;renderMsgs();document.getElementById('rec-status').textContent=`Renamed to: "${newName}"`;
  });
};

window.playMsg=function(id){
  const m=messages.find(x=>x.id===id);if(!m)return;
  if(playingAudio){playingAudio.pause();playingAudio=null;}
  document.querySelectorAll('.msg-btn.playing').forEach(b=>{b.classList.remove('playing');b.querySelector('i').className='ti ti-player-play';});
  const btn=document.getElementById('pm-'+id);if(!btn)return;
  const audio=new Audio(m.url);playingAudio=audio;
  if(!recAudioCtx)recAudioCtx=new(window.AudioContext||window.webkitAudioContext)();
  wallAn2=recAudioCtx.createAnalyser();wallAn2.fftSize=1024;wallAn2.smoothingTimeConstant=0.75;wallDat2=new Uint8Array(wallAn2.frequencyBinCount);
  try{const s=recAudioCtx.createMediaElementSource(audio);s.connect(wallAn2);wallAn2.connect(recAudioCtx.destination);}catch(e){}
  isPlaying2=true;btn.classList.add('playing');btn.querySelector('i').className='ti ti-player-pause';
  document.getElementById('rec-status').textContent=`Playing: ${m.name}`;
  btn.onclick=()=>{if(audio.paused){audio.play();btn.querySelector('i').className='ti ti-player-pause';btn.classList.add('playing');}else{audio.pause();btn.querySelector('i').className='ti ti-player-play';btn.classList.remove('playing');}};
  audio.onended=()=>{isPlaying2=false;btn.classList.remove('playing');btn.querySelector('i').className='ti ti-player-play';btn.onclick=()=>window.playMsg(id);document.getElementById('rec-status').textContent='Playback complete';};
  audio.play();
};

window.dlMsg=function(id){
  const m=messages.find(x=>x.id===id);if(!m)return;
  const a=document.createElement('a');a.href=m.url;a.download=m.name.replace(/ /g,'_')+'.webm';document.body.appendChild(a);a.click();document.body.removeChild(a);
};

window.delMsg=function(id){messages=messages.filter(x=>x.id!==id);renderMsgs();};

////backend for modal dialogs

// let currentAudio = null;
async function loadSongs() {
    const res = await fetch("http://localhost:3000/api/songs");
    const songs = await res.json();

    // default playlist
    playlists["All Songs"] = songs;
    currentPlaylist = "All Songs";

    renderPlaylists();
    renderSongs();
}

    const container = document.getElementById("tr-list");
    container.innerHTML = "";

    songsList.forEach((song, index) => {

        const div = document.createElement("div");
        div.classList.add("track-item");

        div.innerHTML = `
            <span>${index + 1}</span>
            <span class="tname">${song}</span>
        `;

        // ✅ IMPORTANT: yaha define hai song
        div.onclick = () => {
            currentIndex = index;
            playSong();
        };

        container.appendChild(div);
    });

function playSong(song) {
    if (currentAudio) currentAudio.pause();

    currentAudio = new Audio(`http://localhost:3000/songs/${encodeURIComponent(song)}`);
    currentAudio.play();

    document.getElementById("now-playing").innerText = "Now Playing: " + song;
}
    console.log("Playing:", song);


loadSongs();