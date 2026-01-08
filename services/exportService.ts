import { getUserEntries } from './dataService';
import { InsectEntry } from '../types';

// CSV形式でエクスポート
export const exportToCSV = async (userId: string): Promise<void> => {
  try {
    const entries = await getUserEntries(userId);
    
    // CSVヘッダー
    const headers = ['ID', '名前', 'メモ', '緯度', '経度', '日時', '画像URL', 'AI洞察'];
    const rows = entries.map(entry => {
      const date = new Date(entry.timestamp).toLocaleString('ja-JP');
      const aiInsights = entry.aiInsights?.description || '';
      
      // CSV形式に変換（カンマや改行を含む可能性があるため、ダブルクォートで囲む）
      return [
        entry.id || '',
        `"${(entry.name || '').replace(/"/g, '""')}"`,
        `"${(entry.memo || '').replace(/"/g, '""')}"`,
        entry.latitude?.toString() || '',
        entry.longitude?.toString() || '',
        `"${date}"`,
        entry.imageUrl || '',
        `"${aiInsights.replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');
    
    // BOMを追加してExcelで正しく開けるようにする
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mushi-map-entries-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

// JSON形式でエクスポート
export const exportToJSON = async (userId: string): Promise<void> => {
  try {
    const entries = await getUserEntries(userId);
    
    // エクスポート用のデータ構造
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      entries: entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        memo: entry.memo,
        latitude: entry.latitude,
        longitude: entry.longitude,
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp).toISOString(),
        imageUrl: entry.imageUrl,
        aiInsights: entry.aiInsights
      }))
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mushi-map-entries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};
