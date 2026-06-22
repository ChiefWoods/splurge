import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { RootNode } from "@codama/nodes";
import type { Visitor } from "@codama/visitors-core";

const typeImports: ReadonlyArray<readonly [string, string, string]> = [
  ["AcceptedMint", "acceptedMintCodec", "acceptedMint"],
  ["PriceFeedMessage", "priceFeedMessageCodec", "priceFeedMessage"],
  ["VerificationLevel", "verificationLevelCodec", "verificationLevel"],
];

export function patchGeneratedSource(source: string) {
  let patched = source;

  // patch type error in instruction files
  const resolvedAccountNames = [...patched.matchAll(/let (\w+) = accounts\.\1;/g)].map(
    (match) => match[1],
  );
  for (const accountName of resolvedAccountNames) {
    patched = patched.replaceAll(
      `${accountName}: accounts.${accountName},`,
      `${accountName}: ${accountName},`,
    );
  }

  // patch timestamp incorrectly encoded as a 1-byte Buffer
  if (patched.includes("Buffer.from([seeds.timestamp])")) {
    patched = patched.replace(/^(\s*)const seedsBuffer: Buffer\[\] = \[/m, (_, indent: string) =>
      [
        `${indent}const timestampBuffer = Buffer.alloc(8);`,
        `${indent}timestampBuffer.writeBigInt64LE(seeds.timestamp);`,
        `${indent}const seedsBuffer: Buffer[] = [`,
      ].join("\n"),
    );
    patched = patched.replace("Buffer.from([seeds.timestamp])", "timestampBuffer");
  }

  // patch type error in account files
  if (patched.includes("getMultipleAccountsInfo(addresses)")) {
    patched = patched.replaceAll("address: addresses[index],", "address: addresses[index]!,");
    patched = patched.replaceAll("[addresses[i].toBase58()]", "[addresses[i]!.toBase58()]");
  }

  for (const [typeName, valueName, fileName] of typeImports) {
    const replacement = [
      `import { ${valueName} } from "../types/${fileName}";`,
      `import type { ${typeName} } from "../types/${fileName}";`,
    ].join("\n");
    const importPattern = new RegExp(
      `import\\s*\\{\\s*${typeName},\\s*${valueName},?\\s*\\}\\s*from "\\.\\./types/${fileName}";`,
    );
    patched = patched.replace(importPattern, replacement);
  }

  return patched;
}

function generatedTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? generatedTypeScriptFiles(path)
      : entry.isFile() && path.endsWith(".ts")
        ? [path]
        : [];
  });
}

export function patchGeneratedClient(
  directory = fileURLToPath(new URL("../src/generated/", import.meta.url)),
): void {
  const files = generatedTypeScriptFiles(directory);
  files.forEach((path) => {
    const source = readFileSync(path, "utf8");
    const patched = patchGeneratedSource(source);
    if (patched !== source) writeFileSync(path, patched);
  });
}

if (import.meta.main) {
  patchGeneratedClient();
}

const patchGeneratedClientVisitor: Visitor<RootNode, "rootNode"> = {
  visitRoot(root) {
    patchGeneratedClient();
    return root;
  },
};

export default patchGeneratedClientVisitor;
