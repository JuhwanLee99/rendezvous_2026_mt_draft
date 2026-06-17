import StatusPage from "./StatusPage.jsx";

// 현장 대형 화면 표출용 — 기본 현황 페이지 구성 그대로, 라이브 송출(영상) 영역만 제거.
export default function BoardPage() {
  return <StatusPage hideVideo />;
}
