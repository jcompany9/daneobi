const BASE_WORDS=[
['apple','사과'],['book','책'],['water','물'],['house','집'],['friend','친구'],['school','학교'],['family','가족'],['morning','아침'],['night','밤'],['food','음식'],
['love','사랑'],['happy','행복한|기쁜'],['sad','슬픈'],['big','큰'],['small','작은'],['good','좋은'],['bad','나쁜'],['fast','빠른'],['slow','느린'],['beautiful','아름다운|예쁜'],
['sky','하늘'],['sun','태양|해'],['moon','달'],['star','별'],['rain','비'],['snow','눈'],['wind','바람'],['tree','나무'],['flower','꽃'],['river','강'],
['sea','바다'],['mountain','산'],['animal','동물'],['dog','개|강아지'],['cat','고양이'],['bird','새'],['fish','물고기'],['time','시간'],['day','날|하루'],['week','주|일주일'],
['year','년|해'],['today','오늘'],['tomorrow','내일'],['yesterday','어제'],['people','사람들'],['child','아이|어린이'],['mother','어머니|엄마'],['father','아버지|아빠'],['brother','형제|남자형제'],['sister','자매|여자형제'],
['name','이름'],['place','장소'],['world','세계'],['country','나라|국가'],['city','도시'],['street','거리|길'],['room','방'],['door','문'],['window','창문'],['table','탁자|식탁'],
['chair','의자'],['phone','전화기|휴대폰'],['computer','컴퓨터'],['picture','그림|사진'],['music','음악'],['song','노래'],['game','게임'],['work','일|일하다'],['study','공부|공부하다'],['learn','배우다'],
['read','읽다'],['write','쓰다'],['speak','말하다'],['listen','듣다'],['look','보다|바라보다'],['walk','걷다'],['run','달리다'],['eat','먹다'],['drink','마시다'],['sleep','자다'],
['make','만들다'],['take','가지고가다|취하다'],['give','주다'],['find','찾다'],['know','알다'],['think','생각하다'],['want','원하다'],['need','필요하다'],['help','돕다|도움'],['start','시작하다'],
['finish','끝내다|마치다'],['open','열다'],['close','닫다'],['new','새로운'],['old','오래된|늙은'],['young','젊은|어린'],['easy','쉬운'],['difficult','어려운'],['important','중요한'],['different','다른']
].map(([en,ko],i)=>({id:i,en,answers:ko.split('|'),ko,type:'basic'}));
function rankWord(w){const n=w.en.length;if(w.type==='basic')return n<=5?'elementary':n<=7?'middle':'high';if(['root','irregular'].includes(w.type))return'advanced';if(w.type==='phrase')return n<=8?'high':n<=10?'intermediate':'advanced';if(['prefix','suffix'].includes(w.type))return n<=5?'high':'intermediate';return n<=5?'middle':n<=7?'high':n<=9?'intermediate':'advanced'}
// 단어 합치기 (같은 영어 단어는 한 번만). 추가 단어(vocab-more.js)는 정해둔 단계를 그대로 씀
const WORDS=(()=>{const seen=new Set();return[...BASE_WORDS,...EXTRA_WORDS,...(typeof MORE_WORDS!=='undefined'?MORE_WORDS:[])].filter(w=>{const k=w.en.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})})().map((w,i)=>({...w,id:i,answers:w.answers||w.ko.split('|'),difficulty:w.tier||rankWord(w)}));
const EASY_WORDS=WORDS.filter(w=>w.difficulty==='elementary');
const DIFFICULTY={elementary:{label:'초등',speed:24,interval:2.55},middle:{label:'중등',speed:28,interval:2.35},high:{label:'고등',speed:32,interval:2.15},intermediate:{label:'중급',speed:37,interval:1.95},advanced:{label:'고급',speed:42,interval:1.75}};
const TYPE_LABEL={basic:'기본',more:'단어',noun:'명사',verb:'동사',adj:'형용사',adv:'부사',phrase:'표현',prefix:'접두사',suffix:'접미사',root:'어근',irregular:'불규칙'};

const $=s=>document.querySelector(s);const screens=['startScreen','gameScreen','resultScreen'];
const els={start:$('#startBtn'),retry:$('#retryBtn'),save:$('#saveImageBtn'),share:$('#shareBtn'),home:$('#homeBtn'),pause:$('#pauseBtn'),resume:$('#resumeBtn'),quit:$('#quitBtn'),modal:$('#pauseModal'),field:$('#playfield'),layer:$('#wordLayer'),form:$('#answerForm'),input:$('#answer'),score:$('#score'),combo:$('#combo'),level:$('#level'),levelGauge:$('#levelGauge'),gaugeValue:$('#gaugeValue'),feedback:$('#feedback'),comboBurst:$('#comboBurst'),levelUp:$('#levelUp'),resultBadge:$('#resultBadge'),ground:$('.ground'),deadline:$('.dead-line')};
let state,raf,lastTime,spawnClock,selectedMode='elementary';
// 단어는 화면 높이와 상관없이 같은 시간 동안 떨어짐 (p: 0=맨 위, 1=바닥). 키보드로 화면이 줄어도 단어가 한꺼번에 놓침 처리되지 않음
const TOP=-52,FALL=400;
// 시간이 지날수록 단어가 더 자주 나옴 (낙하 속도는 그대로)
function spawnInterval(){return DIFFICULTY.elementary.interval*.85*Math.max(.7,1-(state.level-1)*.04)}
// 바닥 높이도 화면 크기에 대한 비율로 기억했다가, 화면이 바뀌면 다시 계산
function maxRise(){return Math.max(0,els.field.clientHeight-els.ground.offsetHeight-els.deadline.offsetTop)}
function applyGroundRise(){const px=Math.round(maxRise()*state.riseFrac);if(px!==state.groundRise){state.groundRise=px;els.field.style.setProperty('--ground-rise',px+'px')}}
// 화면 크기별 난이도: 단어가 떨어지는 공간이 짧으면 동시에 나오는 단어 수를 줄임
function maxWords(){const h=els.field.clientHeight-state.groundRise;return h<280?3:h<400?4:5}
// 단어가 겹치지 않게 화면을 세로 칸으로 나누고, 위쪽에 아직 단어가 있는 칸은 피해서 떨어뜨림
function pickLane(wordW){const W=els.field.clientWidth-16,lanes=Math.max(2,Math.floor(W/100)),laneW=W/lanes;const busy=new Set(state.active.filter(w=>w.p<.4).map(w=>w.lane));const all=[...Array(lanes).keys()],free=all.filter(i=>!busy.has(i)),pool=free.length?free:all;const lane=pool[Math.floor(Math.random()*pool.length)];const x=8+lane*laneW+Math.random()*Math.max(0,laneW-wordW);return{lane,x:Math.max(8,Math.min(x,W+8-wordW))}}
function show(id){screens.forEach(x=>$('#'+x).classList.toggle('active',x===id));if(id==='startScreen')hiscore?.refresh()}
function getPool(){return WORDS}
// 단어 단계: 레벨 2마다 다음 단계가 풀림 (Lv1~2 초등, 3~4 중등, 5~6 고등, 7~8 중급, 9~ 고급).
// 새로 풀린 단계 단어가 40%, 나머지 60%는 이전 단계들에서 골고루 섞여 나옴
const TIERS=['elementary','middle','high','intermediate','advanced'];
const LEVEL_TIME=30,COMBO_LEVEL=15,FLOOR_MAX=10;

function nextWord(){const cur=state.tier;let t=cur;if(cur>0&&Math.random()>=.4)t=Math.floor(Math.random()*cur);const key=TIERS[t];let d=state.decks[key];if(!d||!d.length){const onScreen=new Set(state.active.map(w=>w.en));d=state.decks[key]=WORDS.filter(w=>w.difficulty===key&&!onScreen.has(w.en)).sort(()=>Math.random()-.5)}return d.pop()||WORDS[Math.floor(Math.random()*WORDS.length)]}

function reset(){state={score:0,combo:0,maxCombo:0,correct:0,missed:[],active:[],running:true,paused:false,ending:false,elapsed:0,level:1,levelTime:0,floor:0,groundRise:0,riseFrac:0,tier:0,decks:{}};els.layer.innerHTML='';els.field.classList.remove('hit','ground-impact','deadline-hit','critical');els.field.style.setProperty('--ground-rise','0px');spawnClock=0;lastTime=performance.now();updateHud()}
function start(){sfx.unlock();sfx.start();lockPortrait();reset();show('gameScreen');spawn();els.input.value='';setTimeout(()=>els.input.focus(),120);cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function spawn(){const word=nextWord(),node=document.createElement('div');node.className='word';node.textContent=word.en;els.layer.appendChild(node);const {lane,x}=pickLane(node.offsetWidth),base=DIFFICULTY[selectedMode].speed;const item={...word,node,x,lane,p:0,speed:base+Math.random()*7};state.active.push(item);node.style.transform=`translate(${x}px,${TOP}px)`}
function showLevelUp(title,sub){sfx.levelUp();els.levelUp.querySelector('small').textContent=title||'LEVEL UP';els.levelUp.querySelector('span').textContent=state.level;els.levelUp.querySelector('em').textContent=sub||'';els.levelUp.classList.remove('show');void els.levelUp.offsetWidth;els.levelUp.classList.add('show');navigator.vibrate?.([25,35,55])}
// 바닥: 실수(단어 놓침, 카드 파괴)할 때마다 한 칸씩 올라옴. FLOOR_MAX번 실수하면 DEAD LINE에 닿아 게임 끝
function raiseFloor(){if(!state?.running||state.ending)return;state.floor=Math.min(FLOOR_MAX,state.floor+1);state.riseFrac=state.floor/FLOOR_MAX;applyGroundRise();els.field.classList.remove('ground-impact');void els.field.offsetWidth;els.field.classList.add('ground-impact');els.field.classList.toggle('critical',state.floor>=FLOOR_MAX-2);if(state.floor>=FLOOR_MAX){state.ending=true;els.field.classList.add('deadline-hit');sfx.gameOver();flash('DEAD LINE!','#ff5171');navigator.vibrate?.([70,35,70,35,120]);setTimeout(end,850)}}
// 레벨: 시간이 지나거나(LEVEL_TIME초) 콤보를 COMBO_LEVEL번 이어가면 오름.
// 레벨이 오르면 어려운 단어가 새로 풀리고 점수 배율이 오름 (떨어지는 속도는 그대로). 콤보로 오르면 보너스 점수
function levelUp(byCombo){state.level++;state.levelTime=0;const parts=[];if(byCombo){const bonus=state.level*500;state.score+=bonus;parts.push(`보너스 +${bonus.toLocaleString()}`)}const t=Math.min(TIERS.length-1,Math.floor((state.level-1)/2));if(t>state.tier){state.tier=t;parts.push(`${DIFFICULTY[TIERS[t]].label} 단어 등장!`)}if(!parts.length)parts.push('점수 배율 UP!');showLevelUp(byCombo?'COMBO LEVEL UP':'LEVEL UP',parts.join(' · '));updateHud()}
function updateGauge(){const v=Math.max(0,Math.min(1,state.levelTime/LEVEL_TIME));els.levelGauge.style.transform=`scaleX(${v})`}
function loop(now){if(!state?.running)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(!state.paused&&!state.ending){state.elapsed+=dt;spawnClock+=dt;state.levelTime+=dt;if(state.levelTime>=LEVEL_TIME)levelUp(false);updateGauge();if(state.ending){raf=requestAnimationFrame(loop);return}applyGroundRise();const interval=spawnInterval();if(spawnClock>=interval&&state.active.length<maxWords()){spawnClock=0;spawn()}const floor=els.field.clientHeight-els.ground.offsetHeight-36,dist=Math.max(1,floor-TOP),limit=floor-state.groundRise;for(let i=state.active.length-1;i>=0;i--){const w=state.active[i];w.p+=w.speed*dt/FALL;const y=TOP+w.p*dist;w.y=y;const maxX=els.field.clientWidth-w.node.offsetWidth-8;if(w.x>maxX)w.x=Math.max(8,maxX);w.node.style.transform=`translate(${w.x}px,${y}px)`;w.node.classList.toggle('danger',y>=limit-95);if(y>=limit)miss(i)}}raf=requestAnimationFrame(loop)}
function norm(v){return v.trim().replace(/\s+/g,'').replace(/[.!?]/g,'')}
function answer(e){e.preventDefault();if(!state?.running||state.paused||state.ending)return;const value=norm(els.input.value);if(!value)return;let idx=state.active.findIndex(w=>w.answers.some(a=>norm(a)===value));if(idx<0){state.combo=0;if(state.active.length)crack(state.active[Math.floor(Math.random()*state.active.length)]);else{sfx.buzz();flash('다시 생각해봐요','#ef5b61')}navigator.vibrate?.(40)}else{const w=state.active[idx];state.active.splice(idx,1);w.node.classList.add('correct-pop');setTimeout(()=>w.node.remove(),190);state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.correct++;const mult=1+(state.level-1)*.25,gain=Math.round((100+Math.min(400,(state.combo-1)*20))*mult);state.score+=gain;els.field.classList.remove('hit');void els.field.offsetWidth;els.field.classList.add('hit');els.comboBurst.textContent=state.combo>1?`${state.combo} COMBO!`:`+${gain}`;els.comboBurst.classList.remove('show');void els.comboBurst.offsetWidth;els.comboBurst.classList.add('show');sfx.correct(state.combo);if(state.combo%COMBO_LEVEL===0)levelUp(true);navigator.vibrate?.(state.combo>=5?[18,22,28]:18)}els.input.value='';keepTyping();updateHud()}
function miss(i){const [w]=state.active.splice(i,1);groundImpact(w);w.node.remove();state.missed.push(w);state.combo=0;raiseFloor();if(!state.ending)flash(`MISS · 바닥 ▲ ${state.floor}/${FLOOR_MAX}`,'#ef5b61');navigator.vibrate?.([60,25,90]);updateHud()}
// 바닥 타격감: 단어가 찌그러지며 부서지고, 파편이 튀고, 화면이 흔들리고, 바닥이 번쩍임
function groundImpact(w){sfx.thud();const n=w.node,W=n.offsetWidth,H=n.offsetHeight,x=w.x,y=w.y??0;const splat=document.createElement('div');splat.className='word splat';splat.textContent=w.en;splat.style.left=x+'px';splat.style.top=y+'px';splat.style.width=W+'px';els.layer.appendChild(splat);setTimeout(()=>splat.remove(),420);impactAt(x,y+H,W)}
// 바닥에 부딪힌 자리에서 파편이 튀고, 화면이 흔들리고, 바닥이 번쩍임
function impactAt(x,bottom,W){const colors=['#ff5171','#ffd84d','#57d7d9','#fff7dc'];for(let k=0;k<10;k++){const s=document.createElement('i');s.className='spark';const a=Math.PI*(1.05+Math.random()*.9),d=40+Math.random()*60;s.style.left=(x+W*(.15+Math.random()*.7))+'px';s.style.top=bottom+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');s.style.background=colors[k%colors.length];els.layer.appendChild(s);setTimeout(()=>s.remove(),520)}els.field.classList.remove('ground-hit');void els.field.offsetWidth;els.field.classList.add('ground-hit')}
// 틀린 답: 떨어지는 단어 중 하나에 금이 감. 3번 금이 가면 파괴
const CRACK_LIMIT=3;
function crack(w){w.cracks=(w.cracks||0)+1;if(w.cracks>=CRACK_LIMIT){shatter(w);return}w.node.classList.remove('crack-1','crack-2','cracking');void w.node.offsetWidth;w.node.classList.add('crack-'+w.cracks,'cracking');sfx.crack(w.cracks);flash(`${w.en}에 금이 갔어요 ${w.cracks}/${CRACK_LIMIT}`,'#ffd84d')}
// 파괴: 카드가 세 조각으로 쪼개져 바닥으로 떨어지고, 부딪히면 놓친 단어처럼 위험 게이지 상승
function shatter(w){const i=state.active.indexOf(w);if(i<0)return;state.active.splice(i,1);const n=w.node,W=n.offsetWidth,H=n.offsetHeight,x=w.x,y=w.y??TOP;const groundY=els.field.clientHeight-els.ground.offsetHeight-state.groundRise;const drop=Math.max(0,groundY-H-y);const fallMs=Math.min(420,180+drop*.6);const cuts=['polygon(0 0,38% 0,30% 55%,42% 100%,0 100%)','polygon(38% 0,70% 0,62% 45%,72% 100%,42% 100%,30% 55%)','polygon(70% 0,100% 0,100% 100%,72% 100%,62% 45%)'];cuts.forEach((cp,k)=>{const sh=n.cloneNode(true);sh.className='word shard crack-2';sh.style.transform='none';sh.style.left=x+'px';sh.style.top=y+'px';sh.style.width=W+'px';sh.style.clipPath=cp;sh.style.setProperty('--dx',(k-1)*(18+Math.random()*16)+'px');sh.style.setProperty('--dy',drop+'px');sh.style.setProperty('--rot',(k-1)*(14+Math.random()*16)+'deg');sh.style.setProperty('--fall',fallMs+'ms');els.layer.appendChild(sh);setTimeout(()=>sh.remove(),620)});n.remove();sfx.shatter();flash(`${w.en} 파괴!`,'#ff5171');navigator.vibrate?.([30,20,30]);setTimeout(()=>{if(!state?.running)return;impactAt(x,groundY,W);sfx.thud();state.missed.push(w);raiseFloor();navigator.vibrate?.([60,25,90]);updateHud()},fallMs)}
function flash(text,color){els.feedback.textContent=text;els.feedback.style.color=color;els.feedback.classList.remove('show');void els.feedback.offsetWidth;els.feedback.classList.add('show')}
function updateHud(){els.score.textContent=state.score.toLocaleString();els.combo.textContent=state.combo;els.level.textContent=state.level;updateGauge()}
function pause(){if(state?.running&&!state.paused)sfx.click();if(!state?.running)return;state.paused=true;els.modal.classList.add('open');els.input.blur()}
function resume(){sfx.click();state.paused=false;lastTime=performance.now();els.modal.classList.remove('open');els.input.focus()}
function end(){if(!state?.running)return;state.running=false;els.input.blur();cancelAnimationFrame(raf);els.modal.classList.remove('open');const best=Math.max(Number(localStorage.getItem('wordRainBest')||0),state.score);localStorage.setItem('wordRainBest',best);$('#finalScore').textContent=state.score.toLocaleString();$('#correctCount').textContent=state.correct;$('#maxCombo').textContent=state.maxCombo;$('#missCount').textContent=state.missed.length;$('#bestStart').textContent=best.toLocaleString();els.resultBadge.textContent=`${DIFFICULTY[TIERS[state.tier]].label} 단어까지 · LEVEL ${state.level}`;const unique=[...new Map(state.missed.map(w=>[w.en,w])).values()];state.reviewWords=unique;$('#review').innerHTML=unique.length?'<p style="background:transparent;font-weight:900">틀린 단어 전체 복습</p>'+unique.map(w=>`<p><b>${w.en}</b> &nbsp; ${w.answers.join(', ')}</p>`).join(''):'<p>놓친 단어가 없어요. 완벽해요! 🎉</p>';els.save.textContent='이미지 저장 ↓';els.share.textContent='공유하기';show('resultScreen');hiscore.onGameEnd(state.score,TIERS[state.tier])}
function roundRect(ctx,x,y,w,h,r,fill){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fillStyle=fill;ctx.fill()}
async function drawResultImage(){const words=state.reviewWords||[];const width=1080,height=Math.max(1180,890+words.length*94);const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,width,height);g.addColorStop(0,'#fff7e8');g.addColorStop(1,'#dff3eb');x.fillStyle=g;x.fillRect(0,0,width,height);x.textAlign='center';x.fillStyle='#ff7557';x.font='900 34px system-ui,sans-serif';x.fillText('하루 3분, 손끝으로 외우기',540,100);x.fillStyle='#17324d';x.font='1000 92px system-ui,sans-serif';x.fillText('단어비',540,215);roundRect(x,140,280,800,250,54,'#ffffff');x.fillStyle='#82909b';x.font='800 28px system-ui,sans-serif';x.fillText('TODAY SCORE',540,350);x.fillStyle='#17324d';x.font='1000 112px system-ui,sans-serif';x.fillText(state.score.toLocaleString(),540,475);[['맞힌 단어',state.correct],['최고 콤보',state.maxCombo],['놓친 단어',state.missed.length]].forEach(([label,value],i)=>{const cx=270+i*270;x.fillStyle='#82909b';x.font='700 25px system-ui,sans-serif';x.fillText(label,cx,610);x.fillStyle=i===2?'#ef5b61':'#17324d';x.font='1000 52px system-ui,sans-serif';x.fillText(value,cx,675)});x.textAlign='left';x.fillStyle='#17324d';x.font='1000 38px system-ui,sans-serif';x.fillText(words.length?'틀린 단어 복습':'완벽해요!',110,770);if(words.length){words.forEach((w,i)=>{const y=810+i*94;roundRect(x,95,y,890,74,22,'#ffffff');x.fillStyle='#ff7557';x.font='900 31px system-ui,sans-serif';x.fillText(w.en,130,y+48);x.fillStyle='#536677';x.font='700 29px system-ui,sans-serif';x.fillText(w.answers.join(', '),500,y+48)})}else{x.textAlign='center';x.fillStyle='#536677';x.font='700 31px system-ui,sans-serif';x.fillText('놓친 단어가 하나도 없어요!',540,860)}x.textAlign='center';x.fillStyle='#82909b';x.font='700 23px system-ui,sans-serif';x.fillText('WORD RAIN · 나의 영단어 기록',540,height-55);return c}
function resultBlob(c){return new Promise(r=>c.toBlob(r,'image/png'))}
function resultFileName(){return `단어비-${state.score}점-${new Date(Date.now()+9*3600e3).toISOString().slice(0,10)}.png`}
// 이미지 저장: 파일로 바로 내려받음 (앱 안 브라우저는 다운로드가 막혀 있어서 길게 눌러 저장하는 화면을 띄움)
async function saveResultImage(){if(!state)return;const c=await drawResultImage();if(IN_APP){showImagePreview(c.toDataURL('image/png'));return}const blob=await resultBlob(c);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=resultFileName();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);els.save.textContent='저장 완료 ✓'}
// 공유하기: 결과 이미지와 링크를 카카오톡 등으로 보냄. 이미지 공유가 안 되면 링크만, 그것도 안 되면 링크 복사
async function shareResult(){if(!state)return;const text=`단어비에서 ${state.score.toLocaleString()}점! 나보다 잘할 수 있어?`,url=location.origin+location.pathname;const copy=async()=>{try{await navigator.clipboard.writeText(text+' '+url);els.share.textContent='링크 복사됨 ✓'}catch(_){prompt('이 링크를 복사하세요',url)}};try{const blob=await resultBlob(await drawResultImage());const file=new File([blob],resultFileName(),{type:'image/png'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'단어비',text:text+' '+url});return}if(navigator.share){await navigator.share({title:'단어비',text,url});return}await copy()}catch(e){if(e.name!=='AbortError')await copy()}}
// 앱 안 브라우저 구분 (카카오톡, 네이버, 인스타그램, 페이스북, 라인, 밴드, 다음, 에브리타임)
const UA=navigator.userAgent,IN_APP=/KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|BAND\/|DaumApps|everytimeApp/i.test(UA);
function externalBrowserUrl(){const url=location.href;if(/KAKAOTALK/i.test(UA))return'kakaotalk://web/openExternal?url='+encodeURIComponent(url);if(/Line\//i.test(UA))return url+(url.includes('?')?'&':'?')+'openExternalBrowser=1';return null}
function showImagePreview(src){document.querySelector('.image-modal')?.remove();const m=document.createElement('div');m.className='image-modal';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');const box=document.createElement('div');const tip=document.createElement('p');tip.className='image-tip';tip.textContent='이미지를 길게 눌러서 저장하세요';const img=document.createElement('img');img.src=src;img.alt='단어비 결과 이미지';box.append(tip,img);const ext=externalBrowserUrl();if(ext){const b=document.createElement('a');b.className='primary ext-btn';b.href=ext;b.textContent='저장이 안 되면 다른 브라우저로 열기';box.appendChild(b)}const close=document.createElement('button');close.className='text-btn';close.textContent='닫기';close.onclick=()=>m.remove();box.appendChild(close);m.appendChild(box);m.onclick=e=>{if(e.target===m)m.remove()};$('.app').appendChild(m);els.save.textContent='이미지 저장 ↓'}
els.start.onclick=start;els.retry.onclick=start;els.save.onclick=saveResultImage;els.share.onclick=shareResult;els.home.onclick=()=>{show('startScreen');$('#bestStart').textContent=Number(localStorage.getItem('wordRainBest')||0).toLocaleString()};els.pause.onclick=pause;els.resume.onclick=resume;els.quit.onclick=end;els.form.onsubmit=answer;document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.running&&!state.paused)pause()});$('#bestStart').textContent=Number(localStorage.getItem('wordRainBest')||0).toLocaleString();
// 모바일 키보드: 실제로 보이는 영역(visualViewport)에 맞춰 화면 높이와 위치를 맞추고, 키보드가 열려 있으면 작은 화면 모드(kb-open)로 전환
function syncViewport(){const vv=window.visualViewport,root=document.documentElement;const h=Math.round(vv?.height||window.innerHeight);root.style.setProperty('--app-height',`${h}px`);root.style.setProperty('--app-top',`${Math.round(vv?.offsetTop||0)}px`);const typing=document.activeElement?.tagName==='INPUT'&&matchMedia('(pointer:coarse)').matches;root.classList.toggle('kb-open',(!!vv&&vv.height<window.innerHeight*.8)||typing)}
window.visualViewport?.addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('scroll',syncViewport);window.addEventListener('resize',syncViewport);document.addEventListener('focusin',()=>setTimeout(syncViewport,50));document.addEventListener('focusout',()=>setTimeout(syncViewport,50));syncViewport();
// 가로 화면 막기: 터치 기기에서 가로로 돌리면 안내를 띄우고 게임을 멈춤.
// 키보드 때문에 화면이 가로로 길어지는 경우와 헷갈리지 않도록 화면 크기가 아니라 기기 방향으로 판단
function isLandscape(){if(!matchMedia('(pointer:coarse)').matches)return false;const t=screen.orientation?.type;if(t)return t.startsWith('landscape');if(typeof window.orientation==='number')return Math.abs(window.orientation)===90;return screen.width>screen.height}
function checkOrientation(){const land=isLandscape();document.documentElement.classList.toggle('landscape',land);if(land&&state?.running&&!state.paused&&!state.ending)pause()}
screen.orientation?.addEventListener?.('change',checkOrientation);window.addEventListener('orientationchange',checkOrientation);window.addEventListener('resize',checkOrientation);checkOrientation();
function lockPortrait(){try{screen.orientation?.lock?.('portrait').catch(()=>{})}catch(e){}}
document.querySelectorAll('.mode-chip').forEach(btn=>btn.onclick=()=>{sfx.unlock();sfx.click();selectedMode=btn.dataset.mode;document.querySelectorAll('.mode-chip').forEach(b=>b.classList.toggle('active',b===btn));void 0});
// 게임 중에는 키보드가 계속 켜져 있게: 입력창 선택이 풀리지 않도록 막고, 풀리면 다음 터치 때 바로 되돌림
// (브라우저는 사용자가 터치한 순간에만 키보드를 띄울 수 있어서, 터치 이벤트 안에서 다시 선택함)
function typingActive(){return !!state?.running&&!state.paused&&!state.ending&&$('#gameScreen').classList.contains('active')}
function keepTyping(){if(typingActive()&&document.activeElement!==els.input)els.input.focus({preventScroll:true})}
const answerBtn=$('#answerBtn');
// ↵ 버튼: 누를 때 선택이 버튼으로 넘어가지 않게 하고 직접 제출
answerBtn.addEventListener('mousedown',e=>e.preventDefault());
answerBtn.addEventListener('touchend',e=>{e.preventDefault();if(els.form.requestSubmit)els.form.requestSubmit();else answer(new Event('submit'))});
// 게임 화면의 빈 곳이나 단어를 눌러도 입력창 선택 유지 (버튼은 원래대로 동작)
const gameScreen=$('#gameScreen');
gameScreen.addEventListener('mousedown',e=>{if(typingActive()&&!e.target.closest('button,input'))e.preventDefault()});
gameScreen.addEventListener('touchend',e=>{if(typingActive()&&!e.target.closest('button,input')){e.preventDefault();keepTyping()}});

// ===== 레트로 효과음 (소리 파일 없이 브라우저에서 8비트 소리를 직접 만듦) =====
const sfx=(()=>{let ctx=null,master=null,noiseBuf=null;let muted=false;try{muted=localStorage.getItem('wordRainMuted')==='1'}catch(e){}
function ac(){if(muted)return null;if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ctx=new AC();master=ctx.createGain();master.gain.value=.32;master.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx}
// 네모파/삼각파 한 음. slide를 주면 음이 미끄러지듯 바뀜
function tone(freq,dur,{type='square',vol=.4,slide=0,delay=0}={}){const c=ac();if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03)}
// 지지직 잡음 (깨지는 소리, 쿵 소리에 사용)
function noise(dur,{vol=.4,delay=0,freq=2000,filter='lowpass'}={}){const c=ac();if(!c)return;if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*.5,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}const t=c.currentTime+delay,src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=noiseBuf;f.type=filter;f.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);src.connect(f);f.connect(g);g.connect(master);src.start(t);src.stop(t+dur+.03)}
return{
unlock(){ac()},
click(){tone(1320,.04,{vol:.18})},
start(){[392,523,659,784].forEach((f,i)=>tone(f,.07,{vol:.28,delay:i*.06}))},
// 정답: 띵-띵. 콤보가 오를수록 음이 반음씩 올라감
correct(combo){const f=660*Math.pow(2,Math.min(Math.max(combo,1)-1,12)/12);tone(f,.06,{vol:.3});tone(f*1.5,.09,{vol:.26,delay:.055})},
// 금: 찌직 (두 번째 금은 더 낮고 거칠게)
crack(n){noise(.07,{vol:.45,freq:n>1?2500:4500,filter:'highpass'});tone(n>1?180:260,.07,{type:'square',vol:.18,slide:.5})},
// 파괴: 짜작 + 유리 조각 소리
shatter(){noise(.22,{vol:.55,freq:3000,filter:'highpass'});[1568,1175,1760,1318].forEach((f,i)=>tone(f,.06,{type:'triangle',vol:.16,delay:.02+i*.035}))},
// 바닥 충돌: 쿵
thud(){tone(150,.2,{type:'square',vol:.42,slide:.3});noise(.14,{vol:.5,freq:380})},
buzz(){tone(98,.12,{type:'sawtooth',vol:.2})},
levelUp(){[523,659,784,1047].forEach((f,i)=>tone(f,.09,{vol:.28,delay:i*.07}));tone(1047,.22,{type:'triangle',vol:.22,delay:.3})},
gameOver(){[392,330,262,196].forEach((f,i)=>tone(f,.2,{vol:.32,delay:i*.17,slide:.92}));noise(.4,{vol:.3,freq:500,delay:.68})},
get muted(){return muted},
toggle(){muted=!muted;try{localStorage.setItem('wordRainMuted',muted?'1':'0')}catch(e){}if(muted){ctx?.suspend().catch(()=>{})}else{ac();this.click()}updateSoundButtons()}
}})();
// 소리 켜기/끄기 버튼 (시작 화면, 게임 화면)
function updateSoundButtons(){document.querySelectorAll('.sound-toggle').forEach(b=>{const on=!sfx.muted;b.classList.toggle('off',!on);b.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');if(b.classList.contains('sound-text'))b.textContent=on?'소리 켜짐 ♪':'소리 꺼짐';else b.textContent=on?'♪':'×'})}
document.querySelectorAll('.sound-toggle').forEach(b=>{b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',()=>{sfx.toggle();if(typingActive())els.input.focus({preventScroll:true})})});
updateSoundButtons();
// 휴대폰은 첫 터치 전에는 소리를 막아서, 첫 터치 때 소리 장치를 준비
document.addEventListener('pointerdown',()=>sfx.unlock(),{once:true});
// ===== 오늘의 순위 (오락실 HIGH SCORES) =====
// 서버(/api/scores)에 연결되면 모두가 같은 순위를 보고, 연결이 안 되면 이 기기에 저장된 순위를 보여줌. 매일 한국 시간 자정에 초기화
var hiscore=(()=>{const API='/api/scores',TOP_N=10,RANK_LABEL=['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH','9TH','10TH'];
const MODE_SHORT={elementary:'초',middle:'중',high:'고',intermediate:'중급',advanced:'고급'};
const panel=$('#hiscore'),list=$('#hsList'),dateEl=$('#hsDate'),noteEl=$('#hsNote');
const neModal=$('#neModal'),form=$('#nameEntry'),input=$('#neInput'),btn=$('#neBtn'),rankEl=$('#neRank'),msg=$('#neMsg');
let board=[],online=false,lastId=null,pending=null;try{lastId=localStorage.getItem('wordRainLastId')}catch(e){}
function today(){return new Date(Date.now()+9*3600e3).toISOString().slice(0,10)}
function cleanName(v){return [...String(v||'').toUpperCase()].filter(c=>/[A-Z0-9가-힣]/.test(c)).slice(0,3).join('')}
// 이 기기 전용 순위
function localLoad(){try{const d=JSON.parse(localStorage.getItem('wordRainDaily')||'null');return d&&d.date===today()?d.scores:[]}catch(e){return[]}}
function localSave(entry){const scores=[...localLoad(),entry].sort((a,b)=>b.score-a.score||a.t-b.t).slice(0,30);try{localStorage.setItem('wordRainDaily',JSON.stringify({date:today(),scores}))}catch(e){}return{rank:scores.findIndex(s=>s.id===entry.id)+1,scores:scores.slice(0,TOP_N)}}
async function fetchBoard(){try{const r=await fetch(API,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();online=true;return d.scores||[]}catch(e){online=false;return localLoad().slice(0,TOP_N)}}
function render(){const[,m,d]=today().split('-');dateEl.textContent=`${Number(m)}월 ${Number(d)}일`;noteEl.textContent=online?'':' · 이 기기 기록';list.innerHTML='';for(let i=0;i<TOP_N;i++){const s=board[i],li=document.createElement('li');li.className='rank-'+(i+1)+(s&&s.id&&s.id===lastId?' me':'');const a=document.createElement('span'),b=document.createElement('b'),c=document.createElement('span');a.textContent=RANK_LABEL[i];b.textContent=s?Number(s.score).toLocaleString():'-----';c.textContent=s?s.name:'---';li.append(a,b,c);if(s&&s.mode){const t=document.createElement('small');t.textContent=MODE_SHORT[s.mode]||'';li.appendChild(t)}list.appendChild(li)}}
// 순위표 시트: '오늘의 순위' 버튼을 누르면 아래에서 올라오고, 닫기/바깥 누르기/아래로 밀기로 닫힘
const app=$('.app'),backdrop=$('#hsBackdrop');
function openSheet(){sfx.click();board.length||render();app.classList.add('rank-open');refresh()}
function closeSheet(){if(!app.classList.contains('rank-open'))return;sfx.click();app.classList.remove('rank-open')}
$('#rankOpen').addEventListener('click',openSheet);$('#hsClose').addEventListener('click',closeSheet);backdrop.addEventListener('click',closeSheet);
let sy=null;panel.addEventListener('touchstart',e=>{sy=e.touches[0].clientY},{passive:true});panel.addEventListener('touchend',e=>{if(sy!==null&&e.changedTouches[0].clientY-sy>60)closeSheet();sy=null});
els.start.addEventListener('click',()=>app.classList.remove('rank-open'));
async function refresh(){board=await fetchBoard();render()}
// 게임이 끝나면 오늘 10위 안에 들었을 때만 이름 입력
async function onGameEnd(score,mode){neModal.hidden=true;msg.textContent='';pending=null;if(!(score>0))return;board=await fetchBoard();const pos=board.filter(s=>s.score>=score).length;if(pos>=TOP_N)return;pending={score,mode};rankEl.textContent=`오늘 ${RANK_LABEL[pos]} 기록이에요!`;let last='';try{last=localStorage.getItem('wordRainName')||''}catch(e){}input.value=last;input.disabled=false;btn.disabled=false;btn.textContent='OK';neModal.hidden=false;sfx.levelUp()}
// 이름은 영어 대문자, 숫자, 한글만 (한글 조합 중에는 건드리지 않음)
function tidy(){const v=cleanName(input.value);if(v!==input.value)input.value=v}input.addEventListener('input',e=>{if(!e.isComposing)tidy()});input.addEventListener('compositionend',tidy);

form.addEventListener('submit',async e=>{e.preventDefault();if(!pending||btn.disabled)return;const name=cleanName(input.value);if(!name){msg.textContent='이름을 1~3글자로 입력해 주세요';input.focus();return}btn.disabled=true;btn.textContent='...';try{localStorage.setItem('wordRainName',name)}catch(e){}const id=Date.now().toString(36)+Math.random().toString(36).slice(2,8);const entry={id,name,score:pending.score,mode:pending.mode,t:Date.now()};let result;try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name,score:pending.score,mode:pending.mode})});if(!r.ok)throw 0;result=await r.json();online=true}catch(err){result=localSave(entry);online=false}lastId=id;try{localStorage.setItem('wordRainLastId',id)}catch(e){}board=result.scores||board;pending=null;input.disabled=true;input.blur();btn.textContent='✓';setTimeout(()=>{neModal.hidden=true},1600);msg.textContent=result.rank&&result.rank<=TOP_N?`${RANK_LABEL[result.rank-1]}에 이름을 올렸어요!`:'기록했어요!';sfx.start()});
$('#neClose').addEventListener('click',()=>{sfx.click();input.blur();neModal.hidden=true});neModal.addEventListener('click',e=>{if(e.target===neModal){input.blur();neModal.hidden=true}});
refresh();return{refresh,onGameEnd}})();
