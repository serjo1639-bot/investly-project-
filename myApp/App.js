import { StyleSheet, Text, TextInput, View, StatusBar } from 'react-native';
import { COLORS } from './constants/theme';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from './i18n';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { TopPopupProvider } from './hooks/useTopPopup';
import AppNavigator from './Component/AppNavigator';

// Prevent text from growing disproportionately when the user increases system font size
Text.defaultProps = { ...(Text.defaultProps ?? {}), maxFontSizeMultiplier: 1.2 };
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), maxFontSizeMultiplier: 1.15 };

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <TopPopupProvider>
              <View style={styles.container}>
                <AppNavigator />
                <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
              </View>
            </TopPopupProvider>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
