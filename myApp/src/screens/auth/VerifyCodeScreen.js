/**
 * VerifyCodeScreen — enter the 6-digit code sent for password reset (or OTP).
 * Renders a segmented code input that mirrors a hidden TextInput.
 */
import React, { useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AuthHero } from './AuthHero';
import { Text, Button, toast } from '../../components';
import { authApi } from '../../api/authApi';
import { useTheme } from '../../hooks/useTheme';
import { ROUTES } from '../../navigation/routes';

const LENGTH = 6;

export default function VerifyCodeScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { identifier } = route.params ?? {};
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  const verify = useMutation({
    mutationFn: () => authApi.verifyResetCode({ email: identifier, code }),
  });
  const resend = useMutation({ mutationFn: () => authApi.forgotPassword({ email: identifier }) });

  const onSubmit = () => {
    if (code.length < LENGTH) return toast.error(`Enter the ${LENGTH}-digit code`);
    verify.mutate(undefined, {
      onSuccess: () => navigation.navigate(ROUTES.RESET_PASSWORD, { identifier, code }),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false} edges={['bottom']}>
      <AuthHero title={t('auth.verifyTitle')} subtitle={t('auth.verifySub')} />
      <View style={styles.body}>
        {identifier ? (
          <Text variant="bodyStrong" color="text" style={styles.sub}>{identifier}</Text>
        ) : null}

        <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: LENGTH }).map((_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    borderColor: active ? theme.colors.primary : theme.colors.inputBorder,
                    backgroundColor: theme.colors.inputBg,
                    borderRadius: theme.radii.md,
                  },
                ]}
              >
                <Text variant="h2">{filled ? code[i] : ''}</Text>
              </View>
            );
          })}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, LENGTH))}
          keyboardType="number-pad"
          maxLength={LENGTH}
          autoFocus
          style={styles.hidden}
        />

        <Button title={t('common.confirm')} onPress={onSubmit} loading={verify.isPending} size="lg" />

        <Text
          variant="caption"
          align="center"
          style={[styles.resend, { color: theme.colors.primary }]}
          onPress={() => resend.mutate(undefined, { onSuccess: () => toast.info('Code resent') })}
        >
          {t('auth.resend')}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24 },
  sub: { marginBottom: 28 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  box: { width: 48, height: 58, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  resend: { marginTop: 18, fontWeight: '700' },
});
