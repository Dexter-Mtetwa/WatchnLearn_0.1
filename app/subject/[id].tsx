import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronRight, CirclePlay as PlayCircle, FileText, CheckCircle2, Download } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Chapter = Database['public']['Tables']['chapters']['Row'];
type Topic = Database['public']['Tables']['topics']['Row'];
type Term = Database['public']['Tables']['terms']['Row'];

interface ChapterWithTopics extends Chapter {
  topics: Topic[];
  expanded: boolean;
}

interface TopicProgress {
  [topicId: string]: boolean;
}

export default function SubjectChaptersScreen() {
  const { id, name, lastVisitedTermId, lastTopicId } = useLocalSearchParams();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ChapterWithTopics[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const topicRefs = useRef<{ [key: string]: View | null }>({});

  useEffect(() => {
    loadTerms();
  }, [id]);

  useEffect(() => {
    if (selectedTermId) {
      loadChaptersAndTopics();
    }
  }, [selectedTermId]);

  useEffect(() => {
    if (lastTopicId && chapters.length > 0 && !loading) {
      setTimeout(() => {
        const topicElement = topicRefs.current[lastTopicId as string];
        if (topicElement) {
          topicElement.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
            },
            () => {}
          );
        }
      }, 500);
    }
  }, [lastTopicId, chapters, loading]);

  const loadTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .eq('subject_id', id as string)
        .order('created_at');

      if (error) throw error;

      setTerms(data || []);

      const termIdToSelect = (lastVisitedTermId as string) || data?.[0]?.id;
      if (termIdToSelect) {
        setSelectedTermId(termIdToSelect);
      }
    } catch (error) {
      console.error('Error loading terms:', error);
    }
  };

  const loadChaptersAndTopics = async () => {
    if (!selectedTermId) return;

    try {
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('term_id', selectedTermId)
        .order('order_index');

      if (chaptersError) throw chaptersError;

      const chaptersWithTopics = await Promise.all(
        (chaptersData || []).map(async (chapter) => {
          const { data: topicsData, error: topicsError } = await supabase
            .from('topics')
            .select('*')
            .eq('chapter_id', chapter.id)
            .order('order_index');

          if (topicsError) throw topicsError;

          return {
            ...chapter,
            topics: topicsData || [],
            expanded: true,
          };
        })
      );

      setChapters(chaptersWithTopics);

      if (user) {
        await loadTopicProgress(chaptersWithTopics);
      }
    } catch (error) {
      console.error('Error loading chapters and topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopicProgress = async (chaptersWithTopics: ChapterWithTopics[]) => {
    if (!user) return;

    const allTopicIds = chaptersWithTopics.flatMap(c => c.topics.map(t => t.id));

    const { data, error } = await supabase
      .from('topic_progress')
      .select('topic_id, completed')
      .eq('student_id', user.id)
      .in('topic_id', allTopicIds);

    if (error) {
      console.error('Error loading topic progress:', error);
      return;
    }

    const progressMap: TopicProgress = {};
    data?.forEach(item => {
      progressMap[item.topic_id] = item.completed;
    });

    setTopicProgress(progressMap);
    calculateProgress(chaptersWithTopics, progressMap);
  };

  const calculateProgress = (chaptersWithTopics: ChapterWithTopics[], progressMap: TopicProgress) => {
    const allTopics = chaptersWithTopics.flatMap(c => c.topics);
    const totalDuration = allTopics.reduce((sum, topic) => sum + (topic.duration || 0), 0);

    if (totalDuration === 0) {
      setProgress(0);
      return;
    }

    const completedDuration = allTopics
      .filter(topic => progressMap[topic.id])
      .reduce((sum, topic) => sum + (topic.duration || 0), 0);

    setProgress(completedDuration / totalDuration);
  };

  const toggleChapter = (chapterId: string) => {
    setChapters(prev =>
      prev.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, expanded: !chapter.expanded }
          : chapter
      )
    );
  };

  const handleDownload = async (topic: Topic) => {
    if (!topic.file_url) {
      alert('No file available for download');
      return;
    }

    try {
      const { downloadFile } = await import('@/lib/downloads');
      await downloadFile(topic.file_url, `${topic.name}.${topic.type === 'pdf' ? 'pdf' : 'mp4'}`);
      alert('Download started! Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleTopicPress = (topic: Topic) => {
    router.push({
      pathname: '/subject/topic/[topicId]',
      params: {
        topicId: topic.id,
        topicName: topic.name,
        termName: terms.find(t => t.id === selectedTermId)?.name || 'Term',
        subjectName: name as string,
      },
    });
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
          <Text style={styles.title}>{name}</Text>
        </View>
      </View>

      <View style={styles.termsScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.termsScrollContent}
        >
          {terms.map((term) => (
            <TouchableOpacity
              key={term.id}
              style={[
                styles.termChip,
                selectedTermId === term.id && styles.termChipActive
              ]}
              onPress={() => setSelectedTermId(term.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.termChipText,
                selectedTermId === term.id && styles.termChipTextActive
              ]}>
                {term.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Term Progress</Text>
          <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      </View>

      {chapters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No chapters available</Text>
          <Text style={styles.emptyText}>
            This term doesn't have any chapters yet
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.listContent}
        >
          {chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterContainer}>
              <TouchableOpacity
                style={styles.chapterHeader}
                onPress={() => toggleChapter(chapter.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.chapterName}>
                  {chapter.order_index + 1}. {chapter.name}
                </Text>
                {chapter.expanded ? (
                  <ChevronDown size={20} color={theme.colors.text} />
                ) : (
                  <ChevronRight size={20} color={theme.colors.text} />
                )}
              </TouchableOpacity>

              {chapter.expanded && (
                <View style={styles.topicsContainer}>
                  {chapter.topics.map((topic) => {
                    const isCompleted = topicProgress[topic.id] || false;
                    return (
                      <View
                        key={topic.id}
                        ref={(ref) => { topicRefs.current[topic.id] = ref; }}
                        collapsable={false}
                      >
                        <View style={styles.topicRow}>
                          <TouchableOpacity
                            style={styles.topicContent}
                            onPress={() => handleTopicPress(topic)}
                            activeOpacity={0.7}
                          >
                            {topic.type === 'video' ? (
                              <PlayCircle size={18} color={theme.colors.primary} style={styles.topicIcon} />
                            ) : (
                              <FileText size={18} color={theme.colors.primary} style={styles.topicIcon} />
                            )}
                            <View style={styles.topicInfo}>
                              <Text style={[styles.topicName, isCompleted && styles.topicNameCompleted]}>
                                {topic.name}
                              </Text>
                              <Text style={styles.topicDuration}>{topic.duration} min</Text>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.topicActions}>
                            <TouchableOpacity
                              onPress={() => handleDownload(topic)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.actionButton}
                            >
                              <Download size={18} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                            {isCompleted && (
                              <CheckCircle2 size={20} color="#10B981" fill="#10B981" style={styles.checkIcon} />
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
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
  termsScrollContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  termsScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  termChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  termChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  termChipTextActive: {
    color: theme.colors.white,
  },
  progressSection: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressPercentage: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  chapterContainer: {
    marginBottom: theme.spacing.xl,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chapterName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  topicsContainer: {
    marginLeft: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topicContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  topicIcon: {
    marginRight: theme.spacing.sm,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  topicNameCompleted: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  topicDuration: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  topicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  checkIcon: {
    marginLeft: theme.spacing.xs,
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
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
