/** Toggle to trace prod bundle download + cache path in device logs. */
export const MF_TRACE_ENABLED = true;

export function mfTrace(step: string, data?: Record<string, unknown>): void {
  if (!MF_TRACE_ENABLED) {
    return;
  }

  if (data !== undefined) {
    console.log(`[MF:Trace] ${step}`, data);
  } else {
    console.log(`[MF:Trace] ${step}`);
  }
}
