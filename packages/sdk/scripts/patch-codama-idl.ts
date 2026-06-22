import type { InstructionAccountNode, PdaNode, RootNode } from "@codama/nodes";
import type { Visitor } from "@codama/visitors-core";

const itemPda = {
  kind: "pdaNode",
  name: "item",
  seeds: [
    {
      kind: "constantPdaSeedNode",
      type: { kind: "bytesTypeNode" },
      value: { kind: "bytesValueNode", data: "3hLoAt", encoding: "base58" },
    },
    {
      kind: "variablePdaSeedNode",
      name: "store",
      type: { kind: "publicKeyTypeNode" },
    },
    {
      kind: "variablePdaSeedNode",
      name: "name",
      type: { kind: "stringTypeNode", encoding: "utf8" },
    },
  ],
} as PdaNode;

const itemDefaultValue = {
  kind: "pdaValueNode",
  pda: { kind: "pdaLinkNode", name: "item" },
  seeds: [
    {
      kind: "pdaSeedValueNode",
      name: "store",
      value: { kind: "accountValueNode", name: "store" },
    },
    {
      kind: "pdaSeedValueNode",
      name: "name",
      value: { kind: "argumentValueNode", name: "name" },
    },
  ],
} as NonNullable<InstructionAccountNode["defaultValue"]>;

export function patchSplurgeCodamaIdl(root: RootNode): RootNode {
  const listItem = root.program.instructions.find((instruction) => instruction.name === "listItem");
  const itemAccount = listItem?.accounts.find((account) => account.name === "item");

  if (!itemAccount) {
    throw new Error("Codama IDL does not contain the listItem.item account");
  }

  return {
    ...root,
    program: {
      ...root.program,
      pdas: [...root.program.pdas.filter((pda) => pda.name !== "item"), itemPda],
      instructions: root.program.instructions.map((instruction) =>
        instruction.name !== "listItem"
          ? instruction
          : {
              ...instruction,
              accounts: instruction.accounts.map((account) =>
                account.name === "item" ? { ...account, defaultValue: itemDefaultValue } : account,
              ),
            },
      ),
    },
  };
}

const patchSplurgeCodamaIdlVisitor: Visitor<RootNode, "rootNode"> = {
  visitRoot: patchSplurgeCodamaIdl,
};

export default patchSplurgeCodamaIdlVisitor;
