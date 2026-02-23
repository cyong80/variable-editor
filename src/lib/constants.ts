/** `#{변수명}` 형식 파싱용 정규식 */
export const VARIABLE_REGEX = /#\{([^}]+)\}/g;

/** 기본 제공 변수 목록 */
export const DEFAULT_VARIABLES = [
  "userName",
  "userEmail",
  "amount",
  "date",
  "productName",
  "orderId",
  "companyName",
  "phoneNumber",
] as const;
