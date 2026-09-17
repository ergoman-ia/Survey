/* =========================================================
 * 공통 모달 창 — 브라우저 기본 alert/confirm/prompt 대신 사용
 * ---------------------------------------------------------
 *   await Modal.alert('메시지', '제목(선택)')             → 확인 버튼 하나
 *   await Modal.confirm('메시지', '제목(선택)', { okText, cancelText, danger })  → true / false (셋째 인자는 선택: 버튼 글자, 빨간 확인 버튼)
 *   await Modal.prompt('메시지', '기본값', '제목(선택)')  → 입력값 / null(취소)
 *   Modal.toast('짧은 안내')                              → 오른쪽 아래에 3초간 표시(대기 없음)
 * 모두 Promise를 돌려주므로 호출하는 함수는 async여야 합니다.
 * ========================================================= */
const Modal = (() => {
  const css = `
  .ui-modal-bg { position: fixed; inset: 0; background: rgba(20, 30, 50, .45); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
  .ui-modal { background: #fff; border-radius: 14px; width: min(460px, 100%); box-shadow: 0 20px 60px rgba(0, 0, 0, .25); padding: 22px 22px 18px; font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; color: #222; animation: ui-modal-in .15s ease-out; }
  @keyframes ui-modal-in { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
  .ui-modal h3 { margin: 0 0 10px; font-size: 17px; color: #1f5fbf; }
  .ui-modal .msg { white-space: pre-wrap; line-height: 1.6; font-size: 14px; max-height: 60vh; overflow: auto; }
  .ui-modal input { width: 100%; margin-top: 12px; border: 1px solid #dde3ec; border-radius: 8px; padding: 9px 10px; font: inherit; }
  .ui-modal .btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
  .ui-modal button { padding: 8px 18px; border-radius: 8px; border: 1px solid #1f5fbf; font: inherit; cursor: pointer; background: #fff; color: #1f5fbf; }
  .ui-modal button.primary { background: #1f5fbf; color: #fff; }
  .ui-modal button.danger { background: #d33; border-color: #d33; color: #fff; }
  .ui-toast { position: fixed; right: 18px; bottom: 18px; background: #222; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 14px; z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,.25); opacity: 0; transition: opacity .2s; }
  .ui-toast.on { opacity: 1; }`;
  function ensureStyle() {
    if (document.getElementById('ui-modal-style')) return;
    const st = document.createElement('style'); st.id = 'ui-modal-style'; st.textContent = css; document.head.appendChild(st);
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 자동 응답 모드(자동 시험용 갈고리, 화면 코드에서는 쓰지 않음): window.__MODAL_AUTO = { confirm: true, prompt: '값' } 이면 창을 띄우지 않고 바로 답합니다.
  function auto(kind, msg, def) {
    const a = window.__MODAL_AUTO; if (!a) return undefined;
    if (a.log) a.log(kind, msg);
    if (kind === 'alert') return true;
    if (kind === 'confirm') return typeof a.confirm === 'function' ? a.confirm(msg) : (a.confirm !== false);
    if (kind === 'prompt') return typeof a.prompt === 'function' ? a.prompt(msg, def) : (a.prompt !== undefined ? a.prompt : def);
  }

  function open({ kind, msg, title, def, okText, cancelText, danger }) {
    const autoVal = auto(kind, msg, def);
    if (autoVal !== undefined) return Promise.resolve(autoVal);
    ensureStyle();
    return new Promise(resolve => {
      const prev = document.activeElement;
      const bg = document.createElement('div'); bg.className = 'ui-modal-bg';
      bg.innerHTML = `<div class="ui-modal" role="dialog" aria-modal="true">
        ${title ? `<h3>${esc(title)}</h3>` : ''}
        <div class="msg">${esc(msg)}</div>
        ${kind === 'prompt' ? `<input type="text" value="${esc(def ?? '')}">` : ''}
        <div class="btns">
          ${kind !== 'alert' ? `<button type="button" data-r="cancel">${esc(cancelText || '취소')}</button>` : ''}
          <button type="button" class="${danger ? 'danger' : 'primary'}" data-r="ok">${esc(okText || '확인')}</button>
        </div></div>`;
      const input = bg.querySelector('input');
      const done = r => {
        bg.remove();
        if (prev && prev.focus) try { prev.focus(); } catch (_) {}
        if (kind === 'alert') resolve(true);
        else if (kind === 'confirm') resolve(r === 'ok');
        else resolve(r === 'ok' ? input.value : null);
      };
      // 키 처리는 이 창 안에서만(창이 겹쳐도 서로 영향 없음). Tab은 창 안의 입력·버튼 사이에서만 돌게 함
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); done('cancel'); }
        else if (e.key === 'Enter' && (kind !== 'prompt' || e.target === input)) { e.preventDefault(); done('ok'); }
        else if (e.key === 'Tab') {
          const f = [...bg.querySelectorAll('input, button')]; if (!f.length) return;
          const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i >= f.length - 1 ? 0 : i + 1);
          e.preventDefault(); f[n].focus();
        }
      };
      bg.addEventListener('keydown', onKey);
      bg.addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (b) done(b.dataset.r); });
      document.body.appendChild(bg);
      (input || bg.querySelector('button[data-r="ok"]')).focus();
      if (input) input.select();
    });
  }

  let toastTimer = null;
  function toast(msg) {
    ensureStyle();
    let t = document.getElementById('ui-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ui-toast'; t.className = 'ui-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 3000);
  }

  return {
    alert: (msg, title) => open({ kind: 'alert', msg, title: title || '안내' }),
    confirm: (msg, title, opts) => open({ kind: 'confirm', msg, title: title || '확인', ...(opts || {}) }),
    prompt: (msg, def, title) => open({ kind: 'prompt', msg, def, title: title || '입력' }),
    toast
  };
})();
