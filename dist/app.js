// ===== 앱(안드로이드·아이폰)에서만 쓰는 처리 =====
// 웹에서는 아무것도 안 함. 앱에서는 Capacitor 플러그인(App, Share, Filesystem)을 씀
(()=>{if(!IS_APP)return;
const P=window.Capacitor.Plugins||{};
document.documentElement.classList.add('is-app');

// 안드로이드 뒤로 가기 버튼: 게임 중이면 일시정지, 다른 화면이면 처음으로, 처음 화면이면 앱 종료
P.App?.addListener('backButton',()=>{
  const on=id=>$('#'+id).classList.contains('active');
  if(document.querySelector('.image-modal')){document.querySelector('.image-modal').remove();return}
  if(!$('#neModal').hidden){$('#neModal').hidden=true;return}
  if($('.app').classList.contains('rank-open')){$('#hsClose').click();return}
  if(on('gameScreen')){if(state?.running&&!state.paused&&!state.ending)pause();else if(state?.paused)resume();return}
  if(on('noteScreen')||on('resultScreen')){show('startScreen');return}
  P.App.exitApp();
});
// 앱을 내렸다가 다시 열면 게임은 일시정지 상태로 (visibilitychange도 있지만 앱 상태가 더 정확함)
P.App?.addListener('appStateChange',({isActive})=>{if(!isActive&&state?.running&&!state.paused&&!state.ending)pause()});

// 결과 공유: 결과 이미지를 앱 임시 폴더에 저장한 뒤 휴대폰 공유 창으로 보냄
async function shareImage(withText){
  const label=els.share.querySelector('.btn-label');const old=label.textContent;label.textContent='준비 중...';
  try{
    const canvas=await drawResultImage();const data=canvas.toDataURL('image/png').split(',')[1];
    const {uri}=await P.Filesystem.writeFile({path:resultFileName(),data,directory:'CACHE'});
    const text=`단어비에서 ${state.score.toLocaleString()}점! 나보다 잘할 수 있어? https://daneobi.vercel.app`;
    await P.Share.share({title:'단어비',text:withText?text:undefined,files:[uri],dialogTitle:'결과 공유하기'});
  }catch(e){/* 사용자가 공유 창을 닫아도 여기로 옴 */}
  label.textContent=old;
}
// 앱에서는 "이미지 저장" 대신 공유 하나로 (공유 창에서 갤러리·드라이브 저장도 고를 수 있음)
els.save.style.display='none';
els.share.onclick=()=>shareImage(true);
})();
