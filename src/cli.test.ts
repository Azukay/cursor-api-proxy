import { describe, it, expect } from "vitest";

// We need to test parseArgs - it's not exported. We can either:
// 1. Export it from cli.ts
// 2. Test via the module

// For now, let's test the behavior by extracting the logic.
// Actually the cleanest approach is to export parseArgs from cli.ts for testability.
// Let me check the cli again - parseArgs is a local function. I'll add an export for it
// so we can test it, or we could move it to a separate module. The simplest is to export it.

// I'll need to add an export to cli.ts. Let me do that.
import { parseArgs } from "./cli.js";

describe("parseArgs", () => {
  it("parses empty argv", () => {
    expect(parseArgs([])).toEqual({
      tailscale: false,
      help: false,
      login: false,
      logout: false,
      accountsList: false,
      accountName: "",
      proxies: [],
    });
  });

  it("parses --tailscale", () => {
    expect(parseArgs(["--tailscale"])).toEqual({
      tailscale: true,
      help: false,
      login: false,
      logout: false,
      accountsList: false,
      accountName: "",
      proxies: [],
    });
  });

  it("parses --help", () => {
    expect(parseArgs(["--help"])).toEqual({
      tailscale: false,
      help: true,
      login: false,
      logout: false,
      accountsList: false,
      accountName: "",
      proxies: [],
    });
  });

  it("parses -h", () => {
    expect(parseArgs(["-h"])).toEqual({
      tailscale: false,
      help: true,
      login: false,
      logout: false,
      accountsList: false,
      accountName: "",
      proxies: [],
    });
  });

  it("parses combined flags", () => {
    expect(parseArgs(["--tailscale", "--help"])).toEqual({
      tailscale: true,
      help: true,
      login: false,
      logout: false,
      accountsList: false,
      accountName: "",
      proxies: [],
    });
  });

  it("parses login command", () => {
    expect(parseArgs(["login", "my-account"])).toEqual({
      tailscale: false,
      help: false,
      login: true,
      logout: false,
      accountsList: false,
      accountName: "my-account",
      proxies: [],
    });
  });

  it("parses login with single proxy", () => {
    expect(
      parseArgs(["login", "my-account", "--proxy=http://proxy1:8080"]),
    ).toEqual({
      tailscale: false,
      help: false,
      login: true,
      logout: false,
      accountsList: false,
      accountName: "my-account",
      proxies: ["http://proxy1:8080"],
    });
  });

  it("parses login with multiple proxies", () => {
    expect(
      parseArgs([
        "login",
        "my-account",
        "--proxy=http://p1:8080,socks5://p2:1080,http://p3:3128",
      ]),
    ).toEqual({
      tailscale: false,
      help: false,
      login: true,
      logout: false,
      accountsList: false,
      accountName: "my-account",
      proxies: ["http://p1:8080", "socks5://p2:1080", "http://p3:3128"],
    });
  });

  it("parses logout command", () => {
    expect(parseArgs(["logout", "my-account"])).toEqual({
      tailscale: false,
      help: false,
      login: false,
      logout: true,
      accountsList: false,
      accountName: "my-account",
      proxies: [],
    });
  });

  it("parses accounts command", () => {
    expect(parseArgs(["accounts"])).toEqual({
      tailscale: false,
      help: false,
      login: false,
      logout: false,
      accountsList: true,
      accountName: "",
      proxies: [],
    });
  });

  it("throws on unknown argument", () => {
    expect(() => parseArgs(["--unknown"])).toThrow(
      "Unknown argument: --unknown",
    );
  });
});
