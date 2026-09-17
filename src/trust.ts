export interface AuditEvent {
  id: number;
  kind: string;
  actor: string;
  time: string;
  payload: Record<string, unknown>;
  previous: string;
  hash: string;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export async function digest(value: unknown) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(value)),
  );
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function append(
  events: AuditEvent[],
  kind: string,
  actor: string,
  payload: Record<string, unknown>,
): Promise<AuditEvent[]> {
  const body = {
    id: events.length + 1,
    kind,
    actor,
    time: new Date().toISOString(),
    payload,
    previous: events.at(-1)?.hash ?? "GENESIS",
  };
  return [...events, { ...body, hash: await digest(body) }];
}
export async function verify(events: AuditEvent[]): Promise<boolean> {
  try {
    for (let i = 0; i < events.length; i++) {
      if (!events[i] || typeof events[i].hash !== "string") return false;
      const { hash, ...body } = events[i];
      if (
        body.id !== i + 1 ||
        body.previous !== (events[i - 1]?.hash ?? "GENESIS") ||
        hash !== (await digest(body))
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
