/**
 * ResetPasswordScreen — set a new password using the verified reset code.
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

export default function ResetPasswordScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { identifier, code } = route.params ?? {};
  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { password: '', confirm: '' },
  });

  const mutation = useMutation({
    mutationFn: (newPassword) =>
      authApi.resetPassword({ email: identifier, code, newPassword }),
  });

  const onSubmit = ({ password }) =>
    mutation.mutate(password, {
      onSuccess: () => {
        toast.success('Password updated. Please sign in.');
        navigation.reset({ index: 0, routes: [{ name: ROUTES.LOGIN }] });
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false} edges={['bottom']}>
      <AuthHero title={t('auth.resetTitle')} subtitle={t('auth.resetSub')} />
      <View style={styles.body}>
        <Text variant="body" color="textSecondary" style={styles.sub}>
          {t('auth.resetSub')}
        </Text>

        <Controller
          control={control}
          name="password"
          rules={rules.password(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.password')} icon="lock-closed-outline" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password} />
          )}
        />
        <Controller
          control={control}
          name="confirm"
          rules={rules.confirmPassword(t, getValues)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.confirmPassword')} icon="lock-closed-outline" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirm} />
          )}
        />

        <Button title={t('common.save')} onPress={handleSubmit(onSubmit)} loading={mutation.isPending} size="lg" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24 },
  sub: { marginBottom: 24, lineHeight: 23 },
});
