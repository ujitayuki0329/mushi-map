
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client with the API key from environment variables as a named parameter.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set. Please create a .env file with your API key.");
  console.error("Example: Create a .env file in the project root with: VITE_GEMINI_API_KEY=your_api_key_here");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeInsectImage = async (base64Image: string) => {
  if (!ai) {
    console.error("Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in .env file.");
    throw new Error("APIキーが設定されていません。.envファイルにVITE_GEMINI_API_KEYを設定してください。");
  }
  try {
    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;
    
    // Detect mime type from base64 string
    const mimeType = base64Image.startsWith('data:image/png') 
      ? 'image/png' 
      : base64Image.startsWith('data:image/jpeg') || base64Image.startsWith('data:image/jpg')
      ? 'image/jpeg'
      : 'image/jpeg'; // default

    const prompt = "この画像に写っている昆虫の名前を特定し、その特徴や生態について簡潔に説明してください。日本語で回答してください。JSON形式で返してください。フォーマット: {\"name\": \"昆虫の名前\", \"description\": \"特徴や生態の説明\"}";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: prompt },
        { 
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          }
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("AIからの応答が空でした。");
    }

    // Parse JSON response
    const parsedResult = JSON.parse(text);
    return parsedResult;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    // Return a more detailed error message
    throw new Error(`AI判定中にエラーが発生しました: ${error.message || '不明なエラー'}`);
  }
};

// プレミアムプラン向け: 高性能なAI判定（より高精度なモデルと詳細なプロンプト）
export const analyzeInsectImagePremium = async (base64Image: string) => {
  if (!ai) {
    console.error("Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in .env file.");
    throw new Error("APIキーが設定されていません。.envファイルにVITE_GEMINI_API_KEYを設定してください。");
  }
  try {
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;
    
    const mimeType = base64Image.startsWith('data:image/png') 
      ? 'image/png' 
      : base64Image.startsWith('data:image/jpeg') || base64Image.startsWith('data:image/jpg')
      ? 'image/jpeg'
      : 'image/jpeg';

    // より詳細なプロンプトで高精度な判定
    const prompt = `この画像に写っている昆虫を詳細に分析してください。以下の情報を含めてJSON形式で返してください：
- name: 昆虫の正式名称（学名も可能であれば含める）
- commonName: 一般的な呼び名
- description: 詳細な特徴や生態の説明（200文字以上）
- characteristics: 外見的特徴（色、模様、サイズなど）
- habitat: 生息環境
- season: よく見られる季節
- confidence: 判定の信頼度（0-100の数値）

日本語で回答してください。JSON形式: {"name": "...", "commonName": "...", "description": "...", "characteristics": "...", "habitat": "...", "season": "...", "confidence": 数値}`;

    // より高精度なモデルを使用（利用可能な場合、フォールバックあり）
    let model = "gemini-2.0-flash-exp";
    
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          { text: prompt },
          { 
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.3, // より一貫性のある結果
        }
      });

      const text = response.text;
      
      if (!text) {
        throw new Error("AIからの応答が空でした。");
      }

      const parsedResult = JSON.parse(text);
      return parsedResult;
    } catch (modelError: any) {
      // モデルが利用できない場合は通常版にフォールバック
      console.warn(`Premium model ${model} not available, falling back to standard:`, modelError);
      return await analyzeInsectImage(base64Image);
    }
  } catch (error: any) {
    console.error("Premium AI Analysis Error:", error);
    // エラー時は通常版にフォールバック
    console.log("Falling back to standard analysis...");
    return await analyzeInsectImage(base64Image);
  }
};

export const getInsectDetails = async (name: string, lat: number, lng: number) => {
  if (!ai) {
    console.error("Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in .env file.");
    return {
      description: "APIキーが設定されていません。.envファイルにVITE_GEMINI_API_KEYを設定してください。",
      links: []
    };
  }
  try {
    const prompt = `私は現在、緯度${lat}, 経度${lng}の地点で「${name}」という昆虫を採集しました。この昆虫についての詳細な生態情報と、この周辺地域での生息状況や関連する自然スポットを教えてください。`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "情報が見つかりませんでした。";

    // Try to extract grounding metadata if available
    const candidates = response.candidates || [];
    const chunks = candidates[0]?.groundingMetadata?.groundingChunks || [];
    
    const links = chunks
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title || "関連スポット",
        uri: chunk.maps.uri || ""
      }));

    return {
      description: text,
      links: links
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      description: `AI情報の取得中にエラーが発生しました: ${error.message || '不明なエラー'}`,
      links: []
    };
  }
};

// プレミアムプラン向け: 詳細な生態データ（構造化された情報とより多くの関連スポット）
export const getInsectDetailsPremium = async (name: string, lat: number, lng: number) => {
  if (!ai) {
    console.error("Gemini API is not initialized. Please set VITE_GEMINI_API_KEY in .env file.");
    return {
      description: "APIキーが設定されていません。.envファイルにVITE_GEMINI_API_KEYを設定してください。",
      links: []
    };
  }
  try {
    // より詳細なプロンプトで構造化された情報を取得
    const prompt = `私は現在、緯度${lat}, 経度${lng}の地点で「${name}」という昆虫を採集しました。

以下の詳細な情報を提供してください：

1. **分類情報**: 目、科、属などの分類学的な情報
2. **生態**: 生活史、行動パターン、食性、天敵など
3. **生息環境**: 好む環境、生息地の特徴
4. **季節性**: 出現時期、活動時期
5. **分布**: 日本国内での分布状況
6. **この地域での特徴**: 採集地点周辺での生息状況や特徴
7. **観察のポイント**: 観察や採集の際の注意点やコツ
8. **関連する自然環境**: この昆虫が好む植物、環境など

また、この昆虫に関連する周辺地域の自然スポット、観察地、関連する施設なども可能な限り多く教えてください。

詳細で専門的な情報を提供してください。`;

    // より高精度なモデルを使用（フォールバックあり）
    let model = "gemini-2.0-flash-exp";
    
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.4, // 創造性と正確性のバランス
        }
      });

      const text = response.text || "情報が見つかりませんでした。";

      // Try to extract grounding metadata if available
      const candidates = response.candidates || [];
      const chunks = candidates[0]?.groundingMetadata?.groundingChunks || [];
      
      const links = chunks
        .filter((chunk: any) => chunk.maps)
        .map((chunk: any) => ({
          title: chunk.maps.title || "関連スポット",
          uri: chunk.maps.uri || ""
        }));

      return {
        description: text,
        links: links
      };
    } catch (modelError: any) {
      // モデルが利用できない場合は通常版にフォールバック
      console.warn(`Premium model ${model} not available, falling back to standard:`, modelError);
      return await getInsectDetails(name, lat, lng);
    }
  } catch (error: any) {
    console.error("Premium Gemini API Error:", error);
    // エラー時は通常版にフォールバック
    console.log("Falling back to standard details...");
    return await getInsectDetails(name, lat, lng);
  }
};
