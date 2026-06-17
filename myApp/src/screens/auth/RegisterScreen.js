/**
 * RegisterScreen — create an Investor or Project Manager (owner) account.
 * Collects the fields the backend RegisterRequest expects: name, email, phone,
 * password, role, age, gender, location.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AuthHero } from './AuthHero';
import { Text, Input, Button, Chip, toast } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { rules } from '../../utils/validation';
import { UserRole, Gender } from '../../constants/enums';
import { ROUTES } from '../../navigation/routes';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { register } = useAuth();

  const [role, setRole] = useState(UserRole.INVESTOR);
  const [gender, setGender] = useState(Gender.MALE);

  const { control, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', phone: '', age: '', location: '', password: '', confirm: '' },
  });

  const onSubmit = (values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password,
      role,
      gender,
      age: Number(values.age),
      location: values.location.trim(),
      termsAccepted: true,
    };
    register.mutate(payload, {
      onSuccess: (data) => {
        // If the backend returned tokens, useAuth already logged us in.
        if (!data?.accessToken && !data?.token && !data?.tokens) {
          toast.success('Account created. Please sign in.');
          navigation.replace(ROUTES.LOGIN);
        }
      },
      onError: (e) => toast.error(e.message, t('common.somethingWrong')),
    });
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false} edges={['bottom']}>
      <AuthHero title={t('auth.register')} subtitle={t('auth.welcomeSub')} />
      <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {t('auth.role')}
        </Text>
        <View style={styles.row}>
          <Chip label={t('auth.investor')} icon="trending-up-outline" selected={role === UserRole.INVESTOR} onPress={() => setRole(UserRole.INVESTOR)} />
          <Chip label={t('auth.owner')} icon="briefcase-outline" selected={role === UserRole.OWNER} onPress={() => setRole(UserRole.OWNER)} />
        </View>

        <Controller
          control={control}
          name="name"
          rules={rules.name(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.name')} icon="person-outline" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name} />
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={rules.email(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.email')} icon="mail-outline" keyboardType="email-address" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          rules={rules.phone(t)}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('auth.phone')} icon="call-outline" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone} />
          )}
        />

        <View style={styles.split}>
          <View style={styles.splitItem}>
            <Controller
              control={control}
              name="age"
              rules={rules.age(t)}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label={t('auth.age')} icon="calendar-outline" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.age} />
              )}
            />
          </View>
          <View style={styles.splitItem}>
            <Controller
              control={control}
              name="location"
              rules={rules.required(t, t('auth.location'))}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label={t('auth.location')} icon="location-outline" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.location} />
              )}
            />
          </View>
        </View>

        <Text variant="caption" color="textSecondary" style={styles.label}>
          {t('auth.gender')}
        </Text>
        <View style={styles.row}>
          <Chip label={t('auth.male')} selected={gender === Gender.MALE} onPress={() => setGender(Gender.MALE)} />
          <Chip label={t('auth.female')} selected={gender === Gender.FEMALE} onPress={() => setGender(Gender.FEMALE)} />
          <Chip label={t('auth.other')} selected={gender === Gender.OTHER} onPress={() => setGender(Gender.OTHER)} />
        </View>

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

        <Button title={t('auth.register')} onPress={handleSubmit(onSubmit)} loading={register.isPending} size="lg" style={styles.submit} />

        <View style={styles.footer}>
          <Text variant="body" color="textSecondary">{t('auth.haveAccount')} </Text>
          <Text variant="bodyStrong" style={{ color: theme.colors.primary }} onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            {t('auth.login')}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 24, marginTop: -22, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  label: { marginBottom: 8, marginLeft: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18 },
  split: { flexDirection: 'row', gap: 12 },
  splitItem: { flex: 1 },
  submit: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 12 },
});
