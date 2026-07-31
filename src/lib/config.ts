// 従業員ログイン用の擬似メールドメイン。
// 従業員は「社員コード」だけを入力し、内部的に `社員コード@ドメイン` としてSupabase Authに渡す。
// 注意: ".local" 等の予約済みTLDはSupabaseのメール形式チェックで無効と判定されるため、
// 通常のドメイン形式（.jp など）を使用すること。実在する必要はない。
export const EMPLOYEE_LOGIN_DOMAIN = "kitatani-kensetsu.jp";

export function employeeCodeToEmail(employeeCode: string): string {
  return `${employeeCode.trim().toLowerCase()}@${EMPLOYEE_LOGIN_DOMAIN}`;
}
