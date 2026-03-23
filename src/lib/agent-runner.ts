import * as fs from "node:fs";

import type { BridgeConfig } from "./config.js";
import { run, runStreaming } from "./process.js";
import { readKeychainToken, writeCachedToken } from "../cli/usage.js";

function cacheTokenForAccount(configDir?: string): void {
  if (!configDir) return;
  const token = readKeychainToken();
  if (token) writeCachedToken(configDir, token);
}

export type AgentRunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

export function runAgentSync(
  config: BridgeConfig,
  workspaceDir: string,
  cmdArgs: string[],
  tempDir?: string,
  configDir?: string,
  signal?: AbortSignal,
): Promise<AgentRunResult> {
  return run(config.agentBin, cmdArgs, {
    cwd: workspaceDir,
    timeoutMs: config.timeoutMs,
    maxMode: config.maxMode,
    configDir,
    signal,
  }).finally(() => {
    cacheTokenForAccount(configDir);
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });
}

export type StreamLineHandler = (line: string) => void;

export function runAgentStream(
  config: BridgeConfig,
  workspaceDir: string,
  cmdArgs: string[],
  onLine: StreamLineHandler,
  tempDir?: string,
  configDir?: string,
  signal?: AbortSignal,
): Promise<{ code: number; stderr: string }> {
  return runStreaming(config.agentBin, cmdArgs, {
    cwd: workspaceDir,
    timeoutMs: config.timeoutMs,
    maxMode: config.maxMode,
    onLine,
    configDir,
    signal,
  }).finally(() => {
    cacheTokenForAccount(configDir);
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        /* ignore */
      }
    }
  });
}
