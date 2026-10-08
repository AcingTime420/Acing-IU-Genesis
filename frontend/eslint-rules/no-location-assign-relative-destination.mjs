const absoluteUrl = /^(?:[a-z][\d+.a-z-]*:|\/\/)/i;
const globalPrefixes = new Set(["window", "globalThis", "document", "self"]);

function isMember(node, name) {
  if (node?.type !== "MemberExpression") return false;
  return node.computed
    ? node.property.type === "Literal" && node.property.value === name
    : node.property.type === "Identifier" && node.property.name === name;
}

function locationRoot(node) {
  if (node?.type === "Identifier" && node.name === "location") return node;
  if (
    node?.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    globalPrefixes.has(node.object.name) &&
    isMember(node, "location")
  ) {
    return node.object;
  }
  return null;
}

function isGlobalReference(sourceCode, node) {
  const variable = sourceCode.scopeManager.scopes[0].set.get(node.name);
  return (
    variable?.defs.length === 0 &&
    variable.references.some((reference) => reference.identifier === node)
  );
}

function variableFor(sourceCode, node) {
  for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(node.name);
    if (variable) return variable;
  }
  return null;
}

function staticStringPrefix(node, sourceCode, seen = new Set()) {
  if (!node || seen.has(node)) return null;
  seen.add(node);
  if (
    (node.type === "Literal" || node.type === "StringLiteral") &&
    typeof node.value === "string"
  ) {
    return node.value;
  }
  if (node.type === "TemplateLiteral" && node.quasis.length > 0) {
    return node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    return staticStringPrefix(node.left, sourceCode, seen);
  }
  if (node.type !== "Identifier") return null;

  const variable = variableFor(sourceCode, node);
  const definition = variable?.defs.at(-1);
  if (definition?.type !== "Variable") return null;
  let expression = definition.node.init;
  for (const reference of variable.references) {
    if (reference.identifier.range[0] >= node.range[0]) break;
    if (reference.isWrite() && reference.writeExpr !== definition.node.init) {
      expression = reference.writeExpr;
    }
  }
  return expression ? staticStringPrefix(expression, sourceCode, seen) : null;
}

function isRelativeUrl(value) {
  return !absoluteUrl.test(value);
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prevent relative location navigation that bypasses Next.js routing.",
      url: "https://nextjs.org/docs/messages/no-location-assign-relative-destination",
    },
    schema: [],
    messages: {
      noLocationAssign:
        "Use Next.js routing instead of {{expression}} for an internal destination.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    if (!sourceCode.scopeManager) return {};

    function report(node, expression) {
      context.report({
        node,
        messageId: "noLocationAssign",
        data: { expression },
      });
    }

    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;
        if (!isMember(callee, "assign")) return;
        const root = locationRoot(callee.object);
        if (!root || !isGlobalReference(sourceCode, root)) return;
        const firstArgument = args[0];
        if (!firstArgument || firstArgument.type === "SpreadElement") return;
        const value = staticStringPrefix(firstArgument, sourceCode);
        if (value !== null && isRelativeUrl(value)) {
          report(node, `${sourceCode.getText(callee)}()`);
        }
      },
      AssignmentExpression(node) {
        const { left, right } = node;
        if (!isMember(left, "href")) return;
        const root = locationRoot(left.object);
        if (!root || !isGlobalReference(sourceCode, root)) return;
        const value = staticStringPrefix(right, sourceCode);
        if (value !== null && isRelativeUrl(value)) {
          report(node, sourceCode.getText(left));
        }
      },
    };
  },
};

export default rule;
