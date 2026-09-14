/* =========================================================
 * 서비스 연결 설정
 * ---------------------------------------------------------
 *이 파일의 값만 바꾸면 survey.html / admin.html이 모두 동작합니다.
 * 자세한 설정 절차는 README.md를 참고하세요.
 * ========================================================= */

/* 1) Firebase 프로젝트 설정
 *    Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성 에서 복사 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD2FQAj92kGoOA7jWHUlVHyZ69ZMz2ueOE",
  authDomain: "survey-64af8.firebaseapp.com",
  projectId: "survey-64af8",
  storageBucket: "survey-64af8.firebasestorage.app",
  messagingSenderId: "321863016522",
  appId: "1:321863016522:web:08344636817a28cd6046b3"
};

/* 2) 메일 발송 서버 설정 (Google Apps Script)
 *    apps-script/Code.gs를 웹 앱으로 배포한 뒤 나오는 URL과,
 *    Code.gs의 API 키(스크립트 속성 API_KEY 또는 API_KEY_FALLBACK)와 같은 값 */
const MAIL_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzOcTGxCWHMPmi_zAQBXGENSEUwTqD0TRlrTPT_WJPGA7P-88vteSkPLRP-BwAKzUX3/exec",
  apiKey: "djfiwijewijqfjskdajfjaklsjfklsdjfsifjsoijfijsdfjsjfkjsd",
  batchSize: 30            // 한 번의 요청으로 보낼 인원 (최대 100)
};

/* 메일 제목·본문 템플릿
 *    사용할 수 있는 자리 표시자: {{to_name}}, {{to_email}}, {{survey_link}}
 *    {{survey_title}}, {{deadline}}, {{sender_name}}은 survey-config.js와 아래 설정값으로 채워집니다. */
const MAIL_TEMPLATE = {
  subject: "[설문 요청] {{survey_title}}",
  body:
`{{to_name}} 님, 안녕하세요.

{{survey_title}}에 참여를 부탁드립니다.
아래 링크를 눌러 응답해 주세요. (마감: {{deadline}})

{{survey_link}}

감사합니다.
{{sender_name}} 드림`
};

/* 3) 설문 페이지 주소 (GitHub Pages에 올린 survey.html의 전체 주소)
 *    예: https://아이디.github.io/저장소이름/survey.html
 *    메일에는 이 주소 뒤에 ?t=토큰 이 붙어서 발송됩니다. */
const SURVEY_BASE_URL = "https://ergoman-ia.github.io/Survey/survey.html";

/* 4) 관리자 비밀번호 (SHA-256 해시값)
 *    admin.html 로그인 화면의 "비밀번호 해시 만들기"로 생성한 값을 붙여 넣으세요. */
const ADMIN_PASSWORD_HASH = "d7e46480f7570a02bbe655c893bc6259052f596267db07938574d94340849e36";

/* 5) 메일 발신자 표시 이름 (받는 사람에게 보이는 보낸 사람 이름, {{sender_name}}에도 들어감) */
const SENDER_NAME = "안전보건교육 담당자";
