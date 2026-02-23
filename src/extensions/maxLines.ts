import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface MaxLinesOptions {
  /**
   * 최대 허용 줄 수
   * @default null
   */
  limit: number | null | undefined;
}

const MaxLinesPluginKey = new PluginKey("maxLines");

/** 문서의 줄 수(최상위 블록 노드 수)를 계산 */
function countLines(doc: { content: { childCount: number } }): number {
  return doc.content.childCount;
}

export const MaxLines = Extension.create<MaxLinesOptions>({
  name: "maxLines",

  addOptions() {
    return {
      limit: null,
    };
  },

  addProseMirrorPlugins() {
    const limit = this.options.limit;

    return [
      new Plugin({
        key: MaxLinesPluginKey,
        filterTransaction: (transaction) => {
          if (!limit || limit <= 0 || !transaction.docChanged) {
            return true;
          }

          const newLineCount = countLines(transaction.doc);

          if (newLineCount <= limit) {
            return true;
          }

          return false;
        },
      }),
    ];
  },
});
