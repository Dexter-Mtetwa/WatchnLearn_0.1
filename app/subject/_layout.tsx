import { Stack } from 'expo-router';

export default function SubjectLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="term/[termId]" />
      <Stack.Screen name="chapter/[chapterId]" />
      <Stack.Screen name="topic/[topicId]" />
    </Stack>
  );
}
