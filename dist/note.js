// ===== 앱 전용 학습 기능: 오답 노트, 오답판, 시험별 단어장, 연속 학습일, 복습 알림 =====
// 웹에서는 window.note가 없어서 game.js의 window.note?.… 호출이 모두 그냥 넘어감
//
// 오답 노트: 놓치거나 부서진 단어가 쌓임. 하루에 한 번만 진도로 쳐서, 서로 다른 날 3번 맞히면 "외운 단어"
//   (맞힌 다음 복습 날짜: 1번째 → 1일 뒤, 2번째 → 3일 뒤, 3번째 → 외움). 틀리면 처음부터
// 오답판: 외우는 중인 단어만 떨어짐. 오늘 복습할 차례인 단어가 먼저, 많이 틀린 단어일수록 자주
// 시험별 단어장: words/exam-*.js 의 addExam 목록. 고르면 그 단어만 떨어짐 (쉬운 단계부터 레벨 따라)
// 단어장 판·오답판은 오늘의 순위에 안 들어감
const note=IS_APP?(()=>{
const DAY=864e5,LEARN=3,GAP=[1,3];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// 단어별 기록: m 틀린 횟수, s 진도(0~3), l 외운 시각(0=외우는 중), t 마지막으로 틀린 시각, d 다음 복습 시각, h 마지막으로 진도 오른 날
let data=load('wordRainNote',{});
// 한 번이라도 맞힌 단어 (단어장 진도용)
let known=load('wordRainKnown',{});
let streak=load('wordRainStreak',{last:'',n:0});
let settings=load('wordRainLearn',{exam:'',alarm:false});if(!(settings.hour>=0&&settings.hour<24))settings.hour=20;
const save=()=>store('wordRainNote',data);
const byEn=new Map(WORDS.map(w=>[w.en,w]));
const today=(t=Date.now())=>new Date(t).toLocaleDateString('sv');
let added=0,tab='learning',reviewDoneShown=false;

function learning(){return Object.keys(data).filter(en=>!data[en].l&&byEn.has(en))}
function learned(){return Object.keys(data).filter(en=>data[en].l&&byEn.has(en))}
function dueBy(t){return learning().filter(en=>(data[en].d||0)<=t)}

function miss(w){let r=data[w.en];if(!r||r.l)added++;if(!r)r=data[w.en]={m:0,s:0,l:0,t:0,d:0,h:''};
  r.m++;r.s=0;r.l=0;r.t=Date.now();r.d=Date.now();r.h='';save();badge()}
function hit(w){
  if(!known[w.en]){known[w.en]=1;store('wordRainKnown',known)}
  const r=data[w.en];if(!r||r.l)return;
  if(r.h===today())return; // 하루에 한 번만 진도로 침
  r.s++;r.h=today();
  if(r.s>=LEARN){r.l=Date.now();flash(`${w.en} 외웠어요!`,'#57d7d9')}
  else{r.d=Date.now()+GAP[r.s-1]*DAY;flash(`${w.en} 복습 ${r.s}/${LEARN} · ${GAP[r.s-1]}일 뒤 다시`,'#57d7d9')}
  save();badge();
  if(playMode==='review'&&state&&!state.ending){
    if(!learning().length){state.ending=true;flash('오답 노트를 모두 외웠어요!','#57d7d9');sfx.levelUp();setTimeout(end,1800)}
    else if(!dueBy(Date.now()).length&&!reviewDoneShown){reviewDoneShown=true;setTimeout(()=>flash('오늘 복습 끝! 이제부터는 연습이에요','#ffd84d'),900)}}
}

// 오답판에 떨어뜨릴 단어: 화면에 없는 것 중에서. 오늘 복습할 차례면 4배, 많이 틀릴수록 더 자주
function pick(active){const on=new Set(active.map(w=>w.en)),all=learning();if(!all.length)return null;const pool=all.filter(en=>!on.has(en));const src=pool.length?pool:all;
  const now=Date.now(),weights=src.map(en=>(1+Math.min(data[en].m,5))*((data[en].d||0)<=now?4:1));let r=Math.random()*weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<src.length;i++){r-=weights[i];if(r<=0)return byEn.get(src[i])}return byEn.get(src[0])}

// ----- 시험별 단어장 -----
const TIER_I={elementary:0,middle:1,high:2,intermediate:3,advanced:4};
const examWords={};for(const k in EXAMS)examWords[k]=[...new Set(EXAMS[k].list)].map(en=>byEn.get(en)).filter(Boolean);
if(settings.exam&&!examWords[settings.exam])settings.exam='';
// 레벨이 열어준 단계 안에서 고름 (새 단계 40%, 아래 단계 60% — 일반 판과 같은 규칙). 그 단계 단어가 없으면 가까운 단계
function examWord(st){const list=examWords[settings.exam];if(!list?.length)return null;
  const cur=st.tier;let t=cur;if(cur>0&&Math.random()>=.4)t=Math.floor(Math.random()*cur);
  const tiers=[...new Set(list.map(w=>TIER_I[w.difficulty]))].sort((a,b)=>a-b);
  const ok=tiers.filter(x=>x<=t);t=ok.length?ok[ok.length-1]:tiers[0];
  const key='x'+settings.exam+t;let d=st.decks[key];
  if(!d||!d.length){const on=new Set(st.active.map(w=>w.en));d=st.decks[key]=list.filter(w=>TIER_I[w.difficulty]===t&&!on.has(w.en)).sort(()=>Math.random()-.5)}
  return d.pop()||list[Math.floor(Math.random()*list.length)]}
function examProgress(k){const l=examWords[k];if(!l?.length)return 0;return l.filter(w=>known[w.en]).length}
function renderExams(){const box=$('#examPick');box.hidden=false;
  const items=[['','전체',''],...Object.keys(examWords).map(k=>[k,EXAMS[k].name,`${examProgress(k).toLocaleString()}/${examWords[k].length.toLocaleString()}`])];
  box.innerHTML='';for(const [k,name,prog] of items){const b=document.createElement('button');b.type='button';b.className='exam-chip'+(settings.exam===k?' on':'');
    b.innerHTML=`<b></b><small></small>`;b.querySelector('b').textContent=name;b.querySelector('small').textContent=k?prog:'레벨 따라';
    b.addEventListener('click',()=>{sfx.click();settings.exam=k;store('wordRainLearn',settings);renderExams()});box.appendChild(b)}
  $('#examNote').textContent=settings.exam?`${EXAMS[settings.exam].name} 단어만 떨어져요 · 순위에는 안 들어가요`:'';}

// ----- 연속 학습일 -----
function touchStreak(){const t=today();if(streak.last===t)return;const y=today(Date.now()-DAY);streak={last:t,n:streak.last===y?streak.n+1:1};store('wordRainStreak',streak);badge()}
function streakNow(){const t=today(),y=today(Date.now()-DAY);return streak.last===t||streak.last===y?streak.n:0}

// 결과 화면 위에 "오답 노트에 n개 추가" 한 줄 + 알림 켜기 안내
function onEnd(){touchStreak();const rv=$('#review');
  if(added>0){const p=document.createElement('p');p.className='note-added';p.textContent=`📒 오답 노트에 ${added}개 추가 (외우는 중 ${learning().length}개)`;rv.prepend(p)}
  if(!settings.alarm&&learning().length){const b=document.createElement('button');b.type='button';b.className='note-alarm-ask';b.textContent=`🔔 매일 ${hourLabel(settings.hour)} 복습 알림 받기`;b.addEventListener('click',async()=>{await setAlarm(true);b.textContent=settings.alarm?'🔔 알림을 켰어요':'알림이 꺼져 있어요 (설정에서 허용해 주세요)';b.disabled=true});rv.prepend(b)}
  added=0;reviewDoneShown=false;scheduleAlarms()}

function badge(){$('#noteCount').textContent=learning().length;const n=streakNow();const s=$('#streakChip');s.hidden=!n;s.textContent=`🔥 ${n}일 연속`}

// ----- 복습 알림: 매일 고른 시각(기본 저녁 8시), 그날 복습할 단어 수를 알려줌 (앞으로 7일 치를 미리 예약) -----
const LN=window.Capacitor?.Plugins?.LocalNotifications,IDS=[1,2,3,4,5,6,7];
const hourLabel=h=>(h<12?'오전 ':'오후 ')+((h%12)||12)+'시';
// 알림 시각 고르기: 오전 6시 ~ 밤 11시, 정시 단위
(()=>{const sel=$('#alarmHour');for(let h=6;h<24;h++){const o=document.createElement('option');o.value=h;o.textContent=hourLabel(h);sel.append(o)}
  sel.value=settings.hour;sel.addEventListener('change',async()=>{settings.hour=Number(sel.value);store('wordRainLearn',settings);
    if(!settings.alarm)await setAlarm(true);else await scheduleAlarms()})})();
async function setAlarm(on){
  if(on&&LN){try{const p=await LN.requestPermissions();on=p.display==='granted'}catch(e){on=false}}
  settings.alarm=!!on&&!!LN;store('wordRainLearn',settings);$('#alarmToggle').checked=settings.alarm;await scheduleAlarms();return settings.alarm}
async function scheduleAlarms(){if(!LN)return;
  try{await LN.cancel({notifications:IDS.map(id=>({id}))})}catch(e){}
  if(!settings.alarm)return;
  const list=[],base=new Date();base.setHours(settings.hour,0,0,0);
  for(let i=0;i<7;i++){const at=new Date(base.getTime()+i*DAY);if(at<=new Date())continue;
    const due=dueBy(at.getTime()).length,n=streakNow();
    if(!due&&!n)continue;
    const body=due?`오늘 복습할 단어 ${due}개가 기다려요 📒`:`🔥 ${n}일 연속 학습 중! 오늘도 한 판으로 이어가요`;
    // isExactNotification:false = 정확한 시각 알람 권한 없이 예약 (권한이 없으면 플러그인이 설정 화면을 띄우기 때문)
    list.push({id:IDS[i],title:'단어비',body,schedule:{at,allowWhileIdle:true},isExactNotification:false})}
  if(list.length){try{await LN.schedule({notifications:list})}catch(e){}}}
LN?.addListener?.('localNotificationActionPerformed',()=>{if(!state?.running)open()});
window.Capacitor?.Plugins?.App?.addListener?.('appStateChange',({isActive})=>{if(!isActive)scheduleAlarms()});

// ----- 오답 노트 화면 -----
function render(){
  const L=learning(),D=learned(),due=dueBy(Date.now()).length;$('#nsLearning').textContent=L.length;$('#nsLearned').textContent=D.length;$('#nsDue').textContent=due;
  document.querySelectorAll('.note-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  const list=$('#noteList');list.innerHTML='';const now=Date.now();
  const keys=(tab==='learning'?L.sort((a,b)=>((data[a].d||0)<=now?0:1)-((data[b].d||0)<=now?0:1)||data[b].m-data[a].m||data[b].t-data[a].t):D.sort((a,b)=>data[b].l-data[a].l));
  if(!keys.length){const li=document.createElement('li');li.className='note-empty';li.textContent=tab==='learning'?'아직 외울 단어가 없어요. 게임에서 놓치거나 부서진 단어가 여기 모여요.':'아직 외운 단어가 없어요. 오답 단어를 서로 다른 날 3번 맞혀 보세요!';list.appendChild(li)}
  for(const en of keys){const w=byEn.get(en),r=data[en],li=document.createElement('li');
    const b=document.createElement('b');b.textContent=en;const sp=document.createElement('span');sp.textContent=w.answers.slice(0,3).join(', ');
    const em=document.createElement('em');em.textContent='✕'+r.m;const dots=document.createElement('i');dots.className='note-dots';
    if(tab==='learning'){dots.textContent='●'.repeat(r.s)+'○'.repeat(LEARN-r.s);if((r.d||0)<=now)li.classList.add('due');else{const days=Math.ceil(((r.d||0)-now)/DAY);em.textContent=`✕${r.m} · ${days}일 뒤`}}else dots.textContent='✓';
    li.append(b,sp,em,dots);list.appendChild(li)}
  const rs=$('#reviewStart');rs.disabled=!L.length;rs.querySelector('span').textContent=L.length?`(${due||L.length}) →`:'';
  $('#alarmRow').hidden=!LN;$('#alarmToggle').checked=settings.alarm;badge()}
function open(){sfx.click();tab='learning';render();show('noteScreen');$('#noteScreen').scrollTop=0}

$('#noteOpen').hidden=false;$('#noteOpen').addEventListener('click',open);
$('#noteBack').addEventListener('click',()=>{sfx.click();renderExams();show('startScreen')});
document.querySelectorAll('.note-tabs button').forEach(b=>b.addEventListener('click',()=>{sfx.click();tab=b.dataset.tab;render()}));
$('#alarmToggle').addEventListener('change',e=>setAlarm(e.target.checked));
// 게임 시작: 단어장을 골랐으면 단어장 판
els.start.onclick=()=>{playMode=settings.exam?'exam':'normal';start()};
// 다시 도전: 같은 판으로. 오답판인데 외울 단어가 다 떨어졌으면 일반 판으로
els.retry.onclick=()=>{if(playMode==='review'&&!learning().length)playMode='normal';start()};
$('#reviewStart').addEventListener('click',()=>{if(!learning().length)return;playMode='review';start()});
els.home.addEventListener('click',()=>renderExams());
renderExams();badge();
return{miss,hit,pick,examWord,onEnd,open,render};
})():null;
if(note)window.note=note;
