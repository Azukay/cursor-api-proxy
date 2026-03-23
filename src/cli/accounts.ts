import fs from "node:fs";
import path from "node:path";

import { ACCOUNTS_DIR } from "./constants.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccountInfo {
  name: string;
  configDir: string;
  authenticated: boolean;
  email?: string;
  displayName?: string;
  plan?: string;
  subscriptionStatus?: string;
  expiresAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads authentication and plan metadata from a saved account directory.
 * Never throws — returns `authenticated: false` on any read/parse error.
 */
export function readAccountInfo(name: string, configDir: string): AccountInfo {
  const info: AccountInfo = { name, configDir, authenticated: false };

  const configFile = path.join(configDir, "cli-config.json");
  if (!fs.existsSync(configFile)) return info;

  try {
    const raw = JSON.parse(fs.readFileSync(configFile, "utf-8")) as {
      authInfo?: { email?: string; displayName?: string };
    };
    if (raw.authInfo) {
      info.authenticated = true;
      info.email = raw.authInfo.email;
      info.displayName = raw.authInfo.displayName;
    }
  } catch {
    // malformed config — treat as unauthenticated
  }

  const statsigFile = path.join(configDir, "statsig-cache.json");
  if (!fs.existsSync(statsigFile)) return info;

  try {
    const statsigRaw = JSON.parse(fs.readFileSync(statsigFile, "utf-8")) as {
      data?: string;
    };
    if (!statsigRaw.data) return info;

    const statsig = JSON.parse(statsigRaw.data) as {
      user?: {
        custom?: {
          isEnterpriseUser?: boolean;
          stripeSubscriptionStatus?: string;
          stripeMembershipStatus?: string;
          stripeMembershipExpiration?: string;
        };
      };
    };

    const custom = statsig?.user?.custom;
    if (!custom) return info;

    if (custom.isEnterpriseUser) {
      info.plan = "Enterprise";
    } else if (custom.stripeSubscriptionStatus === "active") {
      info.plan = "Pro";
    } else {
      info.plan = "Free";
    }

    info.subscriptionStatus = custom.stripeSubscriptionStatus;

    if (custom.stripeMembershipExpiration) {
      info.expiresAt = new Date(
        custom.stripeMembershipExpiration,
      ).toLocaleDateString();
    }
  } catch {
    // malformed statsig cache — skip plan info
  }

  return info;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export async function handleAccountsList(): Promise<void> {
  if (!fs.existsSync(ACCOUNTS_DIR)) {
    console.log("No accounts found. Use 'cursor-api-proxy login' to add one.");
    return;
  }

  const entries = fs.readdirSync(ACCOUNTS_DIR, { withFileTypes: true });
  const names = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (names.length === 0) {
    console.log("No accounts found. Use 'cursor-api-proxy login' to add one.");
    return;
  }

  console.log("🔑 Cursor Accounts:\n");

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const info = readAccountInfo(name, path.join(ACCOUNTS_DIR, name));

    console.log(`  ${i + 1}. ${name}`);

    if (info.authenticated) {
      if (info.email) {
        const display = info.displayName ? ` (${info.displayName})` : "";
        console.log(`     📧 ${info.email}${display}`);
      }
      if (info.plan) {
        const canceled =
          info.subscriptionStatus === "canceled" ? " · canceled" : "";
        const expiry = info.expiresAt ? ` · expires ${info.expiresAt}` : "";
        console.log(`     📊 ${info.plan}${canceled}${expiry}`);
      }
      console.log(`     ✅ Authenticated`);
    } else {
      console.log(`     ⚠️  Not authenticated`);
    }

    console.log("");
  }

  console.log(
    "Tip: run 'cursor-api-proxy logout <name>' to remove an account.",
  );
}

export async function handleLogout(accountName: string): Promise<void> {
  if (!accountName) {
    console.error("❌ Error: Please specify the account name to remove.");
    console.error("Usage: cursor-api-proxy logout <account-name>");
    process.exit(1);
  }

  const configDir = path.join(ACCOUNTS_DIR, accountName);

  if (!fs.existsSync(configDir)) {
    console.error(`❌ Account '${accountName}' not found.`);
    process.exit(1);
  }

  try {
    fs.rmSync(configDir, { recursive: true, force: true });
    console.log(`✅ Account '${accountName}' removed.`);
  } catch (err) {
    console.error(`❌ Error removing account:`, err);
    process.exit(1);
  }
}
