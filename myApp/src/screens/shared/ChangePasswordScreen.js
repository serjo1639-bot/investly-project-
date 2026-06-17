/**
 * ChangePasswordScreen — change the password for a signed-in user.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Input, Button, toast } from '../../components';
import { useChangePassword } from '../../hooks/useProfile';
import { rules } from '../../utils/validation';

export default function ChangePasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const change = useChangePassword();
  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const onSubmit = ({ currentPassword, newPassword }) =>
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => { toast.success('Password changed'); navigation.goBack(); },
        onError: (e) => toast.error(e.message),
      }
    );

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={t('account.changePassword')} showBack />
      <View style={styles.body}>
        <Controller control={control} name="currentPassword" rules={rules.password(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Current password" icon="lock-closed-outline" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.currentPassword} />
          )} />
        <Controller control={control} name="newPassword" rules={rules.password(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="New password" icon="key-outline" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.newPassword} />
          )} />
        <Controller control={control} name="confirm" rules={rules.confirmPassword(t, getValues, 'newPassword')}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.confirmPassword')} icon="key-outline" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirm} />
          )} />

        <Button title={t('common.save')} size="lg" loading={change.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ body: { paddingHorizontal: 16, paddingTop: 8 } });
