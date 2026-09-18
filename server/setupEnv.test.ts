import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { setupEnv } from "../scripts/setupEnv";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

describe("setupEnv", () => {
  it("copies env.example when the target does not exist", () => {
    const copy = vi.fn();
    const log = vi.fn();
    const exists = vi.fn((path: string) => path.endsWith("env.example"));

    expect(setupEnv({ cwd: "/project", exists, copy, log })).toBe("created");
    expect(copy).toHaveBeenCalledWith("/project/env.example", "/project/.env");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Fill in the required values"));
  });

  it("does not overwrite an existing target", () => {
    const copy = vi.fn();
    const log = vi.fn();

    expect(setupEnv({ cwd: "/project", exists: () => true, copy, log })).toBe("exists");
    expect(copy).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(".env already exists; leaving it unchanged.");
  });

  it("fails clearly when env.example is missing", () => {
    expect(() => setupEnv({ cwd: "/project", exists: () => false })).toThrow(
      "env.example is missing",
    );
  });

  it("publishes exactly nine documented variables with empty values", () => {
    const source = readFileSync(`${projectRoot}/env.example`, "utf8");
    const assignments = source
      .split("\n")
      .filter(line => /^[A-Z][A-Z0-9_]*=/.test(line));

    expect(assignments).toEqual([
      "DATABASE_URL=",
      "JWT_SECRET=",
      "VITE_APP_ID=",
      "OAUTH_SERVER_URL=",
      "VITE_OAUTH_PORTAL_URL=",
      "OWNER_OPEN_ID=",
      "OWNER_NAME=",
      "BUILT_IN_FORGE_API_URL=",
      "BUILT_IN_FORGE_API_KEY=",
    ]);
    expect(source.match(/adapter（official deployment: Manus）/g)).toHaveLength(5);
  });

  it("keeps the runtime file ignored and the example trackable", () => {
    const gitignore = readFileSync(`${projectRoot}/.gitignore`, "utf8").split("\n");
    const packageJson = JSON.parse(readFileSync(`${projectRoot}/package.json`, "utf8"));

    expect(gitignore).toContain(".env");
    expect(gitignore).not.toContain("env.example");
    expect(packageJson.scripts["setup:env"]).toBe("tsx scripts/setupEnv.ts");
  });
});
