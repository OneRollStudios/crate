"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  agentEventsFromSSE,
  agentStreamText,
  initialAgentStreamState,
  reduceAgentStream,
  type AgentStreamState,
  type SSEMapper,
} from "@/lib/agent-stream";

export type UseAgentStreamOptions = {
  /** Endpoint that responds with server-sent events. send(body) POSTs JSON to it. */
  api?: string;
  /** Replaces the default request, for custom headers, methods, or bodies. */
  fetch?: (body: unknown, signal: AbortSignal) => Promise<Response>;
  /** Maps each server-sent event to AgentStreamEvents. Defaults to Crate's JSON events. */
  map?: SSEMapper;
};

export type AgentStream = AgentStreamState & {
  /** All text streamed so far in the current turn. */
  text: string;
  /** Starts a new turn. */
  send: (body?: unknown) => Promise<void>;
  /** Cancels the current turn. */
  stop: () => void;
};

/**
 * Streams a response from any backend that sends server-sent events, and
 * returns the chat shape useAgentStatus reads: useAgentStatus(useAgentStream(...)).
 */
export function useAgentStream({ api = "/api/agent", fetch: request, map }: UseAgentStreamOptions = {}): AgentStream {
  const [state, dispatch] = useReducer(reduceAgentStream, initialAgentStreamState);
  const controller = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  const send = useCallback(async (body?: unknown) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    dispatch({ type: "request" });
    try {
      const response = request
        ? await request(body, current.signal)
        : await fetch(api, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body ?? {}),
            signal: current.signal,
          });
      if (!response.ok || !response.body) throw new Error(`Request failed with status ${response.status}`);
      for await (const event of agentEventsFromSSE(response.body, map)) {
        if (current.signal.aborted) break;
        dispatch(event);
      }
    } catch (error) {
      if (!current.signal.aborted) dispatch({ type: "error", message: error instanceof Error ? error.message : String(error) });
    } finally {
      if (current.signal.aborted) dispatch({ type: "stopped" });
      if (controller.current === current) controller.current = null;
    }
  }, [api, request, map]);

  useEffect(() => stop, [stop]);

  return useMemo(() => ({ ...state, text: agentStreamText(state), send, stop }), [state, send, stop]);
}
