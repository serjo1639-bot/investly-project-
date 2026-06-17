/**
 * ForgotPasswordScreen — request a reset code by email, then continue to the
 * code-verification step.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AuthHero } from './AuthHero';
import { Text, Input, Button, toast } from '../../components';
import { authApi } from '../../api/authApi';
import { rules } from '../../utils/validation';
import { ROUTES } from '../../navigation/routes';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } });

  const mutation = useMutation({
    mutationFn: (email) => authApi.forgotPassword({ email }),
  });

  const onSubmit = ({ email }) => {
    const identifier = email.trim();
    mutation.mutate(identifier, {
      onSuccess: () => {
        toast.info('We sent a verification code to your email.');
        navigation.navigate(ROUTES.VERIFY_CODE, { identifier, purpose: 'reset' });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false} edges={['bottom']}>
      <AuthHero title={t('auth.resetTitle')} subtitle={t('account.changePassword')} />
      <View style={styles.body}>
        <Text variant="body" color="textSecondary" style={styles.sub}>
          Enter the email linked to your account and we'll send a code to reset your password.
        </Text>

        <Controller
          control={control}
          name="email"
          rules={rules.email(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.email')} icon="mail-outline" keyboardType="email-address" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email} />
          )}
        />

        <Button title={t('common.next')} onPress={handleSubmit(onSubmit)} loading={mutation.isPending} size="lg" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24 },
  sub: { marginBottom: 24, lineHeight: 23 },
});
