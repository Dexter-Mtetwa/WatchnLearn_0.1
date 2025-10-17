import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Download, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { downloadFile } from '@/lib/downloads';
import { theme } from '@/constants/theme';
import { Database } from '@/types/database';

type Topic = Database['public']['Tables']['topics']['Row'];

export default function TopicScreen() {
  const { topicId, topicName, termName, subjectName } = useLocalSearchParams();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const videoStartTime = useRef<number>(0);
  const hasMarkedComplete = useRef(false);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    try {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId as string)
        .single();

      if (topicError) throw topicError;
      setTopic(topicData);

      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('topic_progress')
          .select('completed')
          .eq('student_id', user.id)
          .eq('topic_id', topicId as string)
          .maybeSingle();

        if (progressError) throw progressError;
        const isCompleted = progressData?.completed || false;
        setCompleted(isCompleted);
        hasMarkedComplete.current = isCompleted;

        if (topicData.type === 'pdf' && !isCompleted) {
          await markTopicComplete();
        }
      }
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const markTopicComplete = async () => {
    if (!user || !topic || hasMarkedComplete.current) return;

    hasMarkedComplete.current = true;

    try {
      await supabase
        .from('topic_progress')
        .upsert({
          student_id: user.id,
          topic_id: topic.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      setCompleted(true);
    } catch (error) {
      console.error('Error marking topic complete:', error);
      hasMarkedComplete.current = false;
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'video_progress') {
        const currentTime = data.currentTime;
        const duration = data.duration;

        if (duration > 0) {
          const progress = currentTime / duration;
          setVideoProgress(progress);

          if (progress >= 0.95 && !hasMarkedComplete.current) {
            markTopicComplete();
          }
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleDownload = async () => {
    if (!topic?.file_url) return;

    setDownloading(true);
    try {
      await downloadFile(topic.file_url, `${topic.name}.${topic.type === 'pdf' ? 'pdf' : 'mp4'}`);
      alert('Download started! Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const renderContent = () => {
    if (!topic?.file_url) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No content available</Text>
        </View>
      );
    }

    if (topic.type === 'video') {
      const videoId = getVideoId(topic.file_url);
      if (videoId) {
        const injectedJavaScript = `
          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              events: {
                'onStateChange': onPlayerStateChange
              }
            });
          }

          function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING) {
              setInterval(function() {
                if (player && player.getCurrentTime) {
                  var currentTime = player.getCurrentTime();
                  var duration = player.getDuration();
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'video_progress',
                    currentTime: currentTime,
                    duration: duration
                  }));
                }
              }, 1000);
            }
          }

          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        `;

        return (
          <WebView
            style={styles.webview}
            source={{ uri: `https://www.youtube.com/embed/${videoId}?enablejsapi=1` }}
            allowsFullscreenVideo
            javaScriptEnabled
            onMessage={handleWebViewMessage}
            injectedJavaScript={injectedJavaScript}
          />
        );
      }
    }

    if (topic.type === 'pdf') {
      return (
        <WebView
          style={styles.webview}
          source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(topic.file_url)}&embedded=true` }}
        />
      );
    }

    return null;
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
          <Text style={styles.title} numberOfLines={2}>{topicName}</Text>
        </View>
        {completed && (
          <View style={styles.completedBadge}>
            <CheckCircle2 size={24} color={theme.colors.success} fill={theme.colors.success} />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Duration: {topic?.duration || 0} min</Text>
            {topic?.type === 'video' && videoProgress > 0 && (
              <Text style={styles.progressLabel}>
                {Math.round(videoProgress * 100)}% watched
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={handleDownload}
            disabled={downloading || !topic?.file_url}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Download size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    marginBottom: 2,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  completedBadge: {
    marginLeft: theme.spacing.sm,
  },
  contentContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  progressLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
});
