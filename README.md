# 🌱 今日の小さな発見

毎日の移動を小さな冒険に変えるWebアプリです。

---

## 📱 スマホのホーム画面に追加する方法

### iPhoneの場合
1. SafariでアプリのURLを開く
2. 画面下の「共有」ボタン（□↑）をタップ
3. 「ホーム画面に追加」をタップ
4. 「追加」をタップ

### Androidの場合
1. ChromeでアプリのURLを開く
2. 右上の「︙」をタップ
3. 「ホーム画面に追加」をタップ

---

## 🚀 Vercelへのデプロイ手順

### ステップ1: GitHubにアップロード

1. [github.com](https://github.com) にアクセスしてアカウント作成（または既存アカウントでログイン）
2. 右上の「+」→「New repository」をクリック
3. Repository name に `discover-app` と入力
4. 「Create repository」をクリック
5. 「uploading an existing file」をクリック
6. このZIPを解凍したフォルダの中身を**全部**ドラッグ＆ドロップ
7. 「Commit changes」をクリック

### ステップ2: Vercelでデプロイ

1. [vercel.com](https://vercel.com) にアクセス
2. 「Sign Up」→「Continue with GitHub」でログイン
3. 「Add New Project」をクリック
4. `discover-app` を選んで「Import」
5. 何も変えずに「Deploy」をクリック
6. 🎉 URLが発行されます！（例: `https://discover-app-xxx.vercel.app`）

---

## ✨ 機能

- 🗺️ かわいいイラスト風の手描き地図
- 📍 発見した場所に絵文字ピンを立てる
- 🤖 AIが発見に詩的なコメントをくれる
- 🎯 毎日のミッション
- 📖 タイムラインで振り返り

---

## ⚠️ 注意

AIコメント機能（Claude API）はVercelにデプロイした後もそのまま動きます。
