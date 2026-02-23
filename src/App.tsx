import { useState } from "react";
import { VariableEditor } from "@/components/VariableEditor";

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

function App() {
  const [value, setValue] = useState(DEFAULT_VALUE);

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-muted/30 p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-3">
          <h1 className="text-lg font-semibold tracking-tight">변수 에디터</h1>
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5">#{"{변수명}"}</code>
            형태로 입력하면 맨션이 됩니다.
          </p>
        </div>
        <VariableEditor
          placeholder={`안녕하세요 # 입력 후 변수 선택,\n주문 금액 #{amount}원입니다.`}
          variables={VARIABLES}
          maxLength={500}
          maxLines={10}
          defaultValue={DEFAULT_VALUE}
          onValueChange={(newValue, mentions) => {
            setValue(newValue);
            console.log("값:", newValue, "맨션:", mentions);
          }}
        />
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            뷰모드
          </h2>
          <VariableEditor
            viewMode
            variables={VARIABLES}
            value={value}
            maxLength={500}
            maxLines={10}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
