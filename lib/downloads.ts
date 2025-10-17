import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;
const DOWNLOADS_KEY = '@watchnlearn_downloads';

interface DownloadRecord {
  id: string;
  name: string;
  type: 'video' | 'pdf';
  url: string;
  localUri: string;
  downloadedAt: number;
}

export const downloads = {
  async init(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Error initializing downloads directory:', error);
    }
  },

  async download(id: string, name: string, url: string, type: 'video' | 'pdf'): Promise<string | null> {
    try {
      await this.init();

      const extension = type === 'video' ? '.mp4' : '.pdf';
      const filename = `${id}${extension}`;
      const localUri = `${DOWNLOADS_DIR}${filename}`;

      const { uri } = await FileSystem.downloadAsync(url, localUri);

      const record: DownloadRecord = {
        id,
        name,
        type,
        url,
        localUri: uri,
        downloadedAt: Date.now(),
      };

      await this.saveRecord(record);
      return uri;
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  },

  async getDownload(id: string): Promise<DownloadRecord | null> {
    try {
      const records = await this.getAllRecords();
      return records.find(r => r.id === id) || null;
    } catch (error) {
      console.error('Error getting download:', error);
      return null;
    }
  },

  async isDownloaded(id: string): Promise<boolean> {
    const record = await this.getDownload(id);
    if (!record) return false;

    const fileInfo = await FileSystem.getInfoAsync(record.localUri);
    return fileInfo.exists;
  },

  async deleteDownload(id: string): Promise<void> {
    try {
      const record = await this.getDownload(id);
      if (!record) return;

      await FileSystem.deleteAsync(record.localUri, { idempotent: true });

      const records = await this.getAllRecords();
      const updatedRecords = records.filter(r => r.id !== id);
      await this.saveAllRecords(updatedRecords);
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  },

  async getAllRecords(): Promise<DownloadRecord[]> {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting download records:', error);
      return [];
    }
  },

  async saveRecord(record: DownloadRecord): Promise<void> {
    try {
      const records = await this.getAllRecords();
      const existingIndex = records.findIndex(r => r.id === record.id);

      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }

      await this.saveAllRecords(records);
    } catch (error) {
      console.error('Error saving download record:', error);
    }
  },

  async saveAllRecords(records: DownloadRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving download records:', error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true });
      await AsyncStorage.removeItem(DOWNLOADS_KEY);
      await this.init();
    } catch (error) {
      console.error('Error clearing downloads:', error);
    }
  },
};
