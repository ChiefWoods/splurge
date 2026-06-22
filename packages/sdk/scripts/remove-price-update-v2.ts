import type { RootNode } from "@codama/nodes";
import type { Visitor } from "@codama/visitors-core";

export function removePriceUpdateV2Account(root: RootNode): RootNode {
  return {
    ...root,
    program: {
      ...root.program,
      accounts: root.program.accounts.filter((account) => account.name !== "priceUpdateV2"),
    },
  };
}

const removePriceUpdateV2AccountVisitor: Visitor<RootNode, "rootNode"> = {
  visitRoot: removePriceUpdateV2Account,
};

export default removePriceUpdateV2AccountVisitor;
