import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SubjectCard } from '@/components/SubjectCard';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Subject = Database['public']['Tables']['subjects']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface SubjectWithTeacher extends Subject {
  teacher?: Teacher;
}

export default function ExploreScreen() {
  const [subjects, setSubjects] = useState<SubjectWithTeacher[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<SubjectWithTeacher[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSubjects();
    loadEnrollments();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      const unenrolled = subjects.filter(subject => !enrolledIds.has(subject.id));
      setFilteredSubjects(unenrolled);
    } else {
      const filtered = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.school?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  }, [searchQuery, subjects, enrolledIds]);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          teacher:teachers(*)
        `)
        .order('name');

      if (error) throw error;

      const subjectsWithTeacher = (data || []).map((item: any) => ({
        ...item,
        teacher: item.teacher || undefined,
      }));

      setSubjects(subjectsWithTeacher);
      setFilteredSubjects(subjectsWithTeacher);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', user.id);

      if (error) throw error;

      const ids = new Set(data?.map(e => e.subject_id) || []);
      setEnrolledIds(ids);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }
  };

  const handleEnroll = async (subject: Subject) => {
    if (!user) return;

    setEnrollingId(subject.id);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          student_id: session.session.user.id,
          subject_id: subject.id,
        });

      if (enrollError) throw enrollError;

      const { error: requestError } = await supabase
        .from('student_enrollment_requests')
        .insert({
          student_id: session.session.user.id,
          subject_id: subject.id,
          status: 'pending',
        });

      if (requestError) throw requestError;

      setEnrolledIds(prev => new Set([...prev, subject.id]));

      if (typeof window !== 'undefined' && window.alert) {
        alert('Enrolled Successfully! Your teacher will approve your data tracking request shortly.');
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);
      if (typeof window !== 'undefined' && window.alert) {
        alert('Enrollment Failed: ' + (error.message || 'Could not enroll in subject'));
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const handleSubjectPress = (subject: Subject) => {
    if (enrolledIds.has(subject.id)) {
      router.push({
        pathname: '/subject/[id]',
        params: { id: subject.id, name: subject.name },
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
      source={require('@/assets/images/istockphoto-1379019632-612x612 copy.jpg')}
      style={styles.backgroundContainer}
      imageStyle={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(240, 249, 255, 0.95)', 'rgba(224, 242, 254, 0.95)', 'rgba(255, 255, 255, 0.95)']}
        style={styles.gradientOverlay}
      >
        <View style={styles.header}>
        <Text style={styles.title}>Explore Subjects</Text>
        <Text style={styles.subtitle}>Discover and enroll in new subjects</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects, teachers, or schools..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </View>

      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubjectCard
            subject={item}
            teacher={item.teacher}
            onPress={() => handleSubjectPress(item)}
            showEnrollButton={!enrolledIds.has(item.id)}
            onEnroll={() => handleEnroll(item)}
            enrolling={enrollingId === item.id}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundContainer: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    padding: 0,
  },
});
