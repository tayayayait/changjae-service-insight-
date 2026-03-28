import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(__dirname, "..", "..");

const parseFile = (relativePath: string) => {
  const absolutePath = path.join(projectRoot, relativePath);
  const sourceText = fs.readFileSync(absolutePath, "utf8");
  const scriptKind = relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);

  return sourceFile.parseDiagnostics.map((diagnostic) => {
    const location =
      diagnostic.start === undefined
        ? ""
        : ` (${sourceFile.getLineAndCharacterOfPosition(diagnostic.start).line + 1}:${sourceFile.getLineAndCharacterOfPosition(diagnostic.start).character + 1})`;

    return `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}${location}`;
  });
};

describe("saju source syntax", () => {
  it.each([
    "src/types/result.ts",
    "src/lib/reportRenderers.ts",
    "src/components/saju/SajuActionCards.tsx",
    "src/components/saju/SajuCollectionTabs.tsx",
    "src/components/saju/SajuHelperMap.tsx",
    "src/components/saju/SajuTrendChart.tsx",
    "src/pages/ResultPage.tsx",
  ])("parses without TypeScript syntax errors: %s", (relativePath) => {
    expect(parseFile(relativePath)).toEqual([]);
  });
});
