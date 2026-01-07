<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/17U45jQlrT2TVJt9B2a685AxZ10LVXB8z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. APIキーの設定:
   - プロジェクトのルートディレクトリに `.env` ファイルを作成してください
   - 以下の内容を記述してください:
     ```
     VITE_GEMINI_API_KEY=your_api_key_here
     ```
   - Gemini APIキーは [Google AI Studio](https://aistudio.google.com/apikey) で取得できます
   - **重要**: `.env` ファイルはGitにコミットしないでください（既に.gitignoreに含まれています）

3. アプリを起動:
   ```bash
   npm run dev
   ```

## トラブルシューティング

### 地図が表示されない場合
- ブラウザのコンソールでエラーを確認してください
- LeafletのCSSが正しく読み込まれているか確認してください

### AI判定機能が動作しない場合
- `.env` ファイルがプロジェクトのルートディレクトリに存在するか確認してください
- `VITE_GEMINI_API_KEY` が正しく設定されているか確認してください
- APIキーが有効か確認してください
- ブラウザのコンソールでエラーメッセージを確認してください
