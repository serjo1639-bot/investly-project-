/**
 * LoginScreen — sign in by email or phone. Toggling the method swaps the
 * first field + its validation. Errors surface via toast; field errors inline.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { Logo, Text, Input, Button, Chip, HeroBackground, toast } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { rules } from '../../utils/validation';
import { ROUTES } from '../../navigation/routes';
import { IMAGES } from '../../constants/images';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { loginEmail, loginPhone } = useAuth();
  const [method, setMethod] = useState('email'); // 'email' | 'phone'

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', phone: '', password: '' },
  });

  const mutation = method === 'email' ? loginEmail : loginPhone;

  const onSubmit = (values) => {
    const payload =
      method === 'email'
        ? { email: values.email.trim(), password: values.password }
        : { phone: values.phone.trim(), password: values.password };
    mutation.mutate(payload, {
      onError: (e) => toast.error(e.message, t('common.somethingWrong')),
    });
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false} edges={['bottom']}>
      <HeroBackground image={IMAGES.authBg} height={244} contentStyle={{ paddingTop: insets.top + 8 }}>
        <StatusBar style="light" />
        <View style={styles.heroContent}>
          <View style={styles.brandRow}>
            <Logo size={42} showWordmark={false} />
            <Text variant="h2" color="textInverse" style={styles.wordmark}>Investly</Text>
          </View>
          <Text variant="display" color="textInverse" align="center" style={styles.heroTitle}>{t('auth.welcome')}</Text>
          <Text variant="body" align="center" style={styles.heroSub}>{t('auth.welcomeSub')}</Text>
        </View>
      </HeroBackground>

      <View style={[styles.sheet, { backgroundColor: theme.colors.background }]}>
        <View style={styles.toggle}>
          <Chip label={t('auth.useEmail')} icon="mail-outline" selected={method === 'email'} onPress={() => setMethod('email')} />
          <Chip label={t('auth.usePhone')} icon="call-outline" selected={method === 'phone'} onPress={() => setMethod('phone')} />
        </View>

        {method === 'email' ? (
          <Controller
            control={control}
            name="email"
            rules={rules.email(t)}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.email')}
                icon="mail-outline"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email}
              />
            )}
          />
        ) : (
          <Controller
            control={control}
            name="phone"
            rules={rules.phone(t)}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('auth.phone')}
                icon="call-outline"
                placeholder="+218 9X XXX XXXX"
                keyboardType="phone-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="password"
          rules={rules.password(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.password')}
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password}
            />
          )}
        />

        <Text
          variant="caption"
          style={[styles.forgot, { color: theme.colors.primary }]}
          onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
        >
          {t('auth.forgot')}
        </Text>

        <Button
          title={t('auth.login')}
          onPress={handleSubmit(onSubmit)}
          loading={mutation.isPending}
          size="lg"
        />

        <View style={styles.footer}>
          <Text variant="body" color="textSecondary">
            {t('auth.noAccount')}{' '}
          </Text>
          <Text
            variant="bodyStrong"
            style={{ color: theme.colors.primary }}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
          >
            {t('auth.register')}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroContent: { paddingHorizontal: 24, paddingBottom: 30, alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  wordmark: { marginLeft: 10, fontWeight: '800', letterSpacing: -0.5 },
  heroTitle: { marginBottom: 4 },
  heroSub: { color: 'rgba(255,255,255,0.85)' },
  sheet: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  toggle: { flexDirection: 'row', marginBottom: 22 },
  forgot: { alignSelf: 'flex-end', fontWeight: '700', marginBottom: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
});
