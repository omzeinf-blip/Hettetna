import http from "node:http";
import type { AddressInfo } from "node:net";

export type Recorded = {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: http.IncomingHttpHeaders;
  body: string;
};
export type Reply = { status?: number; headers?: Record<string, string>; body?: unknown };
export type Handler = (request: Recorded) => Reply | undefined;

/** A tiny stand-in for Supabase's HTTP API that records every request it receives. */
export async function startMock(handler: Handler) {
  const requests: Recorded[] = [];
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://mock");
      const recorded: Recorded = {
        method: req.method ?? "GET",
        path: url.pathname,
        query: url.searchParams,
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      };
      requests.push(recorded);
      const reply = handler(recorded) ?? { status: 404, body: { code: "PGRST205" } };
      res.writeHead(reply.status ?? 200, { "content-type": "application/json", ...reply.headers });
      res.end(reply.body === undefined ? "" : JSON.stringify(reply.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export function fakeJwt(expSecondsFromNow: number): string {
  const enc = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${enc({ alg: "HS256" })}.${enc({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })}.sig`;
}
