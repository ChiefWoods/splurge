import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";
import { renderVisitor } from "@pratikbuilds/web3js-legacy";
import {
  accountValueNode,
  addPdasVisitor,
  argumentValueNode,
  bytesTypeNode,
  constantPdaSeedNode,
  createFromRoot,
  getCommonInstructionAccountDefaultRules,
  pdaLinkNode,
  pdaSeedValueNode,
  pdaValueNode,
  publicKeyTypeNode,
  publicKeyValueNode,
  setInstructionAccountDefaultValuesVisitor,
  stringTypeNode,
  updateAccountsVisitor,
  updateDefinedTypesVisitor,
  updateInstructionsVisitor,
  variablePdaSeedNode,
} from "codama";

const sdkRoot = `${import.meta.dir}/..`;
const anchorIdlPath = `${sdkRoot}/src/idl/anchor/splurge.json`;
const codamaIdlPath = `${sdkRoot}/src/idl/codama/splurge.json`;
const generatedPath = `${sdkRoot}/src/generated`;

const idlTransforms = [
  addPdasVisitor({
    splurge: [
      {
        name: "item",
        seeds: [
          constantPdaSeedNode(bytesTypeNode(), {
            kind: "bytesValueNode",
            // string "item" encoded in base58
            data: "3hLoAt",
            encoding: "base58",
          }),
          variablePdaSeedNode("store", publicKeyTypeNode()),
          variablePdaSeedNode("name", stringTypeNode("utf8")),
        ],
      },
    ],
  }),
  updateInstructionsVisitor({
    listItem: {
      accounts: {
        item: {
          defaultValue: pdaValueNode(pdaLinkNode("item"), [
            pdaSeedValueNode("store", accountValueNode("store")),
            pdaSeedValueNode("name", argumentValueNode("name")),
          ]),
        },
      },
    },
  }),
  updateAccountsVisitor({
    priceUpdateV2: { delete: true },
  }),
  updateDefinedTypesVisitor({
    priceFeedMessage: { delete: true },
    verificationLevel: { delete: true },
  }),
  setInstructionAccountDefaultValuesVisitor([
    ...getCommonInstructionAccountDefaultRules(),
    {
      account: /^associatedTokenProgram$/,
      defaultValue: publicKeyValueNode(
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
        "associatedTokenProgram",
      ),
    },
  ]),
] as const;

function patchGeneratedSource(source: string): string {
  let patched = source;

  const resolvedAccountNames = [...patched.matchAll(/let (\w+) = accounts\.\1;/g)].map(
    (match) => match[1],
  );
  for (const accountName of resolvedAccountNames) {
    patched = patched.replaceAll(`${accountName}: accounts.${accountName},`, `${accountName},`);
  }

  // patch i64 seed incorrectly parsed as 1 byte
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

  // patch addresses[index] being undefined
  if (patched.includes("getMultipleAccountsInfo(addresses)")) {
    patched = patched.replaceAll("address: addresses[index],", "address: addresses[index]!,");
    patched = patched.replaceAll("[addresses[i].toBase58()]", "[addresses[i]!.toBase58()]");
  }

  return patched;
}

async function patchGeneratedClient(directory: string): Promise<void> {
  const glob = new Bun.Glob("**/*.ts");
  for await (const relativePath of glob.scan({ cwd: directory, onlyFiles: true })) {
    const path = `${directory}/${relativePath}`;
    const source = await Bun.file(path).text();
    const patched = patchGeneratedSource(source);
    if (patched !== source) await Bun.write(path, patched);
  }
}

const anchorIdlFile = Bun.file(anchorIdlPath);
if (!(await anchorIdlFile.exists())) {
  throw new Error(`Failed to load IDL: ${anchorIdlPath} does not exist`);
}

const codama = createFromRoot(rootNodeFromAnchor(await anchorIdlFile.json()));

for (const transform of idlTransforms) {
  codama.update(transform);
}

await Bun.write(codamaIdlPath, codama.getJson());

await codama.accept(
  renderVisitor(generatedPath, {
    deleteFolderBeforeRendering: true,
    // packageFolder is bugged, value is not respected
  }),
);
// manual patches that visitors cannot fix
await patchGeneratedClient(generatedPath);
