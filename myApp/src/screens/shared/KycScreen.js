/**
 * KycScreen — identity verification. Pick a passport/ID image, upload it via
 * the media endpoint, then submit the returned URL to the user's KYC endpoint.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Button, Card, Badge, PressableScale, toast } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { mediaApi } from '../../api/mediaApi';
import { usersApi } from '../../api/usersApi';
import { KycStatus } from '../../constants/enums';

export default function KycScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, setUser } = useAuth();
  const [asset, setAsset] = useState(null);

  const submit = useMutation({
    mutationFn: async () => {
      const uploaded = await mediaApi.upload(asset);
      const passportUrl = uploaded?.url ?? uploaded?.path ?? uploaded;
      return usersApi.submitKyc(user.id, { passportUrl });
    },
  });

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Permission to access photos is required');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setAsset(result.assets[0]);
  };

  const onSubmit = () => {
    if (!asset) return toast.error('Please select your document image first');
    submit.mutate(undefined, {
      onSuccess: () => {
        toast.success('Documents submitted for review');
        setUser({ ...user, kycStatus: KycStatus.PENDING });
        navigation.goBack();
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const verified = user?.kycStatus === KycStatus.APPROVED;

  return (
    <ScreenContainer scroll padded={false}>
      <AppHeader title={t('account.kyc')} showBack />
      <View style={styles.body}>
        {user?.kycStatus && user.kycStatus !== KycStatus.NONE ? (
          <Card style={styles.statusCard}>
            <Ionicons
              name={verified ? 'shield-checkmark' : 'time-outline'}
              size={28}
              color={verified ? theme.colors.success.fg : theme.colors.warning.fg}
            />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text variant="bodyStrong">Verification status</Text>
              <Text variant="caption" color="textSecondary">
                {verified ? 'Your identity is verified.' : 'Your documents are under review.'}
              </Text>
            </View>
            <Badge status={user.kycStatus} />
          </Card>
        ) : null}

        {!verified ? (
          <>
            <Text variant="body" color="textSecondary" style={styles.sub}>
              Upload a clear photo of your passport or national ID to verify your identity.
            </Text>

            <PressableScale onPress={pickImage} scaleTo={0.98}>
              <View style={[styles.dropzone, { borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surfaceAlt }]}>
                {asset ? (
                  <Image source={{ uri: asset.uri }} style={styles.preview} contentFit="cover" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={36} color={theme.colors.primary} />
                    <Text variant="bodyStrong" style={{ marginTop: 10 }}>Tap to upload</Text>
                    <Text variant="caption" color="textMuted">JPG or PNG, up to 5MB</Text>
                  </>
                )}
              </View>
            </PressableScale>

            <Button title={t('common.submit')} size="lg" loading={submit.isPending} onPress={onSubmit} style={styles.submit} />
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  statusCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sub: { marginBottom: 20 },
  dropzone: { height: 220, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  submit: { marginTop: 22 },
});
