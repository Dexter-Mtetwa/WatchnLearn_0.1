import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@watchnlearn_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const cache = {
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);

      if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
};

export const cacheKeys = {
  subjects: (studentId: string) => `subjects_${studentId}`,
  enrollments: (studentId: string) => `enrollments_${studentId}`,
  terms: (subjectId: string) => `terms_${subjectId}`,
  chapters: (termId: string) => `chapters_${termId}`,
  topics: (chapterId: string) => `topics_${chapterId}`,
  progress: (studentId: string) => `progress_${studentId}`,
};
