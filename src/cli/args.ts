export type ParsedArgs = {
  tailscale: boolean;
  help: boolean;
  login: boolean;
  accountsList: boolean;
  logout: boolean;
  accountName: string;
  proxies: string[];
};

export function parseArgs(argv: string[]): ParsedArgs {
  let tailscale = false;
  let help = false;
  let login = false;
  let accountsList = false;
  let logout = false;
  let accountName = "";
  let proxies: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "login" || arg === "add-account") {
      login = true;
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        accountName = argv[++i];
      }
      continue;
    }

    if (arg === "logout" || arg === "remove-account") {
      logout = true;
      if (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        accountName = argv[++i];
      }
      continue;
    }

    if (arg === "accounts" || arg === "list-accounts") {
      accountsList = true;
      continue;
    }

    if (arg === "--tailscale") {
      tailscale = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg.startsWith("--proxy=")) {
      proxies = arg
        .slice("--proxy=".length)
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { tailscale, help, login, accountsList, logout, accountName, proxies };
}

export function printHelp(version: string): void {
  console.log(`cursor-api-proxy v${version}`);
  console.log("");
  console.log("Usage:");
  console.log("  cursor-api-proxy [options]");
  console.log("");
  console.log("Commands:");
  console.log(
    "  login [name]              Log into a Cursor account (saved to ~/.cursor-api-proxy/accounts/)",
  );
  console.log(
    "  login [name] --proxy=...  Same, but open Chrome through a random proxy from a comma-separated list",
  );
  console.log("  logout <name>             Remove a saved Cursor account");
  console.log("  accounts                  List saved accounts with plan info");
  console.log("");
  console.log("Options:");
  console.log("  --tailscale     Bind to 0.0.0.0 for tailnet/LAN access");
  console.log("  -h, --help      Show this help message");
}
