import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground } from 'react-native';
import { Download, FileText, Video, Trash2 } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import * as FileSystem from 'expo-file-system';

interface DownloadedFile {
  id: string;
  name: string;
  type: 'video' | 'pdf';
  size: string;
  downloadedAt: Date;
  uri: string;
}

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadedFile[]>([]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      const dirInfo = await FileSystem.getInfoAsync(downloadDir);

      if (!dirInfo.exists) {
        return;
      }

      const files = await FileSystem.readDirectoryAsync(downloadDir);

      const fileDetails = await Promise.all(
        files.map(async (fileName) => {
          const fileUri = `${downloadDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });

          const isVideo = fileName.toLowerCase().endsWith('.mp4');
          const isPDF = fileName.toLowerCase().endsWith('.pdf');

          return {
            id: fileName,
            name: fileName,
            type: (isVideo ? 'video' : 'pdf') as 'video' | 'pdf',
            size: formatFileSize(fileInfo.size || 0),
            downloadedAt: new Date(fileInfo.modificationTime || Date.now()),
            uri: fileUri,
          };
        })
      );

      const sortedFiles = fileDetails.sort((a, b) =>
        b.downloadedAt.getTime() - a.downloadedAt.getTime()
      );

      setDownloads(sortedFiles);
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleDelete = async (file: DownloadedFile) => {
    try {
      await FileSystem.deleteAsync(file.uri);
      setDownloads(prev => prev.filter(d => d.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/istockphoto-1379019632-612x612.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Downloads</Text>
        <Text style={styles.subtitle}>Your offline content</Text>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Download size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptyText}>
            Downloaded videos and PDFs will appear here for offline access
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.downloadCard}>
              <View style={styles.iconContainer}>
                {item.type === 'video' ? (
                  <Video size={24} color={theme.colors.primary} />
                ) : (
                  <FileText size={24} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileSize}>{item.size}</Text>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.fileDate}>{formatDate(item.downloadedAt)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.03,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  fileInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  fileName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  metaDivider: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  fileDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
