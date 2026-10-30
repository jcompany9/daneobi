// ===== 게임 전용 한글 키보드 =====
// 휴대폰 키보드는 기종·설정마다 높이가 달라 화면을 가리고, 아이폰에서는 자꾸 꺼짐.
// 터치 기기에서는 게임 안에 작은 한글 키보드를 직접 그려서 씀. (PC는 실제 키보드 그대로)
// 입력창 옆 버튼으로 두벌식 → 천지인 → 휴대폰 키보드 순서로 바꿀 수 있고, 고른 것은 기억함.
// game.js 다음에 불러와야 함 (els, answer, typingActive를 씀)
const vk=(()=>{
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',JUNG='ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',JONG=' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
const VV={'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ'};
const TT={'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ'};
// 낱자(ㄱ, ㅏ …) 목록을 글자로 조합. 받침 뒤에 모음이 오면 받침이 다음 글자로 넘어감 (각+ㅏ → 가가)
function compose(list){let out='',c='',v='',t='',t2='';
  const flush=()=>{if(c&&v)out+=String.fromCharCode(0xAC00+(CHO.indexOf(c)*21+JUNG.indexOf(v))*28+JONG.indexOf((t2?TT[t+t2]:t)||' '));else out+=c+v;c=v=t=t2=''};
  for(const k of list){
    if(CHO.includes(k)){
      if(!v||!c){flush();c=k}
      else if(!t){if(JONG.includes(k))t=k;else{flush();c=k}}
      else if(!t2&&TT[t+k])t2=k;
      else{flush();c=k}
    }else if(JUNG.includes(k)){
      if(t2){const n=t2;t2='';flush();c=n;v=k}
      else if(t){const n=t;t='';flush();c=n;v=k}
      else if(v){if(VV[v+k])v=VV[v+k];else{flush();v=k}}
      else v=k;
    }else{flush();out+=k}
  }
  flush();return out}

// 천지인: ㅣ·ㅡ를 눌러 모음을 만들고, 자음 키는 누를 때마다 ㄱ→ㅋ→ㄲ처럼 바뀜
const CJI_V={'ㅣ':'ㅣ','ㅡ':'ㅡ','·':'·','··':'‥','ㅣ·':'ㅏ','ㅣ··':'ㅑ','·ㅣ':'ㅓ','··ㅣ':'ㅕ','·ㅡ':'ㅗ','··ㅡ':'ㅛ','ㅡ·':'ㅜ','ㅡ··':'ㅠ',
  'ㅣ·ㅣ':'ㅐ','ㅣ··ㅣ':'ㅒ','·ㅣㅣ':'ㅔ','··ㅣㅣ':'ㅖ','·ㅡㅣ':'ㅚ','·ㅡㅣ·':'ㅘ','·ㅡㅣ·ㅣ':'ㅙ','ㅡ·ㅣ':'ㅟ','ㅡ··ㅣ':'ㅝ','ㅡ··ㅣㅣ':'ㅞ','ㅡㅣ':'ㅢ'};
const CJI_C={g:'ㄱㅋㄲ',n:'ㄴㄹ',d:'ㄷㅌㄸ',b:'ㅂㅍㅃ',s:'ㅅㅎㅆ',j:'ㅈㅊㅉ',o:'ㅇㅁ'};
const SHIFT={'ㅂ':'ㅃ','ㅈ':'ㅉ','ㄷ':'ㄸ','ㄱ':'ㄲ','ㅅ':'ㅆ','ㅐ':'ㅒ','ㅔ':'ㅖ'};
const QW_ROWS=['ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ','ㅁㄴㅇㄹㅎㅗㅓㅏㅣ','ㅋㅌㅊㅍㅠㅜㅡ'];
// 실제 키보드(태블릿 키보드 등)로 쳐도 두벌식 자리대로 들어가게
const PHYS={q:'ㅂ',w:'ㅈ',e:'ㄷ',r:'ㄱ',t:'ㅅ',y:'ㅛ',u:'ㅕ',i:'ㅑ',o:'ㅐ',p:'ㅔ',a:'ㅁ',s:'ㄴ',d:'ㅇ',f:'ㄹ',g:'ㅎ',h:'ㅗ',j:'ㅓ',k:'ㅏ',l:'ㅣ',z:'ㅋ',x:'ㅌ',c:'ㅊ',v:'ㅍ',b:'ㅠ',n:'ㅜ',m:'ㅡ',Q:'ㅃ',W:'ㅉ',E:'ㄸ',R:'ㄲ',T:'ㅆ',O:'ㅒ',P:'ㅖ'};
const MODES=['qwerty','cji','system'],LABEL={qwerty:'두벌',cji:'천지',system:'폰'};
const MAX=20,touch=matchMedia('(pointer:coarse)').matches;
let mode='qwerty';try{const m=localStorage.getItem('wordRainKb');if(MODES.includes(m))mode=m}catch(e){}
let units=[],shift=false,lastKey=null,rep=0;
const input=els.input,form=els.form,root=document.documentElement;
const pad=document.createElement('div');pad.id='vkb';pad.className='vkb';pad.setAttribute('aria-label','한글 키보드');form.after(pad);
const toggle=document.createElement('button');toggle.type='button';toggle.className='kb-toggle';toggle.setAttribute('aria-label','키보드 바꾸기');form.prepend(toggle);
const on=()=>touch&&mode!=='system';
const key=(k,label,cls='')=>`<button type="button" class="vk-key ${cls}" data-k="${k}">${label}</button>`;
function render(){
  if(mode==='qwerty'){
    const r=QW_ROWS.map(s=>[...s].map(ch=>key(ch,shift&&SHIFT[ch]||ch,(JUNG.includes(ch)?'v':'')+(SHIFT[ch]?' sh':''))).join(''));
    pad.innerHTML=`<div class="vk-qw">${r[0]}<span class="vk-gap"></span>${r[1]}${key('shift','⇧','fn'+(shift?' on':''))}${r[2]}${key('bs','⌫','fn')}</div>`;
  }else if(mode==='cji'){
    const c=k=>key(k,`<b>${CJI_C[k][0]}</b><small>${CJI_C[k].slice(1)}</small>`);
    pad.innerHTML=`<div class="vk-cji">${key('ㅣ','ㅣ','v')}${key('·','·','v')}${key('ㅡ','ㅡ','v')}${key('bs','⌫','fn')}${c('g')}${c('n')}${c('d')}${key('enter','↵','fn enter')}${c('b')}${c('s')}${c('j')}<span></span>${c('o')}${key('sep','→','fn')}</div>`;
  }else pad.innerHTML='';
  toggle.textContent=LABEL[mode];
}
function apply(){
  toggle.hidden=!touch;form.classList.toggle('has-kbt',touch);root.classList.toggle('vk-on',on());
  input.readOnly=on();input.inputMode=on()?'none':'text';pad.hidden=!on();render();
}
function update(){input.value=compose(units.map(u=>u.vg!==undefined?CJI_V[u.vg]:u.j))}
function back(){const u=units[units.length-1];if(!u)return;if(u.vg&&u.vg.length>1)u.vg=u.vg.slice(0,-1);else units.pop()}
function add(u){units.push(u);update();if(input.value.length>MAX){units.pop();update()}}
function press(k){
  if(!typingActive())return;
  if(k==='enter'){lastKey=null;answer({preventDefault(){}});return}
  if(k==='shift'){shift=!shift;render();return}
  if(k==='sep'){lastKey=null;return}
  if(k==='bs'){lastKey=null;back();update();return}
  if(mode==='cji'&&CJI_C[k]){
    const set=CJI_C[k],u=units[units.length-1];
    if(lastKey===k&&u?.ck===k){u.i=(u.i+1)%set.length;u.j=set[u.i];update()}else add({ck:k,i:0,j:set[0]});
    lastKey=k;return}
  lastKey=null;
  if(mode==='cji'&&'ㅣ·ㅡ'.includes(k)){const u=units[units.length-1];if(u?.vg!==undefined&&CJI_V[u.vg+k]){u.vg+=k;update()}else add({vg:k});return}
  const j=shift&&SHIFT[k]||k;if(shift){shift=false;render()}
  add({j});
}
pad.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-k]');if(!b)return;e.preventDefault();b.classList.add('down');press(b.dataset.k);navigator.vibrate?.(6);
  if(b.dataset.k==='bs'){clearTimeout(rep);rep=setTimeout(function again(){press('bs');rep=setTimeout(again,65)},380)}});
const release=e=>{const b=e.target.closest?.('[data-k]');b?.classList.remove('down');if(!b||b.dataset.k==='bs')clearTimeout(rep)};
['pointerup','pointercancel','pointerout'].forEach(t=>pad.addEventListener(t,release));
pad.addEventListener('contextmenu',e=>e.preventDefault());
// 키보드 바꾸기: 두벌식 → 천지인 → 휴대폰 키보드
toggle.addEventListener('mousedown',e=>e.preventDefault());
toggle.addEventListener('click',()=>{mode=MODES[(MODES.indexOf(mode)+1)%MODES.length];try{localStorage.setItem('wordRainKb',mode)}catch(e){}
  units=[];shift=false;lastKey=null;input.value='';apply();
  if(on())input.blur();else if(typingActive())input.focus({preventScroll:true});
  setTimeout(()=>window.dispatchEvent(new Event('resize')),60)});
// 게임 키보드를 쓰는 중에는 입력창을 눌러도 휴대폰 키보드가 뜨지 않게
input.addEventListener('pointerdown',e=>{if(on())e.preventDefault()});
input.addEventListener('focus',()=>{if(on())input.blur()});
document.addEventListener('keydown',e=>{
  if(!on()||!typingActive()||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
  if(e.target!==document.body&&e.target.tagName==='INPUT'&&e.target!==input)return;
  let k=null;if(e.key==='Enter')k='enter';else if(e.key==='Backspace')k='bs';else if(PHYS[e.key])k=PHYS[e.key];else if(CHO.includes(e.key)||JUNG.includes(e.key))k=e.key;
  if(!k)return;e.preventDefault();
  if(k==='enter'||k==='bs')press(k);else{lastKey=null;add({j:k})}
});
apply();
return{on,clear(){units=[];lastKey=null;if(shift){shift=false;render()}},compose};
})();
window.vk=vk;
