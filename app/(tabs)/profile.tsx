import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Award, BookOpen, Clock, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';

interface ProfileStats {
  enrolledSubjects: number;
  completedTopics: number;
  totalHours: number;
  averageScore: number;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, student, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id);

      const { data: progress } = await supabase
        .from('student_progress')
        .select('completed, time_spent, quiz_score')
        .eq('student_id', user.id);

      const completedTopics = progress?.filter(p => p.completed && p.topic_id).length || 0;
      const totalHours = Math.round((progress?.reduce((acc, p) => acc + (p.time_spent || 0), 0) || 0) / 60);

      const quizScores = progress?.filter(p => p.quiz_score !== null).map(p => p.quiz_score!) || [];
      const averageScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((acc, score) => acc + score, 0) / quizScores.length)
        : 0;

      setStats({
        enrolledSubjects: enrollments?.length || 0,
        completedTopics,
        totalHours,
        averageScore,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
    }

    try {
      await signOut();
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert('Error: ' + (error.message || 'Failed to sign out'));
      }
      console.error('Sign out error:', error);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color={theme.colors.white} />
          </View>
        </View>
        <Text style={styles.name}>{student?.name || 'Student'}</Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{student?.stage || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BookOpen size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.enrolledSubjects || 0}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={24} color={theme.colors.accent2} />
            </View>
            <Text style={styles.statValue}>{stats?.completedTopics || 0}</Text>
            <Text style={styles.statLabel}>Topics Done</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={24} color={theme.colors.accent1} />
            </View>
            <Text style={styles.statValue}>{stats?.totalHours || 0}h</Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats?.averageScore || 0}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={theme.colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  name: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  stageBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  stageText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  statsContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: theme.spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  signOutText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
