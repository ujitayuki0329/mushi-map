
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
