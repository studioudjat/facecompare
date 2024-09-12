# FaceCompare アプリケーション

FaceCompare は、AWS Rekognition と React を使用して開発された顔認識アプリケーションです。このアプリケーションでは、画像のアップロード、顔の比較、ID からの情報抽出などの機能を提供します。

## 機能

- 画像のアップロードと管理
- 顔の比較（1 対 1 および 1 対多）
- ID 情報の抽出（OpenAI API を使用）
- 画像ギャラリーの表示
- プロフィール画像の設定

## 技術スタック

- React
- AWS SDK (S3, Rekognition)
- Material-UI
- OpenAI API

## セットアップ

1. リポジトリをクローンします：

   ```
   git clone https://github.com/yourusername/facecompare-app.git
   cd facecompare-app
   ```

2. 依存関係をインストールします：

   ```
   npm install
   ```

3. `.env.example` ファイルを `.env` にコピーし、必要な環境変数を設定します：

   ```
   cp .env.example .env
   ```

   テキストエディタで `.env` を開き、以下の変数に適切な値を設定してください：

   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - S3_BUCKET_NAME
   - OPENAI_API_KEY

4. アプリケーションを起動します：
   ```
   npm start
   ```

## 使用方法

1. **画像のアップロード**: 「Add」ページで画像をアップロードします。
2. **画像の一覧表示**: 「List」ページでアップロードされた画像を確認します。
3. **顔の比較**: 「Match」ページでプロフィール画像と他の画像を比較します。
4. **1 対 1 の顔比較**: 「Compare」ページで 2 つの画像の顔を比較します。
5. **ID 情報の抽出**: 「Extract」ページで ID 画像から情報を抽出します。

## 注意事項

- このアプリケーションは、AWS のサービスと OpenAI API を使用しています。使用には適切な認証情報と料金が発生する可能性があります。
- 個人情報や機密情報の取り扱いには十分注意してください。
- 本番環境にデプロイする際は、適切なセキュリティ対策を講じてください。

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE) のもとで公開されています。
