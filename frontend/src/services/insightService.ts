/**
 * insightService.ts
 * Calls the FastAPI backend SSE streaming endpoints for Llama-powered insights.
 * The backend uses the ollama Python library internally — this file never touches Ollama directly.
 */

const BACKEND = 'http://localhost:8000';

export interface CopilotInsightPayload {
  name: string;
  framework: string;
  size_mb: number;
  baseStats: { fps: number; latency: number; memory: number; size: number };
  simStats:  { fps: number; latency: number; memory: number; size: number };
  opts: { quantize: boolean; coreml: boolean; resize: boolean };
}

export interface DeployInsightPayload {
  name: string;
  framework: string;
  size_mb: number;
  totalScore: number;
  breakdown: {
    compatibility: number;
    performance: number;
    memory: number;
    optimization: number;
  };
}

/**
 * Generic SSE streaming helper.
 * Calls the backend, reads the streaming response line-by-line,
 * and invokes `onToken` for each text chunk, `onDone` at completion,
 * and `onError` on failure.
 */
async function streamInsight(
  endpoint: string,
  payload: CopilotInsightPayload | DeployInsightPayload,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const res = await fetch(`${BACKEND}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      onError(`Backend returned ${res.status}: ${res.statusText}`);
      return;
    }

    if (!res.body) {
      onError('No response body from backend.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines come as: "data: <token>\n\n"
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const chunk = line.slice(6);
          if (chunk === '[DONE]') {
            onDone();
            return;
          }
          if (chunk) onToken(chunk);
        }
      }
    }
    onDone();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      onError('Cannot reach backend. Make sure the FastAPI server is running on port 8000.');
    } else {
      onError(msg);
    }
  }
}

export const streamCopilotInsight = (
  payload: CopilotInsightPayload,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) => streamInsight('/api/copilot/insight', payload, onToken, onDone, onError);

export const streamDeployInsight = (
  payload: DeployInsightPayload,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void
) => streamInsight('/api/deploy/insight', payload, onToken, onDone, onError);

/** Quick health check — resolves true if Ollama is available on the backend */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/api/ollama/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}
