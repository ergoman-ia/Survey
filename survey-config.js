/* =========================================================
 * 새 설문의 기본 틀(템플릿)
 * ---------------------------------------------------------
 * 설문 편집 페이지(editor.html)에서 "새 설문"을 누르거나 "기본 설문으로 되돌리기"를 할 때
 * 나오는 기본 문항입니다. 실제 설문 내용은 Firestore(surveys 컬렉션)에 저장되며,
 * 응답 화면·관리 화면은 이 파일이 아니라 DB에 저장된 설문을 읽습니다.
 * (예전 구조의 데이터를 가져올 때 설문 정의가 없으면 이 틀을 대신 씁니다)
 *
 * type 종류
 *   single   : 하나만 선택 (라디오)      multi : 여러 개 선택 (체크박스)   dropdown : 드롭다운
 *   scale    : 선형 배율 (min ~ max, labels는 양 끝 설명)   rating : 등급(별점, max 단계)
 *   short    : 단답형                    long  : 장문형
 *   allowOther: true 이면 "기타" 직접 입력 칸이 붙습니다 (single, multi)
 * ========================================================= */

const SURVEY = {
  title: "안전보건교육 만족도 설문조사",
  description: "교육 과정 개선을 위한 설문입니다. 응답 내용은 통계 목적으로만 사용되며 약 3분 소요됩니다.",
  deadline: "",                    // 마감일(YYYY-MM-DD). 새 설문마다 편집 페이지에서 정하므로 비워 둠
  closeAfterDeadline: false,       // true로 바꾸면 마감일 이후 제출을 막습니다
  openEnabled: true,               // true: 메일 링크 없이 들어와도 응답 가능(공개 설문), false: 메일 링크로만 응답

  questions: [
    {
      id: "q1",
      type: "single",
      title: "참여하신 교육 과정은 무엇입니까?",
      required: true,
      options: ["공정안전관리(PSM) 기본", "위험성평가 실무", "산업안전보건법 개정 사항"],
      allowOther: true
    },
    {
      id: "q2",
      type: "scale",
      title: "교육 내용은 업무에 얼마나 도움이 되었습니까?",
      required: true,
      min: 1,
      max: 5,
      labels: ["전혀 도움이 안 됨", "매우 도움이 됨"]
    },
    {
      id: "q3",
      type: "scale",
      title: "강사의 전달력과 설명은 만족스러웠습니까?",
      required: true,
      min: 1,
      max: 5,
      labels: ["매우 불만족", "매우 만족"]
    },
    {
      id: "q4",
      type: "multi",
      title: "앞으로 추가로 듣고 싶은 주제를 모두 골라 주세요.",
      required: false,
      options: ["화학 물질 관리", "밀폐 공간 작업", "전기 안전", "근골격계 질환 예방", "사고 사례 분석"]
    },
    {
      id: "q5",
      type: "long",
      title: "교육 개선을 위한 의견이 있으면 자유롭게 적어 주세요.",
      required: false,
      placeholder: "의견을 입력해 주세요."
    }
  ]
};
