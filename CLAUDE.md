# 北谷建設 日報・現場管理システム — 引き継ぎメモ

このファイルはClaude（Cowork / Claude Code どちらでも）がこのプロジェクトに
再度取り組む際に、経緯と設計判断をすぐ把握できるようにするための引き継ぎ資料です。
実装を始める前に必ずこのファイルを読んでください。

## プロジェクトの目的

北谷建設の日報管理（現在は手書き）をデジタル化する社内業務システム。
デモではなく実運用前提。最重要方針は「入力が簡単」「毎日使える」「スマホで迷わない」
「管理者が集計しなくていい」「元請け先/現場別の工数が正確」「出勤日数が正確」
「提出忘れを防止できる」の6点（詳細は元の要件定義を参照。要件定義文書は
このプロジェクトのやり取りの最初に整理済みで、ユーザーが保持している）。

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase（Postgres / Auth / Storage）
- Vercelへデプロイ予定（まだ未実施）
- PWA対応（manifest.json, public/sw.js, ホーム画面追加）
- パッケージ: @supabase/supabase-js, @supabase/ssr, zod

## 確定している重要な設計判断

- **ログイン方式**: 従業員は「社員コード」のみでログイン。内部的に
  `社員コード@kitatani-kensetsu.jp` という擬似メールアドレスに変換してSupabase Authへ渡す
  （`src/lib/config.ts`）。**注意**: 最初 `.local` ドメインを使ったところ、
  Supabaseのメール形式チェックで「invalid」と拒否されたため `.jp` に変更した経緯がある。
  今後も予約TLD（.local, .test, .invalid, .example等）は使わないこと。
- **人日の計算**: 固定8時間を1人日とし、各現場の実働時間 ÷ 8 で按分する。
- **勤務状態**: `employee_schedules` テーブルには「例外」のみ保存する。行が無い日は
  月〜土=出勤予定、日=休み をアプリ側で計算する（`src/lib/schedule.ts`）。
- **日報のデータ構造**: `daily_reports`（従業員×日付で1件、ヘッダー）と
  `work_entries`（現場ごとの明細、1日報に対して複数）の親子構造。出勤日数は
  daily_reportsの件数、現場別工数はwork_entriesのwork_hoursの合計で正確に集計できる。
- **写真・工具・材料の紐付け単位**: work_entry（現場明細）単位。ただし現時点では
  写真添付UIはユーザーの意向で無効化済み（下記「現状の実装状況」参照）。DBの
  report_photosテーブルとStorage設定は残してあるので、将来復活させやすい。
- **管理者権限の保護**: profiles.role や daily_reports.status='confirmed' への変更は、
  DBトリガー（`protect_profile_privileged_fields`, `protect_report_status`）で
  管理者以外からの変更を拒否している。初回の管理者作成時など、この保護を一時的に
  外す必要がある場合はSQL Editorで
  `alter table X disable trigger トリガー名;` → 変更 → `enable trigger` の手順が必要
  （実際にこの手順でユーザーが最初の管理者アカウントを作成した）。

## 現状の実装状況（Phase進捗）

- **Phase 1（完了）**: Next.js基盤、Supabase認証、role別ルート保護（`src/proxy.ts`。
  Next.js 16で `middleware.ts` → `proxy.ts` に規約変更されたため対応済み）、
  基本UI、PWA基礎。
- **Phase 2（完了）**: 従業員管理（Supabase Admin API経由でアカウント作成）、
  元請け先管理、現場管理、会社カレンダー（公休日、単日/期間一括登録）、
  勤務状態のトグル機能。
- **Phase 3（実装中〜一部見直し済み）**: 日報入力・過去の日報・管理者日報一覧・確認機能。
  ただし、実際にスマホで動作確認した際に以下の問題が出たため仕様を変更した。
  - `<input type="time">` はモバイルSafari等で幅がコンテナからはみ出す不具合が
    繰り返し発生したため、**時・分をそれぞれ選ぶ`<select>`方式に変更済み**
    （`src/app/report/new/report-form.tsx` の `TimeSelect` コンポーネント）。
    今後 time input を使う画面を追加する場合はこの教訓を踏まえること。
  - 画面下部に固定表示（`position: fixed`）していた保存ボタンが、他の要素の
    クリックを妨げる不具合の原因になった可能性が高いため、**固定表示をやめて
    通常のページの流れの中に配置**するよう変更済み。
  - ユーザーの要望により、日報入力画面から「作業内容の詳細」「今日行ったこと」
    「明日の予定」の入力欄と、写真添付機能を**削除**した（備考欄のみ残っている）。
    ただしDBカラム（`work_entries.work_detail`, `daily_reports.today_summary`,
    `daily_reports.tomorrow_plan`, `report_photos`テーブル）自体は残してある。
    将来的に復活させる可能性を考え、削除ではなく「未使用」の状態にしてある。
  - `crypto.randomUUID()` はHTTPS/localhost以外（LAN IPでスマホから開いた場合など）
    のセキュアでないコンテキストでは使えないため、React key生成には
    `makeKey()`という自前の簡易ID生成関数を使っている。同様の実装をする際は
    `crypto.randomUUID()` に頼らないこと。
  - **実機（スマホ）でLAN IP経由のテストをするときは `npm run dev`（開発モード）
    ではなく `npm run build && npm run start`（本番モード）を使うこと。**
    Next.js 16の開発モードは、LAN IPかつHTTP（非secureコンテキスト）でアクセスすると
    Reactのhydrationに失敗し、ボタン等が一切反応しなくなる不具合がある
    （`localhost`アクセスや本番ビルドでは発生しない、Next.js側の開発モード特有の問題）。
    Macのブラウザで確認する分には`npm run dev`のままでよい。
  - 日報保存時に「保存に失敗しました: Could not find the table 'public.daily_reports'
    in the schema cache」のようなPGRST205エラーが出た場合は、ローカルの
    `supabase/migrations/`にあるマイグレーションがリモートに未適用な可能性が高い。
    `supabase migration list` で `remote` 列が空のものがないか確認し、あれば
    `supabase db push` を実行する。実際に`daily_reports`/`work_entries`を作る
    マイグレーションが未適用のまま放置されていて、保存・提出ボタンが機能しない
    不具合の原因になったことがある。
- **Phase 4（工具の持ち出し/返却管理は完了、他は未着手）**:
  - 工具マスタ・持ち出し/返却管理は実装済み。`tools`（工具マスタ、1行=実物1点、
    管理番号で個体管理）と`tool_checkouts`（持ち出し/返却イベント）の2テーブル構成
    （`supabase/migrations/20260804000000_tools.sql`）。**設計判断**: CLAUDE.mdの
    他の記述では「写真・工具・材料の紐付け単位はwork_entry単位」としているが、
    工具の持ち出しは数日〜数週間続く実運用のため、日報のwork_entryとは**独立した
    イベント**として管理する方式を採用した（ユーザー合意済み）。同じ工具を同時に
    2人が持ち出せないよう、`tool_checkouts (tool_id) where returned_at is null`
    にユニークインデックスを張ってDBレベルで保証している。管理者向け`/admin/tools`
    （マスタCRUD＋現在の持ち出し状況一覧）、従業員向け`/tools`（持ち出し・返却）、
    ホーム画面の「現在持ち出している工具」カードの実データ接続まで完了。
  - 材料使用記録も実装済み。`materials`（材料マスタ、名前+単位）と
    `material_usages`（使用記録、消費して無くなるため工具のような状態管理は不要な
    追記型ログ）の2テーブル構成（`supabase/migrations/20260805000000_materials.sql`）。
    工具と同じく日報のwork_entryとは独立した別画面（`/materials`, `/admin/materials`）
    で記録する方式。ただしRLSは工具と異なり、他人の使用量を見せる必要が薄いため
    SELECTを「本人or管理者」に限定している（`tool_checkouts`は全員に開放）。
  - 管理者ダッシュボードの実データ化、月次集計（従業員別/元請け先別/
    現場別、CSV出力）、Web Push通知（18:00/翌6:00、Supabase pg_cron + Edge
    Functionsで実装予定）、UI仕上げ・Vercelデプロイ・実機テストは未着手。

## データベース

マイグレーションは `supabase/migrations/` に時系列で入っている。

1. `20260801000000_initial_schema.sql` — profiles, is_admin(), 権限保護トリガー
2. `20260802000000_masters.sql` — clients, worksites, company_holidays, employee_schedules
3. `20260802000100_profiles_employee_code.sql` — profiles.employee_code列追加
4. `20260803000000_reports.sql` — daily_reports, work_entries, report_photos
5. `20260803000100_storage.sql` — report-photosバケットとStorageポリシー
6. `20260804000000_tools.sql` — tools（工具マスタ）, tool_checkouts（持ち出し/返却イベント）
7. `20260805000000_materials.sql` — materials（材料マスタ）, material_usages（使用記録）

新しいテーブルを追加する場合も、必ず同じ命名規則（`YYYYMMDDHHMMSS_説明.sql`）で
マイグレーションファイルを追加し、`supabase db push` で反映する運用にしている
（Supabase StudioのUIで直接テーブルを作る操作はしていない）。

## 環境変数（.env.local。gitには含まれない）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Supabaseは2025年に新しいAPIキー体系（Publishable key / Secret keys）を導入しており、
ダッシュボードの表示名が変わっている。Publishable key → ANON_KEY、
Secret keys → SERVICE_ROLE_KEY として問題なく使える。

## ユーザー（Hinaさん）について

- エンジニアではないため、実装の詳細説明よりも「何を・どこで・どう操作するか」を
  具体的なステップで伝えることを常に優先する。
- ターミナル操作は問題なくできる（Phase 1以降、terminal上での作業を希望している）。
- 大きな仕様変更は必ず確認を取ってから進める方針で進めてきた。
