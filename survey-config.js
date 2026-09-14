/* =========================================================
 * 설문 문항 정의
 * ---------------------------------------------------------
 * survey.html (응답 화면)과 admin.html (통계 화면)이 함께 사용합니다.
 * 문항을 바꾸면 두 화면에 동시에 반영됩니다.
 *
 * type 종류
 *   single : 하나만 선택 (라디오)
 *   multi  : 여러 개 선택 (체크박스)
 *   scale  : 점수 척도 (min ~ max 사이 숫자, labels는 양 끝 설명)
 *   text   : 주관식
 * ========================================================= */

const SURVEY = {
  title: "안전보건교육 만족도 설문조사",
  description: "교육 과정 개선을 위한 설문입니다. 응답 내용은 통계 목적으로만 사용되며 약 3분 소요됩니다.",
  deadline: "2026-09-30",          // 메일 본문과 화면에 표시되는 마감일
  closeAfterDeadline: false,       // true로 바꾸면 마감일 이후 제출을 막습니다

  questions: [
    {
      id: "q1",
      type: "single",
      title: "참여하신 교육 과정은 무엇입니까?",
      required: true,
      options: ["공정안전관리(PSM) 기본", "위험성평가 실무", "산업안전보건법 개정 사항", "기타"]
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
      type: "text",
      title: "교육 개선을 위한 의견이 있으면 자유롭게 적어 주세요.",
      required: false,
      placeholder: "의견을 입력해 주세요."
    }
  ]
};
