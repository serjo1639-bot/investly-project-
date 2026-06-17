/**
 * SettingsScreen — appearance (theme mode) and language preferences. Both are
 * persisted via uiStore; switching language also drives i18next.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Card, Chip } from '../../components';
import { useUiStore } from '../../store/uiStore';
import { changeLanguage } from '../../i18n';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const LANGUAGES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { themeMode, setThemeMode, language, setLanguage } = useUiStore();

  const onLanguage = async (lang) => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  return (
    <ScreenContainer scroll padded={false}>
      <AppHeader title={t('account.settings')} showBack />
      <View style={styles.body}>
        <Text variant="caption" color="textSecondary" style={styles.label}>{t('account.darkMode')}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            {THEME_OPTIONS.map((o) => (
              <Chip key={o.value} label={o.label} icon={o.icon} selected={themeMode === o.value} onPress={() => setThemeMode(o.value)} />
            ))}
          </View>
        </Card>

        <Text variant="caption" color="textSecondary" style={styles.label}>{t('account.language')}</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            {LANGUAGES.map((l) => (
              <Chip key={l.value} label={l.label} selected={language === l.value} onPress={() => onLanguage(l.value)} />
            ))}
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  label: { marginBottom: 8, marginLeft: 2, marginTop: 10 },
  card: { marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
