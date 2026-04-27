# pocoru プロジェクトメモ
## アプリ概要
- 名前：pocoru（街歩きSNSアプリ）
- URL：https://pocoru.vercel.app
- 技術：React（Create React App）、Supabase、Vercel

## インフラ
- Supabase URL：https://srkzjzgiejjoefaizsyo.supabase.co
- GitHub：https://github.com/mogura-kun/pocoru
- 認証：Google OAuth（Supabase Auth）

## ファイル構成
- src/App.js：全コード（約910行）
- public/：アイコン・ロゴ・カテゴリ画像

## 主な機能
- 地図（Leaflet）に発見をピンで投稿
- カテゴリ：花・鳥・魚・音・パン・その他
- 投稿にAIコメント（Claude API）
- Google認証でログイン
- タイムライン（半径5km）
- マイページ（永久保存）
- 写真加工・トリミング機能
- 天気共有機能

## Gitの更新方法
```
git add .
git commit -m "update"
git push
```

## 未解決の問題
