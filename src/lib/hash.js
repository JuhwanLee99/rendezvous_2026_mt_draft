// PIN 해시 (Web Crypto SHA-256).
// 주의: 4자리 PIN 해시는 오프라인 브루트포스가 가능(<1만). 네트워크 스누핑만 차단하는
// UX 게이트이며 강한 보호가 아님. 실제 픽 무결성은 Firestore 보안 규칙이 담당한다.

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
