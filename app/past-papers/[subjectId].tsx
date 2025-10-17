import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Download, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type PastPaper = Database['public']['Tables']['past_papers']['Row'];

export default function SubjectPastPapersScreen() {
  const { subjectId, subjectName } = useLocalSearchParams();
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPastPapers();
  }, [subjectId]);

  const loadPastPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('past_papers')
        .select('*')
        .eq('subject_id', subjectId as string)
        .order('year', { ascending: false });

      if (error) throw error;

      setPastPapers(data || []);
    } catch (error) {
      console.error('Error loading past papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paper: PastPaper) => {
    if (!paper.file_url) {
      alert('No file available for download');
      return;
    }

    try {
      const { downloadFile } = await import('@/lib/downloads');
      await downloadFile(paper.file_url, `${paper.title}.pdf`);
      alert('Download started! Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/istockphoto-1379019632-612x612.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Past Papers</Text>
          <Text style={styles.subtitle}>{subjectName}</Text>
        </View>
      </View>

      {pastPapers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No past papers available</Text>
          <Text style={styles.emptyText}>
            Past papers for this subject will appear here when available
          </Text>
        </View>
      ) : (
        <FlatList
          data={pastPapers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.paperCard}>
              <View style={styles.paperInfo}>
                <Text style={styles.paperTitle}>{item.title}</Text>
                <View style={styles.paperMeta}>
                  <Text style={styles.paperYear}>{item.year}</Text>
                  {item.exam_board && (
                    <>
                      <Text style={styles.paperDivider}>•</Text>
                      <Text style={styles.paperBoard}>{item.exam_board}</Text>
                    </>
                  )}
                  {item.paper_number && (
                    <>
                      <Text style={styles.paperDivider}>•</Text>
                      <Text style={styles.paperNumber}>Paper {item.paper_number}</Text>
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => handleDownload(item)}
                activeOpacity={0.7}
              >
                <Download size={20} color={theme.colors.primary} />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  paperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  paperInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  paperTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  paperMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paperYear: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  paperDivider: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  paperBoard: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  paperNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
