type AccountStatus = {
  configDir: string;
  activeRequests: number;
  lastUsed: number;
  rateLimitUntil: number;
};

export class AccountPool {
  private accounts: AccountStatus[];

  constructor(configDirs: string[]) {
    this.accounts = configDirs.map((dir) => ({
      configDir: dir,
      activeRequests: 0,
      lastUsed: 0,
      rateLimitUntil: 0,
    }));
  }

  /**
   * Get the least busy account using a combination of active requests and round-robin.
   * Ignores accounts that are currently rate limited.
   */
  public getNextConfigDir(): string | undefined {
    if (this.accounts.length === 0) {
      return undefined;
    }

    const now = Date.now();

    // Filter out rate-limited accounts (unless they are all rate-limited, then just use the one that recovers soonest)
    const availableAccounts = this.accounts.filter(
      (a) => a.rateLimitUntil < now,
    );

    let targetAccounts = availableAccounts;
    if (availableAccounts.length === 0) {
      // If all are rate limited, sort by who recovers first
      targetAccounts = [...this.accounts].sort(
        (a, b) => a.rateLimitUntil - b.rateLimitUntil,
      );
    }

    // Sort by active requests (ascending), then by last used (ascending for round-robin effect)
    const sorted = [...targetAccounts].sort((a, b) => {
      if (a.activeRequests !== b.activeRequests) {
        return a.activeRequests - b.activeRequests;
      }
      return a.lastUsed - b.lastUsed;
    });

    const selected = sorted[0];
    selected.lastUsed = now;
    return selected.configDir;
  }

  public reportRequestStart(configDir?: string): void {
    if (!configDir) return;
    const account = this.accounts.find((a) => a.configDir === configDir);
    if (account) {
      account.activeRequests++;
    }
  }

  public reportRequestEnd(configDir?: string): void {
    if (!configDir) return;
    const account = this.accounts.find((a) => a.configDir === configDir);
    if (account && account.activeRequests > 0) {
      account.activeRequests--;
    }
  }

  public reportRateLimit(configDir?: string, penaltyMs: number = 60000): void {
    if (!configDir) return;
    const account = this.accounts.find((a) => a.configDir === configDir);
    if (account) {
      account.rateLimitUntil = Date.now() + penaltyMs;
    }
  }

  public getConfigDirsCount(): number {
    return this.accounts.length;
  }
}

// Global instance to be initialized at server start
let globalPool: AccountPool | null = null;

export function initAccountPool(configDirs: string[]) {
  globalPool = new AccountPool(configDirs);
}

export function getNextAccountConfigDir(): string | undefined {
  if (!globalPool) return undefined;
  return globalPool.getNextConfigDir();
}

export function reportRequestStart(configDir?: string): void {
  if (globalPool) {
    globalPool.reportRequestStart(configDir);
  }
}

export function reportRequestEnd(configDir?: string): void {
  if (globalPool) {
    globalPool.reportRequestEnd(configDir);
  }
}

export function reportRateLimit(configDir?: string, penaltyMs?: number): void {
  if (globalPool) {
    globalPool.reportRateLimit(configDir, penaltyMs);
  }
}
