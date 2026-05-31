export type ErrorCode =
  | "EX_INVALID_SYNTAX"
  | "EX_UNKNOWN_ENTITY"
  | "EX_NULL_REFERENCE"
  | "EX_MEMORY_OVERFLOW"
  | "EX_UNSAFE_OPERATION"
  | "EX_COLLISION_FAILURE"
  | "EX_AI_BEHAVIOR_LOOP"
  | "EX_STREAM_OVERLOAD"
  | "EX_MISSING_PARAMETER"
  | "EX_INVALID_BIOME"
  | "EX_MATERIAL_CONFLICT"
  | "EX_INVALID_PARAMETER"
  | "EX_UNKNOWN_COMMAND"
  | "EX_RATE_LIMIT";

export type ExodiaError = {
  code: ErrorCode;
  explanation: string;
  fix?: string;
  valid?: string;
};

export function fmtError(e: ExodiaError): string {
  const lines = [
    "✕ STATUS      FAILED",
    `  ERROR_CODE  ${e.code}`,
    `  EXPLAIN     ${e.explanation}`,
  ];
  if (e.valid) lines.push(`  VALID       ${e.valid}`);
  if (e.fix) lines.push(`  FIX         ${e.fix}`);
  return lines.join("\n");
}
