// Firestore 컬렉션/문서 경로 및 상태 enum 모음 (단일 진실 소스)

export const DRAFT_DOC = "draft/state";
export const SECRETS_DOC = "draft/secrets"; // 관리자 전용 (PIN 해시)
export const PLAYERS_COL = "players";
export const PICKS_COL = "picks";
export const CHAT_COL = "chat";
export const PRESENCE_COL = "presence";
export const RATE_COL = "rate";

export const STATUS = {
  SETUP: "setup",
  LIVE: "live",
  DONE: "done",
};

export const TEAM = {
  A: "A",
  B: "B",
};

// 청백전 팀 컬러 매핑 (A=청/네이비, B=백/레드테두리)
export const TEAM_THEME = {
  A: {
    key: "A",
    label: "청팀",
    text: "text-navy",
    bg: "bg-navy",
    bgSoft: "bg-navy/10",
    border: "border-navy",
    ring: "ring-navy",
    chipText: "text-white",
  },
  B: {
    key: "B",
    label: "백팀",
    text: "text-brand-red",
    bg: "bg-white",
    bgSoft: "bg-brand-red/10",
    border: "border-brand-red",
    ring: "ring-brand-red",
    chipText: "text-brand-red",
  },
};

export const otherTeam = (t) => (t === TEAM.A ? TEAM.B : TEAM.A);

// 팀당 같은 포지션 최대 선발 인원
export const POSITION_CAP = 2;

// 픽 문서 id = index 문자열. "다음 픽은 반드시 picks/{pickCount}" 라서
// 두 대표가 동시에 같은 슬롯을 쓰면 id 충돌로 한 명만 성공 → 더블픽 차단.
// (정렬은 항상 index 필드로 orderBy 하므로 0패딩 불필요. 규칙에 string(index)로 검증)
export const pickDocId = (n) => String(n);

// 채팅 레이트리밋 간격(초)
export const CHAT_COOLDOWN_SECONDS = 3;

// presence 하트비트/만료 (밀리초)
export const PRESENCE_HEARTBEAT_MS = 60_000; // 60초마다 갱신
export const PRESENCE_STALE_MS = 120_000; // 120초 지난 문서는 오프라인 간주
