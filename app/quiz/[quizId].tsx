import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Question = Database['public']['Tables']['questions']['Row'];
type Option = Database['public']['Tables']['options']['Row'];

interface QuestionWithOptions extends Question {
  options: Option[];
}

export default function QuizScreen() {
  const { quizId, quizName } = useLocalSearchParams();
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId as string)
        .order('order_index');

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        Alert.alert('No Questions', 'This quiz has no questions yet');
        router.back();
        return;
      }

      const questionIds = questionsData.map(q => q.id);
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .in('question_id', questionIds);

      if (optionsError) throw optionsError;

      const optionsByQuestion = optionsData?.reduce((acc, option) => {
        if (!acc[option.question_id]) acc[option.question_id] = [];
        acc[option.question_id].push(option);
        return acc;
      }, {} as Record<string, Option[]>) || {};

      const questionsWithOptions = questionsData.map(q => ({
        ...q,
        options: optionsByQuestion[q.id] || [],
      }));

      setQuestions(questionsWithOptions);
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionId: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questions[currentIndex].id, optionId);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.size !== questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);

    try {
      let score = 0;
      questions.forEach(question => {
        const selectedOptionId = answers.get(question.id);
        const selectedOption = question.options.find(o => o.id === selectedOptionId);
        if (selectedOption?.is_correct) {
          score++;
        }
      });

      const percentage = Math.round((score / questions.length) * 100);

      if (user) {
        const { error } = await supabase
          .from('student_progress')
          .insert({
            student_id: user.id,
            quiz_id: quizId as string,
            completed: true,
            quiz_score: percentage,
          });

        if (error) throw error;
      }

      Alert.alert(
        'Quiz Complete!',
        `You scored ${score} out of ${questions.length} (${percentage}%)`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers.get(currentQuestion.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{quizName}</Text>
          <Text style={styles.subtitle}>
            Question {currentIndex + 1} of {questions.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedOption === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => handleSelectOption(option.id)}
            >
              <View
                style={[
                  styles.optionCircle,
                  selectedOption === option.id && styles.optionCircleSelected,
                ]}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option.id && styles.optionTextSelected,
                ]}
              >
                {option.option_text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigation}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {currentIndex < questions.length - 1 ? (
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Quiz</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  questionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 24,
  },
  optionsContainer: {
    padding: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.gray300,
    marginRight: theme.spacing.md,
  },
  optionCircleSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  footer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray100,
  },
  navButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  submitButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
