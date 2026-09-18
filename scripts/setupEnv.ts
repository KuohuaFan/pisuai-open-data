import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type SetupEnvOptions = {
  cwd?: string;
  exists?: (path: string) => boolean;
  copy?: (source: string, target: string) => void;
  log?: (message: string) => void;
};

export function setupEnv(options: SetupEnvOptions = {}) {
  const cwd = options.cwd ?? process.cwd();
  const exists = options.exists ?? existsSync;
  const copy = options.copy ?? copyFileSync;
  const log = options.log ?? console.log;
  const source = resolve(cwd, "env.example");
  const target = resolve(cwd, ".env");

  if (exists(target)) {
    log(".env already exists; leaving it unchanged.");
    return "exists" as const;
  }

  if (!exists(source)) {
    throw new Error("env.example is missing; cannot initialize .env.");
  }

  copy(source, target);
  log("Created .env from env.example. Fill in the required values before starting the application.");
  return "created" as const;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) setupEnv();
