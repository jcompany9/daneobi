// 카카오톡, 인스타그램 같은 앱 안 브라우저로 열리면 크롬이나 사파리로 다시 열기.
// 앱 안 브라우저는 이미지 저장, 키보드, 소리 같은 기능이 막혀 있는 경우가 많아서 게임을 제대로 즐기기 어려움.
(function () {
  var ua = navigator.userAgent || '';
  var IN_APP = /KAKAOTALK|KAKAOSTORY|NAVER\(inapp|Instagram|FBAN|FBAV|FB_IAB|Line\/|BAND\/|DaumApps|everytimeApp|Twitter|Barcelona|Snapchat|TikTok|BytedanceWebview|musical_ly/i;
  if (!IN_APP.test(ua)) return;

  var url = location.href;
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // 1. 카카오톡: 카카오톡이 제공하는 "외부 브라우저로 열기" 주소 (아이폰, 안드로이드 모두)
  if (/KAKAOTALK/i.test(ua)) {
    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
    return;
  }
  // 2. 라인: 주소 뒤에 openExternalBrowser=1을 붙이면 외부 브라우저로 열림
  if (/Line\//i.test(ua)) {
    if (!/openExternalBrowser=1/.test(url)) {
      location.replace(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'openExternalBrowser=1');
    }
    return;
  }
  // 3. 안드로이드의 다른 앱: 크롬으로 열기
  if (isAndroid) {
    var noScheme = url.replace(/^https?:\/\//, '');
    location.href = 'intent://' + noScheme + '#Intent;scheme=https;package=com.android.chrome;end';
    return;
  }
  // 4. 아이폰의 다른 앱: 사파리 열기를 시도하고(iOS 17 이상), 안 되면 안내 화면 표시
  if (isIOS) {
    location.href = 'x-safari-' + url;
    setTimeout(showGuide, 600);
  }

  function showGuide() {
    if (document.hidden) return; // 사파리로 넘어갔으면 안내 필요 없음
    var ready = function () {
      if (document.querySelector('.inapp-guide')) return;
      var box = document.createElement('div');
      box.className = 'inapp-guide';
      box.setAttribute('role', 'dialog');
      box.innerHTML =
        '<div>' +
        '<p class="ig-title">Safari에서 열어주세요</p>' +
        '<p class="ig-text">이 앱 안에서는 결과 저장, 키보드, 소리가<br>제대로 동작하지 않을 수 있어요.</p>' +
        '<p class="ig-step">오른쪽 아래나 위의 <b>···</b> 또는 <b>공유</b> 버튼을 누르고 <b>Safari로 열기</b> (또는 <b>브라우저로 열기</b>)를 선택하세요.</p>' +
        '<button type="button" class="ig-copy">링크 복사하기</button>' +
        '<button type="button" class="ig-close">그냥 여기서 할게요</button>' +
        '</div>';
      document.body.appendChild(box);
      box.querySelector('.ig-copy').onclick = function () {
        var btn = this;
        var done = function () { btn.textContent = '복사했어요! Safari 주소창에 붙여넣기 하세요'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { prompt('이 링크를 복사하세요', url); });
        } else {
          prompt('이 링크를 복사하세요', url);
        }
      };
      box.querySelector('.ig-close').onclick = function () { box.remove(); };
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
    else ready();
  }
})();
