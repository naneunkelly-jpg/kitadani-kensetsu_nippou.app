import { createClient } from "@/lib/supabase/client";

/**
 * 現場写真をSupabase Storage（report-photosバケット）へアップロードする。
 * パス規約: {employeeId}/{reportDate}/{ランダムID}-{ファイル名}
 * 戻り値はStorage内のパス（DBに保存し、表示時は署名付きURLを発行する）。
 */
export async function uploadReportPhoto(
  file: File,
  employeeId: string,
  reportDate: string
): Promise<string> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${employeeId}/${reportDate}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(path, file, { upsert: false });

  if (error) {
    throw new Error(`写真のアップロードに失敗しました: ${error.message}`);
  }

  return path;
}
