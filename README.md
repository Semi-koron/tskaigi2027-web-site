# tskaigi-teaser-site

## 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発の始め方](#開発の始め方)
- [テスト方針](#テスト方針)
- [サイドイベントの追加](#サイドイベントの追加)

## 概要

本リポジトリでは本サイトが公開されるまでの間、多くの人たちに開催情報を伝えるwebサイトの作成を目標とする。
また技術カンファレンスへ向けてのワクワクを感じられるティザーを作ることを副目標とする。

## 技術スタック

- Astro 7：サイトの構築
- TypeScript：Astroのstrict設定を使用
- Node.js：26.13.1以上
- pnpm：パッケージ管理
- Prettier / prettier-plugin-astro：コード整形
- ESLint（typescript-eslint / eslint-plugin-astro / eslint-plugin-react-hooks）：静的解析
- Husky / lint-staged：コミット時に変更ファイルを ESLint で自動修正し、Prettier で整形

## ディレクトリ構成

```text
src/
├── assets/              # コンポーネントから読み込む画像・SVG
├── components/
│   ├── features/        # 機能単位のコンポーネント
│   │   ├── Header/
│   │   │   └── index.astro # サイト共通の静的なヘッダー
│   │   ├── Footer/
│   │   │   └── index.astro # サイト共通の静的なフッター
│   │   ├── SideEventItem/ # サイドイベント1件分の表示
│   │   └── islands/     # ブラウザで状態や操作を扱う動的なUI
│   │       ├── ClosedBadge/ # 閲覧時の日時で判定する「終了済み」バッジ
│   │       └── Counter/
│   │           └── index.tsx
│   └── ui/              # 再利用する基本UI（Buttonなど）
│       └── Button/
│           ├── index.tsx        # Propsの型定義とコンポーネント本体
│           └── index.module.css # Button専用のスタイル
├── constants/           # サイトに掲載するデータ
│   ├── sideEventList.ts # sideEvents.jsonをschemaで検証して読み込む
│   └── sideEvents.json  # サイドイベントのデータ
├── layouts/             # 各ページで使う共通レイアウト
├── pages/               # URLに対応するAstroページ
│   ├── index.astro      # トップページ
│   ├── 404.astro        # 404ページ
│   ├── code-of-conduct/
│   │   └── index.astro
│   └── side-events/
│       └── index.astro
├── schemas/             # データのzod schemaと型（Astro同梱のastro/zodを使う）
├── styles/              # カラーパレットや文字設定などの共通CSS
└── utils/               # UIに依存しない純粋な関数（*.test.tsで単体テスト）
public/                  # faviconなど、そのまま配信する静的ファイル
scripts/
└── add-side-event/      # issueからサイドイベントを追加するスクリプト（GitHub Actionsで実行）
.github/
├── ISSUE_TEMPLATE/
│   └── side-event.yml   # サイドイベント追加用のissueフォーム
└── workflows/
    └── add-side-event.yml # issueからサイドイベント追加のPRを作成する
```

ページは `.astro` に記述します。機能単位のコンポーネントは、以下のルールで作成します。

- 静的なコンポーネントは、`src/components/features/<コンポーネント名>/index.astro` に Astro コンポーネントとして作成します。
- ブラウザでの状態管理やイベント処理が必要な動的なコンポーネントは、`src/components/features/islands/<コンポーネント名>/index.tsx` に React コンポーネントとして作成します。
- Button などの再利用する基本UIは、`src/components/ui/` に配置します。

コンポーネント固有のCSSは `index.module.css` に置きます。

ブラウザでの操作が必要なReactコンポーネントには、Astro側で `client:*` を指定します（例：Counterは `client:visible`、ClosedBadgeは `client:idle`）。
`client:visible` は描画された要素が画面に入ったときに読み込むため、何も描画しないことがあるコンポーネントには `client:idle` を使います。
初期読み込みの負荷を抑えるため、`client:load` の使用はできるだけ避けましょう。

## 開発の始め方

Node.js（26.13.1以上）とpnpmを用意して、以下を実行します。

Node.jsの脆弱性報告を確認した際は、その都度、修正を含むバージョンへ速やかにアップデートし、`package.json` の `engines.node` も必要に応じて更新してください。

```sh
pnpm install
pnpm dev --background
```

起動時に表示されるURLをブラウザで開いてください。
開発サーバーの停止は `pnpm astro dev stop`、状態確認は `pnpm astro dev status`、ログ確認は `pnpm astro dev logs` で行えます。

ビルドは `pnpm build`、ビルド結果の確認は `pnpm preview`、コード整形は `pnpm format` を実行します。

CI と同じチェックは以下で実行できます。

```sh
pnpm format:check # 整形されているか
pnpm lint         # ESLint
pnpm check        # 型チェック（astro check）
```

## テスト方針

テスト方針は基本、開発環境での確認とします。

理由としては本サイト公開までの役割なので、保守運用にあまり多くのコストをかけるべきでないということが挙げられます。

ただし、日付の計算や入力のパースなど、UIに依存しない純粋なロジックは単体テストを書きます。
テストランナーには依存を増やさないようNode.js組み込みの `node:test` を使い、テスト対象の隣に `*.test.ts` として配置します。

```sh
pnpm test
```

## サイドイベントの追加

サイドイベントのデータは `src/constants/sideEvents.json` で管理しています。

1. issueの「サイドイベント追加」フォームから、イベントの情報を入力して起票します。
2. GitHub Actions（`.github/workflows/add-side-event.yml`）が `sideEvents.json` にイベントを追加するPRを自動で作成します。
3. PRの内容を確認してマージします。

終了日時（`finishedAt`）は、フォームの「終了時刻」を入力すると開催日のその時刻、空欄なら開催日の翌日0:00になります。終了日時を過ぎると「終了済み」と表示されます。

内容を修正するときは、PRではなくissueを編集してください。issueを編集するとPRが作り直されるため、PRを直接編集した内容は上書きされます。クローズ済みのissueを編集しても、PRは作られません。

issueは誰でも起票できるため、自動で作られたPRは必ず内容を確認してからマージしてください。

`sideEvents.json` を直接編集して追加することもできます。各項目の形式は `src/schemas/sideEvent.ts` のschemaを参照してください。schemaに合わないデータがあるとビルドが失敗します（例：`finishedAt` はタイムゾーン付きの `2026-02-09T21:30:00+09:00` の形式で書く必要があります）。

### 前提となるリポジトリの設定

- Settings → Actions → General → Workflow permissionsで「Allow GitHub Actions to create and approve pull requests」を有効にしてください。無効のままだとPRを作成できません。
- `GITHUB_TOKEN` で作成したPRでは、CIなど他のワークフローが動きません。CIを動かしたい場合は、対象リポジトリのContentsとPull requestsにRead and write権限を持つfine-grained PATを、Actionsのシークレット `SIDE_EVENT_PR_TOKEN` として登録してください（登録されていればそちらを使います）。
- issueを編集するとPRの内容が差し替わるため、ブランチ保護で「Dismiss stale pull request approvals when new commits are pushed」を有効にしておくことをおすすめします。
