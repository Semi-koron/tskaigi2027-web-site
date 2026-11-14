# tskaigi-teaser-site

## 目次

- [概要](#概要)
- [技術スタック](#技術スタック)
- [ディレクトリ構成](#ディレクトリ構成)
- [開発の始め方](#開発の始め方)
- [テスト方針](#テスト方針)

## 概要

本リポジトリでは本サイトが公開されるまでの間、多くの人たちに開催情報を伝えるwebサイトの作成を目標とする。
また技術カンファレンスへ向けてのワクワクを感じられるティザーを作ることを副目標とする。

## 技術スタック

- Astro 7：サイトの構築
- TypeScript：Astroのstrict設定を使用
- Node.js：26.13.1以上
- pnpm：パッケージ管理
- Prettier / prettier-plugin-astro：コード整形
- Husky / lint-staged：コミット時に変更ファイルを自動整形

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
│   │   └── islands/     # ブラウザで状態や操作を扱う動的なUI
│   │       └── Counter/
│   │           └── index.tsx
│   └── ui/              # 再利用する基本UI（Buttonなど）
│       └── Button/
│           ├── index.tsx        # Propsの型定義とコンポーネント本体
│           └── index.module.css # Button専用のスタイル
├── layouts/             # 各ページで使う共通レイアウト
├── pages/               # URLに対応するAstroページ
│   ├── index.astro      # トップページ
│   ├── 404.astro        # 404ページ
│   ├── code-of-conduct/
│   │   └── index.astro
│   └── side-event/
│       └── index.astro
└── styles/              # カラーパレットや文字設定などの共通CSS
public/                  # faviconなど、そのまま配信する静的ファイル
```

ページは `.astro` に記述します。機能単位のコンポーネントは、以下のルールで作成します。

- 静的なコンポーネントは、`src/components/features/<コンポーネント名>/index.astro` に Astro コンポーネントとして作成します。
- ブラウザでの状態管理やイベント処理が必要な動的なコンポーネントは、`src/components/features/islands/<コンポーネント名>/index.tsx` に React コンポーネントとして作成します。
- Button などの再利用する基本UIは、`src/components/ui/` に配置します。

コンポーネント固有のCSSは `index.module.css` に置きます（現在はButtonで使用）。

ブラウザでの操作が必要なReactコンポーネントには、Astro側で `client:*` を指定します（現在はCounterに `client:visible` を指定）。
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

## テスト方針

テスト方針は基本、開発環境での確認とします。

理由としては本サイト公開までの役割なので、保守運用にあまり多くのコストをかけるべきでないということが挙げられます。
