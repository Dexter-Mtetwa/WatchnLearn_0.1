import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Video, FileText, CircleCheck as CheckCircle, Circle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Topic = Database['public']['Tables']['topics']['Row'];

interface TopicWithProgress extends Topic {
  completed: boolean;
}

export default function ChapterScreen() {
  const { chapterId, chapterName, termName, subjectName } = useLocalSearchParams();
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadTopics();
  }, [chapterId]);

  const loadTopics = async () => {
    try {
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .eq('chapter_id', chapterId as string)
        .order('order_index');

      if (topicsError) throw topicsError;

      if (!user || !topicsData) {
        setTopics(topicsData?.map(t => ({ ...t, completed: false })) || []);
        setLoading(false);
        return;
      }

      const topicIds = topicsData.map(t => t.id);
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('topic_id, completed')
        .eq('student_id', user.id)
        .in('topic_id', topicIds);

      if (progressError) throw progressError;

      const progressMap = new Map(
        progressData?.map(p => [p.topic_id, p.completed]) || []
      );

      const topicsWithProgress = topicsData.map(topic => ({
        ...topic,
        completed: progressMap.get(topic.id) || false,
      }));

      setTopics(topicsWithProgress);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: TopicWithProgress) => {
    router.push({
      pathname: '/subject/topic/[topicId]',
      params: {
        topicId: topic.id,
        topicName: topic.name,
        topicType: topic.type,
        fileUrl: topic.file_url || '',
        duration: topic.duration,
        chapterId: chapterId as string,
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.subtitle}>{subjectName} • {termName}</Text>
          <Text style={styles.title}>{chapterName}</Text>
        </View>
      </View>

      {topics.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No topics available</Text>
          <Text style={styles.emptyText}>
            This chapter doesn't have any topics yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.topicCard}
              onPress={() => handleTopicPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.topicIcon}>
                {item.type === 'video' ? (
                  <Video size={20} color={theme.colors.primary} />
                ) : (
                  <FileText size={20} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.topicContent}>
                <Text style={styles.topicName}>{item.name}</Text>
                <Text style={styles.topicDuration}>{item.duration} min</Text>
              </View>
              {item.completed ? (
                <CheckCircle size={24} color={theme.colors.success} />
              ) : (
                <Circle size={24} color={theme.colors.gray300} />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
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
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  topicDuration: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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
