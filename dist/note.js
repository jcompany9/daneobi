// ===== 오답 노트 + 오답판 (앱에서만) =====
// 게임에서 놓치거나 부서진 단어가 휴대폰에 쌓이고, 같은 단어를 3번 연속 맞히면 "외운 단어"로 넘어감.
// "오답만 떨어지는 판"은 외우는 중인 단어만 떨어뜨림 (많이 틀린 단어일수록 자주). 오늘의 순위에는 안 들어감.
// 웹에서는 window.note가 없어서 game.js의 window.note?.… 호출이 모두 그냥 넘어감
const note=IS_APP?(()=>{
const KEY='wordRainNote',LEARN=3;
// 단어별 기록: m 틀린 횟수, s 연속 맞힌 횟수, l 외운 시각(0이면 외우는 중), t 마지막으로 틀린 시각
let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
const byEn=new Map(WORDS.map(w=>[w.en,w]));
let added=0,tab='learning';

function learning(){return Object.keys(data).filter(en=>!data[en].l&&byEn.has(en))}
function learned(){return Object.keys(data).filter(en=>data[en].l&&byEn.has(en))}

function miss(w){let r=data[w.en];if(!r||r.l)added++;if(!r)r=data[w.en]={m:0,s:0,l:0,t:0};r.m++;r.s=0;r.l=0;r.t=Date.now();save();badge()}
function hit(w){const r=data[w.en];if(!r||r.l)return;r.s++;
  if(r.s>=LEARN){r.l=Date.now();flash(`${w.en} 외웠어요!`,'#57d7d9')}
  save();badge();
  if(playMode==='review'&&!learning().length&&state&&!state.ending){state.ending=true;flash('오답 노트를 모두 외웠어요!','#57d7d9');sfx.levelUp();setTimeout(end,1800)}}

// 오답판에 떨어뜨릴 단어: 화면에 없는 것 중에서, 많이 틀린 단어일수록 잘 뽑힘
function pick(active){const on=new Set(active.map(w=>w.en)),all=learning();if(!all.length)return null;const pool=all.filter(en=>!on.has(en));const src=pool.length?pool:all;
  const weights=src.map(en=>1+Math.min(data[en].m,5));let r=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<src.length;i++){r-=weights[i];if(r<=0)return byEn.get(src[i])}return byEn.get(src[0])}

// 결과 화면 위에 "오답 노트에 n개 추가" 한 줄
function onEnd(){const rv=$('#review');if(added>0){const p=document.createElement('p');p.className='note-added';p.textContent=`📒 오답 노트에 ${added}개 추가 (외우는 중 ${learning().length}개)`;rv.prepend(p)}added=0}

function badge(){$('#noteCount').textContent=learning().length}

// 오답 노트 화면
function render(){
  const L=learning(),D=learned();$('#nsLearning').textContent=L.length;$('#nsLearned').textContent=D.length;$('#nsMiss').textContent=Object.values(data).reduce((a,r)=>a+r.m,0);
  document.querySelectorAll('.note-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  const list=$('#noteList');list.innerHTML='';
  const keys=(tab==='learning'?L.sort((a,b)=>data[b].m-data[a].m||data[b].t-data[a].t):D.sort((a,b)=>data[b].l-data[a].l));
  if(!keys.length){const li=document.createElement('li');li.className='note-empty';li.textContent=tab==='learning'?'아직 외울 단어가 없어요. 게임에서 놓치거나 부서진 단어가 여기 모여요.':'아직 외운 단어가 없어요. 같은 단어를 3번 연속 맞혀 보세요!';list.appendChild(li)}
  for(const en of keys){const w=byEn.get(en),r=data[en],li=document.createElement('li');
    const b=document.createElement('b');b.textContent=en;const sp=document.createElement('span');sp.textContent=w.answers.slice(0,3).join(', ');
    const em=document.createElement('em');em.textContent='✕'+r.m;const dots=document.createElement('i');dots.className='note-dots';dots.textContent=tab==='learning'?'●'.repeat(r.s)+'○'.repeat(LEARN-r.s):'✓';
    li.append(b,sp,em,dots);list.appendChild(li)}
  const rs=$('#reviewStart');rs.disabled=!L.length;rs.querySelector('span').textContent=L.length?`(${L.length}) →`:'';
}
function open(){sfx.click();tab='learning';render();show('noteScreen');$('#noteScreen').scrollTop=0}

const btn=$('#noteOpen');btn.hidden=false;btn.addEventListener('click',open);
$('#noteBack').addEventListener('click',()=>{sfx.click();show('startScreen')});
document.querySelectorAll('.note-tabs button').forEach(b=>b.addEventListener('click',()=>{sfx.click();tab=b.dataset.tab;render()}));
// 결과 화면의 다시 도전: 오답판이었는데 외울 단어가 다 떨어졌으면 일반 판으로
els.retry.onclick=()=>{if(playMode==='review'&&!learning().length)playMode='normal';start()};
$('#reviewStart').addEventListener('click',()=>{if(!learning().length)return;playMode='review';start()});
badge();
return{miss,hit,pick,onEnd,open,render};
})():null;
if(note)window.note=note;
