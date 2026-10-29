const WORDS=[
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
].map(([en,ko],i)=>({id:i,en,answers:ko.split('|'),ko}));

const $=s=>document.querySelector(s);const screens=['startScreen','gameScreen','resultScreen'];
const els={start:$('#startBtn'),retry:$('#retryBtn'),home:$('#homeBtn'),pause:$('#pauseBtn'),resume:$('#resumeBtn'),quit:$('#quitBtn'),modal:$('#pauseModal'),field:$('#playfield'),layer:$('#wordLayer'),form:$('#answerForm'),input:$('#answer'),score:$('#score'),combo:$('#combo'),lives:$('#lives'),feedback:$('#feedback'),ground:$('.ground')};
let state,raf,lastTime,spawnClock;
// 단어는 화면 높이와 상관없이 같은 시간 동안 떨어짐 (p: 0=맨 위, 1=땅). 키보드로 화면이 줄어도 단어가 한꺼번에 놓침 처리되지 않음
const TOP=-52,FALL=360;
// 모바일 키보드가 열리면 실제로 보이는 영역(visualViewport)에 맞춰 게임 화면 크기와 위치를 조정
function fitViewport(){const vv=window.visualViewport,root=document.documentElement;const h=vv?vv.height:window.innerHeight;root.style.setProperty('--app-h',h+'px');root.style.setProperty('--app-top',(vv?vv.offsetTop:0)+'px');root.classList.toggle('kb-open',!!vv&&vv.height<window.innerHeight*.8||document.activeElement===els.input&&matchMedia('(pointer:coarse)').matches)}
window.visualViewport?.addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('scroll',fitViewport);window.addEventListener('resize',fitViewport);els.input.addEventListener('focus',()=>setTimeout(fitViewport,50));els.input.addEventListener('blur',()=>setTimeout(fitViewport,50));fitViewport();
// 가로 화면 막기: 터치 기기에서 가로로 돌리면 안내를 띄우고 게임을 멈춤.
// 키보드 때문에 화면이 가로로 길어지는 경우와 헷갈리지 않도록 화면 크기가 아니라 기기 방향(screen.orientation)으로 판단
function isLandscape(){if(!matchMedia('(pointer:coarse)').matches)return false;const t=screen.orientation?.type;if(t)return t.startsWith('landscape');if(typeof window.orientation==='number')return Math.abs(window.orientation)===90;return screen.width>screen.height}
function checkOrientation(){const land=isLandscape();document.documentElement.classList.toggle('landscape',land);if(land&&state?.running&&!state.paused)pause()}
screen.orientation?.addEventListener?.('change',checkOrientation);window.addEventListener('orientationchange',checkOrientation);window.addEventListener('resize',checkOrientation);checkOrientation();
function lockPortrait(){try{screen.orientation?.lock?.('portrait').catch(()=>{})}catch(e){}}
// 화면 크기별 난이도: 단어가 떨어지는 공간이 짧으면 동시에 나오는 단어 수를 줄임
function maxWords(){const h=els.field.clientHeight;return h<280?3:h<400?4:5}
// 단어가 겹치지 않게 화면을 세로 칸으로 나누고, 위쪽에 아직 단어가 있는 칸은 피해서 떨어뜨림
function pickX(wordW){const W=els.field.clientWidth-16,lanes=Math.max(2,Math.floor(W/120)),laneW=W/lanes;const busy=new Set(state.active.filter(w=>w.p<.4).map(w=>w.lane));const free=[...Array(lanes).keys()].filter(i=>!busy.has(i));const pool=free.length?free:[...Array(lanes).keys()];const lane=pool[Math.floor(Math.random()*pool.length)];pickX.lane=lane;const x=8+lane*laneW+Math.random()*Math.max(0,laneW-wordW);return Math.max(8,Math.min(x,W+8-wordW))}
function show(id){screens.forEach(x=>$('#'+x).classList.toggle('active',x===id))}
function reset(){state={score:0,combo:0,maxCombo:0,lives:3,correct:0,missed:[],active:[],deck:[...WORDS].sort(()=>Math.random()-.5),running:true,paused:false,elapsed:0};els.layer.innerHTML='';spawnClock=0;lastTime=performance.now();updateHud()}
function start(){lockPortrait();reset();show('gameScreen');spawn();els.input.value='';setTimeout(()=>els.input.focus(),120);cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function spawn(){if(!state.deck.length)state.deck=[...WORDS].sort(()=>Math.random()-.5);const word=state.deck.pop(),node=document.createElement('div');node.className='word';node.textContent=word.en;els.layer.appendChild(node);const x=pickX(node.offsetWidth);const item={...word,node,x,lane:pickX.lane,p:0,speed:25+Math.min(42,state.elapsed/20)+Math.random()*8};state.active.push(item);node.style.transform=`translate(${item.x}px,${TOP}px)`}
function loop(now){if(!state?.running)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;if(!state.paused){state.elapsed+=dt;spawnClock+=dt;const interval=Math.max(1.25,2.55-state.elapsed/65);if(spawnClock>=interval&&state.active.length<maxWords()){spawnClock=0;spawn()}const limit=els.field.clientHeight-els.ground.offsetHeight-48,dist=Math.max(1,limit-TOP);for(let i=state.active.length-1;i>=0;i--){const w=state.active[i];w.p+=w.speed*dt/FALL;const y=TOP+w.p*dist;w.node.style.transform=`translate(${w.x}px,${y}px)`;w.node.classList.toggle('danger',w.p>.72);if(w.p>=1){miss(i);if(!state.running)return}}}raf=requestAnimationFrame(loop)}
function norm(v){return v.trim().replace(/\s+/g,'').replace(/[.!?]/g,'')}
function answer(e){e.preventDefault();if(!state?.running||state.paused)return;const value=norm(els.input.value);if(!value)return;let idx=state.active.findIndex(w=>w.answers.some(a=>norm(a)===value));if(idx<0){state.combo=0;flash('다시 생각해봐요','#ef5b61');navigator.vibrate?.(40)}else{const w=state.active[idx];w.node.remove();state.active.splice(idx,1);state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.correct++;state.score+=100+Math.min(500,(state.combo-1)*20);flash(state.combo>=3?`${state.combo} COMBO!`:'정답!','#ec6b4d');navigator.vibrate?.(20)}els.input.value='';updateHud()}
function miss(i){const [w]=state.active.splice(i,1);w.node.remove();state.missed.push(w);state.lives--;state.combo=0;flash(`${w.en} = ${w.answers[0]}`,'#ef5b61');navigator.vibrate?.([40,30,40]);updateHud();if(state.lives<=0)end()}
function flash(text,color){els.feedback.textContent=text;els.feedback.style.color=color;els.feedback.classList.remove('show');void els.feedback.offsetWidth;els.feedback.classList.add('show')}
function updateHud(){els.score.textContent=state.score.toLocaleString();els.combo.textContent=state.combo;const l=Math.max(0,state.lives);els.lives.textContent='♥'.repeat(l)+'♡'.repeat(3-l)}
function pause(){if(!state?.running)return;state.paused=true;els.modal.classList.add('open');els.input.blur()}
function resume(){state.paused=false;lastTime=performance.now();els.modal.classList.remove('open');els.input.focus()}
function end(){if(!state?.running)return;state.running=false;cancelAnimationFrame(raf);els.modal.classList.remove('open');const best=Math.max(Number(localStorage.getItem('wordRainBest')||0),state.score);localStorage.setItem('wordRainBest',best);$('#finalScore').textContent=state.score.toLocaleString();$('#correctCount').textContent=state.correct;$('#maxCombo').textContent=state.maxCombo;$('#missCount').textContent=state.missed.length;$('#bestStart').textContent=best.toLocaleString();const unique=[...new Map(state.missed.map(w=>[w.en,w])).values()].slice(0,4);$('#review').innerHTML=unique.length?'<p style="background:transparent;font-weight:900">놓친 단어 복습</p>'+unique.map(w=>`<p><b>${w.en}</b> &nbsp; ${w.answers.join(', ')}</p>`).join(''):'<p>놓친 단어가 없어요. 완벽해요! 🎉</p>';show('resultScreen')}
els.start.onclick=start;els.retry.onclick=start;els.home.onclick=()=>{show('startScreen');$('#bestStart').textContent=Number(localStorage.getItem('wordRainBest')||0).toLocaleString()};els.pause.onclick=pause;els.resume.onclick=resume;els.quit.onclick=end;els.form.onsubmit=answer;document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.running&&!state.paused)pause()});$('#bestStart').textContent=Number(localStorage.getItem('wordRainBest')||0).toLocaleString();
