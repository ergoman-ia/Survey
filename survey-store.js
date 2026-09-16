/* =========================================================
 * 설문 저장소 공통 모듈 (모든 화면이 함께 사용)
 * ---------------------------------------------------------
 * Firestore 구조 — 설문마다 데이터가 완전히 분리됩니다.
 *
 *   surveys/{설문ID}                 설문 한 건: 제목, 설명, 문항, 상태(active/archived) …
 *   surveys/{설문ID}/recipients/{토큰}   이 설문의 대상자와 발송·열람·제출 현황
 *   surveys/{설문ID}/responses/{자동ID}  이 설문의 응답
 *
 * 링크 형식
 *   survey.html?s=설문ID&t=토큰   메일로 보낸 개인 링크
 *   survey.html?s=설문ID          공개 응답 링크
 *
 * survey-config.js의 SURVEY는 "새 설문 만들기"의 기본 틀(템플릿)로만 쓰입니다.
 *
 * 문항 유형(type)
 *   single 객관식 / multi 체크박스 / dropdown 드롭다운 / scale 선형 배율 /
 *   rating 등급(별점) / short 단답형 / long 장문형  (예전 'text'는 장문형)
 * ========================================================= */

const SURVEY_TYPES = {
  single:   { name: '객관식(하나 선택)' },
  multi:    { name: '체크박스(여러 개 선택)' },
  dropdown: { name: '드롭다운' },
  scale:    { name: '선형 배율' },
  rating:   { name: '등급(별점)' },
  short:    { name: '단답형' },
  long:     { name: '장문형' }
};

// 예전 형식 보정: text → long, '기타' 선택지 → 기타 직접 입력, 기본값 채우기
function normalizeSurvey(s) {
  s.questions = (s.questions || []).map(q => {
    q = { ...q };
    if (q.type === 'text') q.type = 'long';
    if (!SURVEY_TYPES[q.type]) q.type = 'short';
    if ((q.type === 'single' || q.type === 'multi' || q.type === 'dropdown') && !Array.isArray(q.options)) q.options = [];
    if ((q.type === 'single' || q.type === 'multi') && q.options.includes('기타')) { q.options = q.options.filter(o => o !== '기타'); q.allowOther = true; }
    if (q.type === 'scale') { q.min = Number(q.min ?? 1); q.max = Number(q.max ?? 5); q.labels = q.labels || ['', '']; }
    if (q.type === 'rating') { q.max = Number(q.max ?? 5); q.icon = q.icon || 'star'; }
    return q;
  });
  if (s.openEnabled === undefined) s.openEnabled = true;
  if (!s.status) s.status = 'active';
  return s;
}

function firebaseConfigured() {
  return typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey && !String(FIREBASE_CONFIG.apiKey).startsWith('여기에');
}

// 설문 ID 만들기: 날짜 + 임의 문자 (예: s20260916-k3f9a)
function newSurveyId() {
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  return 's' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + Math.random().toString(36).slice(2, 7);
}

// 설문 정의에서 저장할 필드만 추립니다(문항 초안 표시 등 편집용 값 제외)
function surveyPayload(s) {
  const m = JSON.parse(JSON.stringify(s));
  delete m.id;
  m.questions = (m.questions || []).map(q => { delete q.draft; if (q.options) q.options = q.options.map(o => String(o).trim()).filter(Boolean); return q; });
  return m;
}

const SurveyStore = {
  db: null,
  init(db) { this.db = db; return this; },
  col() { return this.db.collection('surveys'); },
  doc(id) { return this.col().doc(id); },
  recipients(id) { return this.doc(id).collection('recipients'); },
  responses(id) { return this.doc(id).collection('responses'); },

  // 설문 목록 (최근 만든 순). includeArchived=false면 보관된 설문 제외
  async list(includeArchived) {
    const snap = await this.col().get();
    return snap.docs.map(d => ({ id: d.id, ...normalizeSurvey(d.data()) }))
      .filter(s => includeArchived || s.status !== 'archived')
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  },
  async get(id) {
    const snap = await this.doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...normalizeSurvey(snap.data()) };
  },
  // 진행 중 설문 중 응답을 받을 수 있는 것 (index.html · survey.html에서 설문ID가 없을 때 사용)
  async listOpen() {
    const all = await this.list(false);
    const now = new Date();
    return all.filter(s => !(s.closeAfterDeadline && s.deadline && now > new Date(s.deadline + 'T23:59:59')));
  },
  async create(def, id) {
    id = id || newSurveyId();
    const payload = surveyPayload(def);
    payload.status = payload.status || 'active';
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    payload.createdAtMs = Date.now();
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.doc(id).set(payload);
    return id;
  },
  async save(id, def) {
    const payload = surveyPayload(def);
    payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await this.doc(id).set(payload, { merge: true });
  },
  async setStatus(id, status) { await this.doc(id).set({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); },
  // 문항만 복제한 새 설문 (대상자·응답은 복제하지 않음)
  async duplicate(id, newTitle) {
    const s = await this.get(id); if (!s) throw new Error('설문을 찾을 수 없습니다.');
    delete s.createdAt; delete s.createdAtMs; delete s.updatedAt;
    s.title = newTitle || (s.title + ' (복사본)'); s.status = 'active';
    return this.create(s);
  },
  // 설문과 하위 데이터(대상자·응답)까지 삭제
  async remove(id) {
    for (const sub of ['recipients', 'responses']) {
      const snap = await this.doc(id).collection(sub).get();
      let batch = this.db.batch(), n = 0;
      for (const d of snap.docs) { batch.delete(d.ref); if (++n >= 400) { await batch.commit(); batch = this.db.batch(); n = 0; } }
      if (n) await batch.commit();
    }
    await this.doc(id).delete();
  },
  // 예전 구조(config/survey, recipients, responses 최상위 컬렉션)를 설문 한 건으로 옮깁니다.
  async migrateLegacy() {
    const cfg = await this.db.collection('config').doc('survey').get();
    const def = cfg.exists && cfg.data().survey ? cfg.data().survey : JSON.parse(JSON.stringify(SURVEY));
    const id = await this.create(normalizeSurvey(def));
    let moved = { recipients: 0, responses: 0 };
    for (const sub of ['recipients', 'responses']) {
      const snap = await this.db.collection(sub).get();
      let batch = this.db.batch(), n = 0;
      for (const d of snap.docs) { batch.set(this.doc(id).collection(sub).doc(d.id), d.data()); moved[sub]++; if (++n >= 400) { await batch.commit(); batch = this.db.batch(); n = 0; } }
      if (n) await batch.commit();
    }
    return { id, ...moved };
  }
};
