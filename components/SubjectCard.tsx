import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FileText, BookOpen, Play } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Subject = Database['public']['Tables']['subjects']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface SubjectCardProps {
  subject: Subject;
  teacher?: Teacher;
  onPress: () => void;
  showEnrollButton?: boolean;
  onEnroll?: () => void;
  enrolling?: boolean;
  progress?: number;
  onContinue?: () => void;
  onViewPastPapers?: () => void;
  onViewSyllabus?: () => void;
  showActions?: boolean;
}

export function SubjectCard({
  subject,
  teacher,
  onPress,
  showEnrollButton,
  onEnroll,
  enrolling,
  progress,
  onContinue,
  onViewPastPapers,
  onViewSyllabus,
  showActions = false
}: SubjectCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{subject.name}</Text>
          {showActions && (
            <View style={styles.headerActions}>
              {onViewPastPapers && (
                <TouchableOpacity
                  style={styles.textButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onViewPastPapers();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textButtonLabel}>Past Papers</Text>
                </TouchableOpacity>
              )}
              {onViewSyllabus && subject.syllabus_url && (
                <TouchableOpacity
                  style={styles.textButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onViewSyllabus();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.textButtonLabel}>Syllabus</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {subject.school && (
          <Text style={styles.school} numberOfLines={1}>{subject.school}</Text>
        )}

        {teacher && (
          <View style={styles.teacherSection}>
            {teacher.profile_image_url ? (
              <Image
                source={{ uri: teacher.profile_image_url }}
                style={styles.teacherImage}
              />
            ) : (
              <View style={styles.teacherImagePlaceholder}>
                <Text style={styles.teacherInitial}>{teacher.name[0]}</Text>
              </View>
            )}
            <Text style={styles.teacherName} numberOfLines={1}>
              {teacher.name}
            </Text>
            <View style={[styles.badge, subject.exam_board === 'ZIMSEC' ? styles.badgeZimsec : styles.badgeCambridge]}>
              <Text style={styles.badgeText}>{subject.exam_board}</Text>
            </View>
          </View>
        )}

        {progress !== undefined && progress > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
      </TouchableOpacity>

      {showActions && onContinue && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.7}
          >
            <Play size={16} color={theme.colors.white} fill={theme.colors.white} />
            <Text style={styles.continueButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      )}

      {showEnrollButton && onEnroll && (
        <View style={styles.enrollButtonContainer}>
          <TouchableOpacity
            style={[styles.enrollButton, enrolling && styles.enrollButtonDisabled]}
            onPress={onEnroll}
            disabled={enrolling}
          >
            <Text style={styles.enrollButtonText}>
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  textButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: theme.borderRadius.sm,
  },
  textButtonLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  badgeZimsec: {
    backgroundColor: '#E0F2FE',
  },
  badgeCambridge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
  },
  school: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  enrollButtonContainer: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  enrollButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  enrollButtonDisabled: {
    opacity: 0.6,
  },
  enrollButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  teacherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  teacherImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
  },
  teacherImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  teacherInitial: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  teacherName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  actionsRow: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
});
