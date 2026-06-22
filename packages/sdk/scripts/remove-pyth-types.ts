import type { RootNode } from "@codama/nodes";
import type { Visitor } from "@codama/visitors-core";

const externalPythTypes = new Set(["priceFeedMessage", "verificationLevel"]);

export function removePythTypes(root: RootNode): RootNode {
  return {
    ...root,
    program: {
      ...root.program,
      definedTypes: root.program.definedTypes.filter(
        (definedType) => !externalPythTypes.has(definedType.name),
      ),
    },
  };
}

const removePythTypesVisitor: Visitor<RootNode, "rootNode"> = {
  visitRoot: removePythTypes,
};

export default removePythTypesVisitor;
