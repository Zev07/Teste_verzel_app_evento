// 127.0.0.1 em vez de "localhost": no Docker Desktop para Windows,
// "localhost" às vezes resolve para ::1 (IPv6), e o proxy de porta do
// Docker nem sempre encaminha IPv6 corretamente — a conexão abre e fecha
// na hora ("other side closed"). IPv4 explícito evita essa ambiguidade.
const BASE_URL = process.env.API_URL || "http://127.0.0.1:3333";

export function createTestRunner() {
  let passed = 0;
  let failed = 0;

  function ok(label: string) {
    passed++;
    console.log(`✅ ${label}`);
  }

  function fail(label: string, detail?: unknown) {
    failed++;
    console.log(`❌ ${label}`);
    if (detail !== undefined) console.log("   →", JSON.stringify(detail));
  }

  async function request(
    method: string,
    path: string,
    body?: unknown,
    token?: string
  ): Promise<{ status: number; body: any }> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json: any = await res.json().catch(() => null);
    return { status: res.status, body: json };
  }

  function summary(label: string) {
    console.log(`\n---------------------------- ${label}`);
    console.log(`Passou: ${passed}  |  Falhou: ${failed}`);
    console.log("----------------------------");
    return failed;
  }

  return { ok, fail, request, summary };
}
