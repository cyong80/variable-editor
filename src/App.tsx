import { useState } from "react";
import { VariableEditor } from "@/components/VariableEditor";
import { VariableEditorTailwind } from "@/components/VariableEditorTailwind";

const DEFAULT_VALUE = `안녕하세요 #{userName}님,
            #{companyName}에서 발송한 주문 안내입니다.\n・ 주문번호: #{orderId}\n・ 상품명: #{productName}\n・ 결제금액: #{amount}원\n・ 주문일: #{date}\n문의사항이 있으시면 #{phoneNumber} 또는 #{userEmail}로 연락 부탁드립니다.`;

const VARIABLES = [
  "userName",
  "companyName",
  "orderId",
  "productName",
  "amount",
  "date",
  "phoneNumber",
  "userEmail",
];

type EditorVariant = "shadcn" | "tailwind";

function App() {
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [variant, setVariant] = useState<EditorVariant>("shadcn");

  const sharedProps = {
    placeholder: `안녕하세요 # 입력 후 변수 선택,\n주문 금액 #{amount}원입니다.`,
    variables: VARIABLES,
    maxLength: 500,
    maxLines: 10,
    defaultValue: DEFAULT_VALUE,
    onValueChange: (newValue: string, mentions: string[]) => {
      setValue(newValue);
      console.log("값:", newValue, "맨션:", mentions);
    },
  };

  const EditorComponent =
    variant === "shadcn" ? VariableEditor : VariableEditorTailwind;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
              변수 에디터
            </h1>
            <p className="text-sm text-gray-500">
              <code className="rounded bg-gray-200 px-1 py-0.5">#{"{변수명}"}</code>
              형태로 입력하면 맨션이 됩니다.
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setVariant("shadcn")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                variant === "shadcn"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shadcn
            </button>
            <button
              type="button"
              onClick={() => setVariant("tailwind")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                variant === "tailwind"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tailwind
            </button>
          </div>
        </div>

        <EditorComponent {...sharedProps} />

        <div className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-gray-500">뷰모드</h2>
          {variant === "shadcn" ? (
            <VariableEditor
              viewMode
              variables={VARIABLES}
              value={value}
              maxLength={500}
              maxLines={10}
            />
          ) : (
            <VariableEditorTailwind
              viewMode
              variables={VARIABLES}
              value={value}
              maxLength={500}
              maxLines={10}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
