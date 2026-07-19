import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>SEU DINHEIRO, SEM COMPLICAÇÃO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Saldo do Dia
          </Text>
          <Text style={styles.description}>Descubra quanto você pode gastar hoje</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Começar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F5' },
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 32 },
  content: { flex: 1, justifyContent: 'center' },
  eyebrow: { color: '#28734F', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 16 },
  title: { color: '#17251E', fontSize: 44, fontWeight: '800', letterSpacing: -1.5, lineHeight: 52 },
  description: { color: '#526159', fontSize: 20, lineHeight: 30, marginTop: 12, maxWidth: 320 },
  button: { alignItems: 'center', backgroundColor: '#28734F', borderRadius: 16, paddingVertical: 18 },
  buttonPressed: { opacity: 0.82 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
