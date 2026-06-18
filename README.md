# Rendezvous 청백전 드래프트

중앙대 야구 동아리 **Rendezvous** 청백전 선수 드래프트 웹앱.
양 팀 대표가 휴대폰으로 스네이크 방식으로 선수를 지명하고, 관리자는 PC에서 진행을 통제하며,
관전자는 PC/모바일에서 실시간 현황을 보고 채팅한다.

- **스택:** React + Vite + TailwindCSS v4
- **백엔드:** Firebase 무료(Spark) 플랜 — Firestore 단일 백엔드 (Realtime Database/Cloud Functions 미사용)
- **배포:** Firebase Hosting

### 문서 & 소개 자료
- 📘 [**사용설명서**](docs/사용설명서.md) — 진행자·대표·관전자용 사용 매뉴얼 (스크린샷 포함). *이 README는 설치·배포 중심*
- 📊 [소개 슬라이드 (PPT)](docs/intro/Rendezvous-드래프트-소개.pptx) — 12장 발표 자료 (다운로드)
- 📄 [소개 자료 (PDF)](docs/intro/Rendezvous-드래프트-소개.pdf) — GitHub에서 바로 미리보기
- 🌐 [소개 웹페이지 (HTML)](docs/intro/index.html) — 로컬에서 열거나 GitHub Pages로 게시

## 페이지

| 경로 | 대상 | 설명 |
|---|---|---|
| `/` | PC + 모바일 (공개) | 현황: 라이브 영상, 팀별 로스터, 참가 선수, 픽 발표 팝업, 접속자수, 응원 채팅 |
| `/team` | 모바일 | 대표자: 4자리 핀번호 입장 → 내 차례 팝업 → 선수 지명 / 내 로스터 |
| `/admin` | PC | 관리자: 팀·핀·선수풀·선픽·유튜브 설정, 시작/직전픽취소/대리지명/리셋 |

## 처음 한 번 설정 (Firebase)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성.
2. **Authentication → Sign-in method**에서 **익명(Anonymous)** 과 **이메일/비밀번호** 활성화.
3. **Authentication → Users**에서 관리자 계정(이메일/비밀번호) 1개 추가 → 그 **UID 복사**.
4. **Firestore Database** 생성(프로덕션 모드).
5. 웹 앱 등록 후 SDK 설정값 복사.
6. 프로젝트 루트에서:
   ```bash
   cp .env.example .env.local      # 복사 후 값 채우기
   ```
   `.env.local`에 Firebase 설정값, `VITE_ADMIN_UIDS`(3번의 UID),
   그리고 `VITE_SITE_URL`(배포 도메인, 카카오톡 공유 미리보기용 — 끝에 `/` 없이)을 입력.
7. `firestore.rules`의 `isAdmin()` 안 `'REPLACE_WITH_ADMIN_UID'`를 같은 UID로 교체.
8. `.firebaserc`의 `REPLACE_WITH_FIREBASE_PROJECT_ID`를 실제 프로젝트 ID로 교체.
9. `src/assets/logo.png` — 팀 로고(투명 PNG). 이미 포함되어 있음.

## 개발 / 실행

```bash
npm install
npm run dev          # 로컬 개발 서버 (.env.local 의 Firebase 프로젝트에 연결)
```

### 로컬 에뮬레이터로 실행 (실서버 없이)

`.env.local`에 `VITE_USE_EMULATOR=1` 을 두면 로컬 에뮬레이터에 연결된다.
```bash
# 터미널 1 — 에뮬레이터 (Java 21+ 필요)
firebase emulators:start --only firestore,auth --project demo-rdv
# 터미널 2 — 데모 데이터 시드 후 개발 서버
npm run seed
npm run dev
```

## 테스트

```bash
npm test             # 스네이크 엔진 + 유튜브 파서 유닛 테스트 (Vitest)
npm run test:rules   # 보안 규칙 + 픽/undo 플로우 (Firestore 에뮬레이터, Java 21+ 필요)
```
> macOS에서 Java가 21 미만이면: `brew install openjdk@21` 후
> `export JAVA_HOME=/opt/homebrew/opt/openjdk@21` 로 지정.

## 배포

```bash
firebase login
npm run build                         # dist/ 생성
firebase deploy                       # 호스팅 + Firestore 규칙 함께 배포
# 부분 배포
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## 파비콘 / 링크 공유 미리보기 (카카오톡·SNS)

- **파비콘**: 팀 로고 기반 `public/favicon.png`(32), `favicon-64.png`(64), `apple-touch-icon.png`(180, 흰 배경 합성).
- **Open Graph 메타태그**가 [index.html](index.html)에 들어 있어 카카오톡/페이스북/슬랙 등에서 링크 공유 시
  제목·설명·썸네일(`public/og-image.png`, 1200×630 네이비 카드)이 표시된다.
- og:image / og:url 은 빌드 시 `%VITE_SITE_URL%` → `.env.local`의 `VITE_SITE_URL` 로 치환된다.
  **`VITE_SITE_URL` 을 채우지 않으면 미리보기 이미지가 깨지므로** 배포 도메인 확정 후 반드시 설정하고 다시 빌드/배포할 것.
- 공유 카드 갱신: 카카오톡은 캐시가 강하므로 배포 후
  [카카오 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 URL 캐시 초기화 권장.
- 로고/문구를 바꾸려면 `og-image.png`를 교체(또는 `python3` 생성 스크립트 재실행)하면 된다.

## 드래프트 방식 (스네이크)

`firstPick`이 A일 때 순서: **1R [청,백] · 2R [백,청] · 3R [청,백] …** (스네이크).

**포지션 드래프트**: 관리자가 포지션 목록을 정의하고 선수마다 포지션을 지정한다.
대표는 포지션별로 묶인 목록에서 선수를 고르며, **한 팀당 같은 포지션 최대 2명**(`POSITION_CAP`)까지만 뽑을 수 있다(꽉 찬 포지션은 비활성).
어느 팀 차례인데 남은 선수가 전부 그 팀이 이미 2명 채운 포지션이면 **그 차례는 자동 건너뛰고** 다음으로 뽑을 수 있는 팀에게 넘어간다. **양 팀 모두 더 뽑을 수 없으면 종료**한다.

엔진([`src/lib/draftEngine.js`](src/lib/draftEngine.js))의 `findNextPicker`가 스네이크 순서 + 스킵 + 종료를 계산하고,
`draft/state`에 `positions`·`posCount{A,B}`·`availByPos`·`slotIndex`로 상태를 둔다.

## 결과 화면 / 이미지 내보내기

드래프트가 끝나면(`status=done`) 현황·관리자 화면 상단에 **최종 명단**이 뜬다([`ResultBoard`](src/components/status/ResultBoard.jsx)).
- **표 / 그라운드** 뷰 전환 — 그라운드 뷰는 선수를 **실제 수비 위치**에 배치([`positionField`](src/lib/positionField.js)가 포지션명→위치 매핑; 투수·포수·1루·유격·좌익… 및 내야수/외야수 묶음 지원, 인식 실패 시 "기타").
- 팀별 **PNG 내보내기** (1:1 / 3:4) — 외부 라이브러리 없이 Canvas로 그림([`teamCard`](src/lib/teamCard.js) 표형, [`fieldCard`](src/lib/fieldCard.js) 그라운드형). 9포지션은 3:4가 여유롭다.
- 관리자가 설정한 **경기 날짜·요일·시작 시간**을 두 이미지 형식의 헤더에 동일하게 표시한다.

### 실제 PNG 출력 예시

| 포지션별 선수 명단 (1:1) | 그라운드 배치 (1:1) |
|:---:|:---:|
| <img src="./docs/intro/img/export-table-1x1.png" width="420" alt="포지션별 선수 명단 1대1 PNG 출력 예시" /> | <img src="./docs/intro/img/export-field-1x1.png" width="420" alt="그라운드 선수 배치 1대1 PNG 출력 예시" /> |

명단형은 헤더 비중을 줄이고 포지션·선수명을 크게 표시한다. 그라운드형은 홈에서 만나는 양쪽 파울라인과 2루에서 만나는 1·3루 연결선이 각각 **정확히 90도**가 되도록 그린다.

<p align="center">
  <img src="./docs/intro/img/export-field-3x4.png" width="320" alt="그라운드 선수 배치 3대4 PNG 출력 예시" />
</p>

## 보안 모델 (무료 플랜의 한계 — 동아리 내부용 수용)

Firestore 보안 규칙이 강제하는 것:
- 관리자(하드코딩 UID)만 설정/풀/핀/시작/리셋/undo/대리지명
- 픽은 (a) 선수 미지명 (b) **현재 차례 팀** (c) **순번 일치** (d) **포지션 캡(팀당 2명)**일 때만 — 더블픽·순번 위조·차례 위조·캡 초과 차단(서버에서 카운터 증가까지 검증)
- 채팅 길이 검증 + uid별 쿨다운(레이트리밋), 픽 불변, presence 본인 문서만

규칙으로 막을 수 없는 잔여 리스크(수용):
1. **대표 사칭** — 익명 인증이라 "현재 차례 팀의 합법 픽"만 보장, 그 픽을 한 사람이 진짜 대표인지는 보장 못 함 → 관리자 실시간 감시 + undo로 대응.
2. **PIN은 소프트 게이트** — 4자리 해시는 브루트포스 가능. UX 게이트일 뿐 실제 보호는 규칙이 담당.
3. **차기 picker/카운터 변조** — 스킵 로직과 posCount 전체 정합성은 규칙이 완전 검증하지 못함(픽당 해당 포지션 카운터 +1 과 캡은 검증). 변조 클라이언트는 관리자 undo/리셋으로 대응.
4. **접속자수 근사치**, **닉네임 중복 가능**.

이상은 Blaze + Cloud Functions(커스텀 클레임) 없이는 완전 해소 불가하다.

## 운영 메모 (Spark 일일 한도)

read 50k / write 20k / delete 20k. 접속 하트비트 60초·탭 숨김 시 정지, 채팅 리스너 `limit(50)`로
100명 동시 접속까지 한도 내 운영. 행사 종료 후 관리자 화면에서 채팅/presence 정리 권장.
