import { VARIABLE_REGEX } from "./constants";

/** TipTap JSON을 "#{변수명}" 형식의 텍스트로 변환 */
export function serializeToVariableText(json: { content?: unknown[] }): string {
  const lines: string[] = [];
  json.content?.forEach((para) => {
    const node = para as {
      type?: string;
      content?: { type?: string; text?: string; attrs?: { id?: string } }[];
    };
    if (node.type !== "paragraph") return;
    const parts: string[] = [];
    node.content?.forEach((child) => {
      if (child.type === "text") parts.push(child.text ?? "");
      else if (child.type === "mention" && child.attrs?.id)
        parts.push(formatVariableId(child.attrs.id));
    });
    lines.push(parts.join(""));
  });
  return lines.join("\n");
}

/** "#{변수명}" 형식의 텍스트를 TipTap JSON으로 변환 */
export function parseVariableText(text: string) {
  const lines = text.split(/\n/);
  const content = lines.map((line) => {
    const parts: {
      type: string;
      text?: string;
      attrs?: Record<string, string>;
    }[] = [];
    let lastIndex = 0;
    const regex = new RegExp(VARIABLE_REGEX.source, "g");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > lastIndex) {
        const textBetween = line.slice(lastIndex, m.index);
        if (textBetween) {
          parts.push({ type: "text", text: textBetween });
        }
      }
      parts.push({
        type: "mention",
        attrs: { id: m[1], mentionSuggestionChar: "#" },
      });
      lastIndex = regex.lastIndex;
    }
    const textAfter = line.slice(lastIndex);
    if (textAfter) {
      parts.push({ type: "text", text: textAfter });
    }
    if (parts.length === 0) {
      return { type: "paragraph" };
    }
    return { type: "paragraph", content: parts };
  });
  return { type: "doc", content };
}

/** 변수 ID를 `#{id}` 형식 문자열로 변환 */
export function formatVariableId(id: string): string {
  return `#${"{" + id + "}"}`;
}

/** 텍스트에서 변수 ID 목록 추출 */
export function extractMentionIds(text: string): string[] {
  const mentions: string[] = [];
  const regex = new RegExp(VARIABLE_REGEX.source, "g");
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]!);
  }
  return [...new Set(mentions)];
}
