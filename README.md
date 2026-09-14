# 설문 발송·관리 시스템

GitHub Pages에 올려 두면 서버 없이 동작하는 설문 시스템입니다.

| 파일 | 역할 |
|---|---|
| `survey.html` | 응답자가 메일 링크로 여는 설문 화면. 열람 시각을 기록하고 제출 결과를 Firestore에 저장 |
| `admin.html` | 관리 화면. 대상자 등록, 메일 발송, 발송·열람·제출 현황, 응답 통계, CSV 내보내기 |
| `survey-config.js` | 설문 제목·문항 정의 (응답 화면과 통계 화면이 함께 사용) |
| `firebase-config.js` | Firebase 키, 발송 서버 주소·API 키, 메일 제목·본문 템플릿, 설문 주소, 관리자 비밀번호 해시 |
| `apps-script/Code.gs` | Google Apps Script 발송 서버. Gmail로 메일을 보내고 결과를 돌려줌 |
| `firestore.rules` | Firestore 보안 규칙 |

## 동작 흐름

```
관리자(admin.html)                      응답자                         Firestore
 1. 대상자 등록 ──────────────────────────────────────────────▶ recipients/{토큰}
 2. 메일 발송(Apps Script→Gmail) ▶ 메일 수신 ─▶ 링크 클릭(survey.html?t=토큰)
                                          ├─ 열람 기록 ──────────▶ recipients/{토큰}.openedAt
                                          └─ 제출 ───────────────▶ responses/{자동ID}
                                                                    recipients/{토큰}.submittedAt
 3. 현황·통계 실시간 조회 ◀────────────────────────────────────── onSnapshot
```

대상자마다 고유 토큰이 들어간 링크를 받으므로 누가 열었고 누가 제출했는지 구분되며, 같은 링크로는 한 번만 제출할 수 있습니다.

## 설치 절차

### 1. Firebase 준비

1. <https://console.firebase.google.com>에서 프로젝트를 만듭니다.
2. **빌드 > Firestore Database > 데이터베이스 만들기** (프로덕션 모드, 위치는 `asia-northeast3(서울)` 권장).
3. **규칙** 탭에 `firestore.rules` 내용을 붙여 넣고 게시합니다.
4. **프로젝트 설정(톱니바퀴) > 일반 > 내 앱 > 웹 앱 추가** 후 표시되는 `firebaseConfig` 값을 `firebase-config.js`의 `FIREBASE_CONFIG`에 복사합니다.
5. 색인 요구 오류가 나오면(콘솔에 링크가 표시됨) 링크를 눌러 색인을 만듭니다. `recipients`는 `createdAt`, `responses`는 `submittedAt`으로 정렬합니다(단일 필드라 보통 자동 처리됩니다).

### 2. Google Apps Script 준비 (메일 발송)

GitHub Pages 같은 정적 페이지는 메일을 직접 보낼 수 없으므로, 구글 계정으로 동작하는 Apps Script 웹 앱이 대신 Gmail로 보냅니다. 별도 비용은 없고, 하루 발송 한도만 있습니다.

| 발송에 쓰는 구글 계정 | 하루 발송 가능 인원 |
|---|---|
| 개인 Gmail 계정(@gmail.com) | 100명 |
| Google Workspace 계정(회사·기관 도메인) | 1,500명 |

한도는 첫 발송 후 24시간이 지나면 다시 채워지며, 월 상한은 없습니다. 대상자가 한도보다 많으면 관리 화면이 한도에 이르는 시점에 자동으로 멈추므로 다음 날 "미발송 전체 발송"으로 이어서 보내면 됩니다. 메일은 이 계정의 주소로 발송됩니다.

1. 발송에 사용할 구글 계정으로 <https://script.google.com>에 접속해 **새 프로젝트**를 만듭니다.
2. 편집기의 기본 코드를 지우고 `apps-script/Code.gs` 내용을 붙여 넣은 뒤 저장합니다. 프로젝트 이름은 "설문 발송 서버" 정도로 정합니다.
3. API 키를 정합니다. **프로젝트 설정(톱니바퀴) > 스크립트 속성 > 속성 추가**에서 속성 `API_KEY`, 값에 임의의 긴 문자열(예: 32자 이상)을 넣고 저장합니다. (스크립트 속성을 쓰지 않으려면 코드 위쪽 `API_KEY_FALLBACK` 값을 바꿔도 됩니다.)
4. 편집기 상단에서 함수 `testSend`를 선택하고 **실행**을 누릅니다. 권한 승인 창이 뜨면 계정을 선택하고 **고급 > (프로젝트 이름)(으)로 이동 > 허용**을 누릅니다. 본인 메일함에 테스트 메일이 오면 Gmail 권한 설정이 끝난 것입니다.
5. **배포 > 새 배포 > 유형 선택(톱니바퀴) > 웹 앱**을 고르고 아래처럼 설정한 뒤 **배포**합니다.
   * 다음 사용자 인증 정보로 실행: **나**
   * 액세스 권한이 있는 사용자: **모든 사용자**
6. 표시되는 **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`)을 복사합니다.
7. `firebase-config.js`의 `MAIL_CONFIG`에 `appsScriptUrl`(웹 앱 URL)과 `apiKey`(3번에서 정한 값)를 넣고, `MAIL_TEMPLATE`의 제목·본문과 `SENDER_NAME`을 원하는 문구로 고칩니다.
8. 나중에 `Code.gs`를 고쳤다면 **배포 > 배포 관리 > 편집(연필) > 버전: 새 버전 > 배포**를 해야 바뀐 코드가 적용됩니다. URL은 그대로 유지됩니다.

### 3. 관리자 비밀번호

1. `admin.html`을 열고 로그인 화면의 **비밀번호 해시 만들기**를 눌러 새 비밀번호를 입력합니다.
2. 표시된 해시값을 `firebase-config.js`의 `ADMIN_PASSWORD_HASH`에 붙여 넣습니다.
   기본값(`admin1234`)은 반드시 바꾸세요.

### 4. GitHub Pages 배포

1. GitHub에 저장소를 만들고 이 폴더의 파일을 모두 올립니다.
2. **Settings > Pages > Build and deployment**에서 Source를 `Deploy from a branch`, Branch를 `main / (root)`로 지정합니다.
3. 몇 분 뒤 `https://아이디.github.io/저장소이름/`로 접속됩니다.
4. `firebase-config.js`의 `SURVEY_BASE_URL`을 `https://아이디.github.io/저장소이름/survey.html`로 바꾸고 다시 커밋합니다.
5. `admin.html`의 **설정 확인** 탭에서 모든 항목이 "설정됨"인지 확인하고, **발송 서버 연결 확인**(오늘 남은 발송 가능 인원이 표시됨)과 **내게 테스트 메일 보내기**로 발송을 점검합니다.

## 관리 화면 사용법

* **대상자 등록**: 한 명씩 추가하거나, 엑셀에서 `이름 / 이메일 / 소속` 열을 복사해 "여러 명 한꺼번에 등록"에 붙여 넣습니다. 같은 이메일은 중복 등록되지 않습니다.
* **발송**: 행별 `발송` 버튼, `선택 대상 발송`, `미발송 전체 발송`, `미제출자 재발송` 중 선택합니다. `MAIL_CONFIG.batchSize`(기본 30명)씩 묶어 발송 서버에 보내며, 결과가 화면 아래 로그에 표시됩니다. 실패한 경우 배지에 마우스를 올리면 오류 내용을 볼 수 있고, 하루 한도에 이르면 자동으로 멈춥니다.
* **현황**: 발송 / 열람 / 제출 배지와 상단 요약 숫자가 실시간으로 갱신됩니다. 필터로 "발송 후 미열람", "미제출" 등을 골라 볼 수 있고 `현황 CSV`로 내려받을 수 있습니다.
* **응답 통계**: 문항별 막대그래프와 표(응답 수·비율·평균), 주관식 목록을 보여 줍니다. 소속별로 걸러 볼 수 있고, `응답 원본 CSV`로 엑셀 분석용 파일을, `인쇄 / PDF 저장`으로 보고서를 만들 수 있습니다.

## 설문 문항 바꾸기

`survey-config.js`의 `questions` 배열만 수정하면 응답 화면과 통계 화면에 동시에 반영됩니다.
문항 `id`는 응답 데이터의 키로 쓰이므로 설문을 시작한 뒤에는 바꾸지 않는 것이 좋습니다.
새 설문을 시작할 때는 Firestore 콘솔에서 `recipients`, `responses` 컬렉션을 비우거나, Firebase 프로젝트를 새로 만드는 것이 가장 간단합니다.

## 이미 만들어 둔 설문 HTML을 그대로 쓰려면

기존 화면을 유지하고 싶다면 아래 두 가지만 추가하면 관리 화면과 연동됩니다.

```js
// 1) 페이지 로드 시: 토큰 확인 + 열람 기록
const token = new URLSearchParams(location.search).get('t');
const ref = db.collection('recipients').doc(token);
ref.get().then(snap => {
  if (!snap.exists) { /* 잘못된 링크 처리 */ return; }
  if (snap.data().submittedAt) { /* 이미 제출됨 처리 */ return; }
  ref.update({
    openedAt: snap.data().openedAt || firebase.firestore.FieldValue.serverTimestamp(),
    openCount: firebase.firestore.FieldValue.increment(1)
  });
});

// 2) 제출 성공 직후: 제출 시각 기록
await db.collection('responses').add({ token, answers, submittedAt: firebase.firestore.FieldValue.serverTimestamp() });
await ref.update({ submittedAt: firebase.firestore.FieldValue.serverTimestamp() });
```

통계 화면이 `answers.{문항id}` 구조를 읽으므로, 저장 형식을 이와 같이 맞추고 `survey-config.js`에 같은 `id`로 문항을 정의해 주면 됩니다.

## 보안에 관한 안내

* 관리자 비밀번호는 해시값만 저장되지만, 소스가 공개 저장소에 있으면 누구나 `admin.html`을 열어 볼 수 있고 Firestore 규칙상 데이터도 읽을 수 있습니다. **저장소를 비공개(Private)로 두고** GitHub Pages를 쓰거나, 응답 내용이 민감하다면 아래 방법으로 강화하세요.
* **Firebase 인증으로 바꾸기**: Firebase 콘솔에서 *Authentication > 이메일/비밀번호*를 켜고 관리자 계정을 만든 뒤, `firestore.rules`의 `recipients` 생성/삭제와 `responses` 읽기를 `request.auth != null` 조건으로 제한하면 관리 기능은 로그인한 사용자만 쓸 수 있습니다. 이때 `admin.html` 로그인 부분을 `firebase.auth().signInWithEmailAndPassword`로 바꾸면 됩니다.
* 발송 서버 API 키(`MAIL_CONFIG.apiKey`)가 노출되면 다른 사람이 내 Gmail 한도로 메일을 보낼 수 있습니다. 저장소를 비공개로 두고, 의심스러우면 스크립트 속성의 `API_KEY`를 바꾸세요.
* Firebase `apiKey`는 공개되어도 되는 값이지만, Firebase 콘솔의 **App Check** 또는 Google Cloud의 API 키 제한(HTTP 리퍼러)을 걸어 두면 더 안전합니다.

## 데이터 구조

```
recipients/{token}
  name, email, group, createdAt
  sendStatus: 'pending' | 'sent' | 'failed', sentAt, sendCount, sendError
  openedAt(최초), lastOpenedAt, openCount
  submittedAt, responseId

responses/{autoId}
  token, name, email, group
  answers: { q1: '…', q2: 4, q4: ['…', '…'], q5: '…' }
  submittedAt, userAgent
```
