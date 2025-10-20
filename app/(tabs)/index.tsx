import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SubjectCard } from '@/components/SubjectCard';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Subject = Database['public']['Tables']['subjects']['Row'];
type Enrollment = Database['public']['Tables']['enrollments']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface EnrolledSubject extends Subject {
  enrollment_id: string;
  teacher?: Teacher;
  progress: number;
  last_visited_term_id: string | null;
  last_topic_id: string | null;
}

export default function MyClassesScreen() {
  const [subjects, setSubjects] = useState<EnrolledSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadEnrolledSubjects();
    }, [user])
  );

  const loadEnrolledSubjects = async () => {
    if (!user) return;

    try {
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          subjects(*, teacher:teachers(*)),
          last_visited_term_id
        `)
        .eq('student_id', user.id);

      if (enrollError) throw enrollError;

      const enrolledSubjectsWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          const progress = await calculateSubjectProgress(user.id, enrollment.subject_id);
          return {
            ...enrollment.subjects,
            enrollment_id: enrollment.id,
            teacher: enrollment.subjects?.teacher || undefined,
            progress,
            last_visited_term_id: enrollment.last_visited_term_id,
            last_topic_id: enrollment.last_topic_id,
          };
        })
      );

      setSubjects(enrolledSubjectsWithProgress);
    } catch (error) {
      console.error('Error loading enrolled subjects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateSubjectProgress = async (studentId: string, subjectId: string): Promise<number> => {
    try {
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          duration,
          chapters!inner(term_id, terms!inner(subject_id))
        `)
        .eq('chapters.terms.subject_id', subjectId);

      if (topicsError) throw topicsError;

      const totalDuration = topics?.reduce((sum, topic) => sum + (topic.duration || 0), 0) || 0;
      if (totalDuration === 0) return 0;

      const { data: completedTopics, error: progressError } = await supabase
        .from('topic_progress')
        .select('topic_id, topics(duration)')
        .eq('student_id', studentId)
        .eq('completed', true);

      if (progressError) throw progressError;

      const completedDuration = completedTopics?.reduce((sum, item: any) =>
        sum + (item.topics?.duration || 0), 0
      ) || 0;

      return completedDuration / totalDuration;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEnrolledSubjects();
  };

  const handleSubjectPress = (subject: EnrolledSubject) => {
    router.push({
      pathname: '/subject/[id]',
      params: {
        id: subject.id,
        name: subject.name,
        lastVisitedTermId: subject.last_visited_term_id || '',
        lastTopicId: subject.last_topic_id || '',
      },
    });
  };

  const handleContinue = (subject: EnrolledSubject) => {
    handleSubjectPress(subject);
  };

  const handleViewPastPapers = (subject: EnrolledSubject) => {
    router.push({
      pathname: '/past-papers/[subjectId]',
      params: {
        subjectId: subject.id,
        subjectName: subject.name,
      },
    });
  };

  const handleViewSyllabus = (subject: EnrolledSubject) => {
    if (subject.syllabus_url) {
      router.push({
        pathname: '/syllabus/view',
        params: {
          url: subject.syllabus_url,
          subjectName: subject.name,
        },
      });
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
      <LinearGradient
        colors={['rgba(240, 249, 255, 0.95)', 'rgba(224, 242, 254, 0.95)', 'rgba(255, 255, 255, 0.95)']}
        style={styles.gradientOverlay}
      >
      <View style={styles.header}>
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.subtitle}>Continue your learning journey</Text>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptyText}>
            Visit the Explore tab to browse and enroll in subjects
          </Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubjectCard
              subject={item}
              teacher={item.teacher}
              progress={item.progress}
              onPress={() => handleSubjectPress(item)}
              showActions={true}
              onContinue={() => handleContinue(item)}
              onViewPastPapers={() => handleViewPastPapers(item)}
              onViewSyllabus={() => handleViewSyllabus(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.15,
  },
  gradientOverlay: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 0,
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
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
