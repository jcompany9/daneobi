// ===== 화면 효과 (정답·오답 연출, 점수판, 바닥, 레벨 업, 결과 화면) =====
// game.js가 window.fx?.이름(...)으로 부름. 이 파일이 없어도 게임은 그대로 돌아감
const fx=(()=>{
const field=els.field,scoreEl=els.score,comboStat=$('.hud .combo');
const TIER_COLORS={elementary:'#57d7d9',middle:'#7ed957',high:'#ffd84d',intermediate:'#ff9f43',advanced:'#b07cff'};

// 도트 조각을 (x,y)에서 사방으로 튀김. 좌표는 단어 화면(playfield) 기준
function burst(x,y,colors,n=12,dist=60,up=0){
  for(let k=0;k<n;k++){const s=document.createElement('i');s.className='spark fx-spark';const a=Math.random()*Math.PI*2,d=dist*(.45+Math.random()*.7);
    s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d-up+'px');s.style.background=colors[k%colors.length];
    if(Math.random()<.35){s.style.width=s.style.height='8px'}field.appendChild(s);setTimeout(()=>s.remove(),620)}}

// 점수판 위치 (단어 화면 기준)
function scorePos(){const f=field.getBoundingClientRect(),r=scoreEl.getBoundingClientRect();return{x:r.left-f.left+r.width/2,y:r.top-f.top+r.height/2}}

// 정답: 단어 자리에서 단계 색 조각이 작게 터짐
function correct(w,gain,combo,bonus){
  const W=w.node.offsetWidth||80,H=w.node.offsetHeight||30,cx=(w.x||0)+W/2,cy=(w.y??0)+H/2;
  burst(cx,cy,bonus?['#ffd84d','#fff7dc']:[TIER_COLORS[w.difficulty]||'#57d7d9','#fff7dc'],8,48);
}

// 오답: 입력칸이 좌우로 흔들림
function wrong(){const bar=els.form;bar.classList.remove('fx-shake');void bar.offsetWidth;bar.classList.add('fx-shake')}

// 점수판: 숫자가 목표 점수까지 빠르게 올라감, 콤보 2 이상이면 콤보 칸이 나타남
let shown=0,target=0,tween=0;
function hud(score,combo){
  if(score<target||score===0){shown=target=score;cancelAnimationFrame(tween);scoreEl.textContent=score.toLocaleString()}
  else if(score>target){target=score;scoreEl.classList.remove('fx-pop');void scoreEl.offsetWidth;scoreEl.classList.add('fx-pop');
    const from=shown,t0=performance.now();cancelAnimationFrame(tween);
    const step=now=>{const k=Math.min(1,(now-t0)/380);shown=Math.round(from+(target-from)*(1-(1-k)**3));scoreEl.textContent=shown.toLocaleString();if(k<1)tween=requestAnimationFrame(step)};tween=requestAnimationFrame(step)}
  const on=combo>=2,was=comboStat.classList.contains('on');comboStat.classList.toggle('on',on);comboStat.classList.toggle('hot',combo>=10);
  if(on&&(!was||combo!==hud.last)){comboStat.classList.remove('fx-pop');void comboStat.offsetWidth;comboStat.classList.add('fx-pop')}
  hud.last=combo;
}

// 결과 화면: 점수가 0부터 올라가고, 최고 기록이면 NEW BEST 도장이 찍힘
function result(score,best){
  const el=$('#finalScore'),ring=$('.score-ring');ring.querySelector('.fx-stamp')?.remove();
  const t0=performance.now()+350,dur=Math.min(1400,500+score/40);el.textContent='0';
  const step=now=>{const k=Math.max(0,Math.min(1,(now-t0)/dur));el.textContent=Math.round(score*(1-(1-k)**3)).toLocaleString();if(k<1)requestAnimationFrame(step);else if(best){const s=document.createElement('em');s.className='fx-stamp';s.textContent='NEW BEST!';ring.appendChild(s);sfx.levelUp?.()}};
  requestAnimationFrame(step)}

hud(0,0);
return{correct,wrong,hud,result,burst};
})();
window.fx=fx;
