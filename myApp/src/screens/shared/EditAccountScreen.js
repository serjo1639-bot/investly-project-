/**
 * EditAccountScreen — edit the profile fields the backend accepts on
 * PUT /auth/profile (name, email, bio, companyName, location, age).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Avatar, Input, Button, toast } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { rules } from '../../utils/validation';

export default function EditAccountScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const update = useUpdateProfile();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      location: user?.location ?? '',
      bio: user?.bio ?? '',
      companyName: user?.companyName ?? '',
    },
  });

  const onSubmit = (values) =>
    update.mutate(values, {
      onSuccess: () => { toast.success('Profile updated'); navigation.goBack(); },
      onError: (e) => toast.error(e.message),
    });

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={t('account.editProfile')} showBack />
      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <Avatar uri={user?.avatarUrl} name={user?.name} size={88} />
        </View>

        <Controller control={control} name="name" rules={rules.name(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.name')} icon="person-outline" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name} />
          )} />
        <Controller control={control} name="email" rules={rules.email(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.email')} icon="mail-outline" keyboardType="email-address" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email} />
          )} />
        <Controller control={control} name="location"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.location')} icon="location-outline" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />
        {user?.role === 'owner' ? (
          <Controller control={control} name="companyName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Company" icon="business-outline" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} />
            )} />
        ) : null}
        <Controller control={control} name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Bio" icon="create-outline" multiline value={value} onChangeText={onChange} onBlur={onBlur} />
          )} />

        <Button title={t('common.save')} size="lg" loading={update.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
});
