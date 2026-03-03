import type { MockScenario } from "./http";

export type Environment = NodeJS.ProcessEnv;
export type FailureKind = "401" | "403" | "409" | "500" | "timeout";
type HeaderReader = (name: string) => string | null | undefined;

const FAILURE_STATUS: Record<FailureKind, number> = {
  "401": 401,
  "403": 403,
  "409": 409,
  "500": 500,
  timeout: 504,
};

const FAILURE_CODE: Record<FailureKind, string> = {
  "401": "MOCK_UNAUTHORIZED",
  "403": "MOCK_FORBIDDEN",
  "409": "MOCK_CONFLICT",
  "500": "MOCK_SERVER_ERROR",
  timeout: "MOCK_TIMEOUT",
};

export function resolveScenario(env: Environment): MockScenario {
  const raw = (env.MOCK_PROFILE ?? "base").trim();
  if (raw === "demo" || raw === "edge" || raw === "failure" || raw === "base") {
    return raw;
  }
  return "base";
}

export function resolveFailureKind(
  failureHeader: string | null | undefined,
  failureQuery: string | null | undefined,
  scenario: MockScenario,
  defaultFailure: FailureKind | null = null,
): FailureKind | null {
  const raw = String(failureHeader ?? failureQuery ?? "").trim().toLowerCase();

  if (raw === "401" || raw === "unauthorized") return "401";
  if (raw === "403" || raw === "forbidden") return "403";
  if (raw === "409" || raw === "conflict") return "409";
  if (raw === "500" || raw === "server") return "500";
  if (raw === "timeout" || raw === "504") return "timeout";

  if (scenario === "failure") {
    return defaultFailure;
  }

  return null;
}

export function toFailureStatus(failure: FailureKind): number {
  return FAILURE_STATUS[failure];
}

export function toFailureCode(failure: FailureKind): string {
  return FAILURE_CODE[failure];
}

export function buildFailureBody(failure: FailureKind, scenario: MockScenario) {
  const status = toFailureStatus(failure);
  return {
    error: `mock ${failure === "timeout" ? "timeout" : `http ${status}`}`,
    code: toFailureCode(failure),
    failure,
    scenario,
  };
}

interface FailureRequestLike {
  header: HeaderReader;
  query?: Record<string, unknown> | null;
}

interface FailureResponseLike {
  status: (code: number) => { json: (value: unknown) => unknown } | unknown;
  json?: (value: unknown) => unknown;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function maybeApplyFailureResponse(
  req: FailureRequestLike,
  res: FailureResponseLike,
  scenario: MockScenario,
  defaultFailure: FailureKind | null = null,
): Promise<boolean> {
  const failureQuery = (req.query ?? {}) as Record<string, unknown>;
  const failure = resolveFailureKind(
    req.header("x-mock-failure"),
    String(failureQuery.failure ?? ""),
    scenario,
    defaultFailure,
  );
  if (!failure) {
    return false;
  }

  if (failure === "timeout") {
    await delay(1200);
  }

  const responsePayload = buildFailureBody(failure, scenario);
  const statusCode = toFailureStatus(failure);
  const statusResult = res.status(statusCode);
  if (statusResult && typeof (statusResult as { json?: unknown }).json === "function") {
    (statusResult as { json: (value: unknown) => unknown }).json(responsePayload);
  } else if (typeof res.json === "function") {
    res.json(responsePayload);
  }

  return true;
}
