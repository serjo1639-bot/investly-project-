/**
 * CreateProjectScreen — create (or edit) a funding project. Uploads an optional
 * cover image, then saves via useSaveProject. Doubles as the edit screen when
 * a `project` route param is supplied.
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Input, Button, Chip, PressableScale, toast } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useSaveProject, useCategories } from '../../hooks/useProjects';
import { mediaApi } from '../../api/mediaApi';
import { rules } from '../../utils/validation';

export default function CreateProjectScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const editing = route.params?.project;
  const save = useSaveProject();
  const categories = useCategories();
  const categoryItems = Array.isArray(categories.data) ? categories.data : categories.data?.items ?? [];

  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? null);
  const [cover, setCover] = useState(editing?.coverUrl ? { uri: editing.coverUrl, remote: true } : null);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: editing?.title ?? '',
      summary: editing?.summary ?? '',
      description: editing?.description ?? '',
      goalAmount: editing?.goalAmount ? String(editing.goalAmount) : '',
      minInvestment: editing?.minInvestment ? String(editing.minInvestment) : '',
    },
  });

  const pickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast.error('Permission to access photos is required');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, aspect: [16, 9] });
    if (!result.canceled) setCover(result.assets[0]);
  };

  const onSubmit = async (values) => {
    if (!categoryId) return toast.error('Please choose a category');
    try {
      let coverUrl = editing?.coverUrl;
      if (cover && !cover.remote) {
        setUploading(true);
        const uploaded = await mediaApi.upload(cover);
        coverUrl = uploaded?.url ?? uploaded?.path ?? uploaded;
        setUploading(false);
      }
      const payload = {
        title: values.title.trim(),
        summary: values.summary.trim(),
        description: values.description.trim(),
        goalAmount: Number(values.goalAmount),
        minInvestment: Number(values.minInvestment) || undefined,
        categoryId,
        coverUrl,
      };
      save.mutate(
        { id: editing?.id, payload },
        {
          onSuccess: () => { toast.success(editing ? 'Project updated' : 'Project created'); navigation.goBack(); },
          onError: (e) => toast.error(e.message),
        }
      );
    } catch (e) {
      setUploading(false);
      toast.error(e.message || 'Upload failed');
    }
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={editing ? 'Edit project' : t('owner.newProject')} showBack />
      <View style={styles.body}>
        <PressableScale onPress={pickCover} scaleTo={0.98}>
          <View style={[styles.cover, { borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surfaceAlt }]}>
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.coverImg} contentFit="cover" />
            ) : (
              <>
                <Ionicons name="image-outline" size={30} color={theme.colors.primary} />
                <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>Add cover image</Text>
              </>
            )}
          </View>
        </PressableScale>

        <Controller control={control} name="title" rules={rules.required(t, 'Title')}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Title" icon="text-outline" autoCapitalize="sentences" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title} />
          )} />
        <Controller control={control} name="summary" rules={rules.required(t, 'Summary')}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="Short summary" icon="reader-outline" autoCapitalize="sentences" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.summary} />
          )} />

        <Text variant="caption" color="textSecondary" style={styles.label}>{t('home.categories')}</Text>
        <View style={styles.chips}>
          {categoryItems.map((c) => (
            <Chip key={c.id ?? c.name} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>

        <View style={styles.split}>
          <View style={styles.splitItem}>
            <Controller control={control} name="goalAmount" rules={rules.positiveAmount(t, { min: 1 })}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label={t('project.goal')} icon="flag-outline" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.goalAmount} />
              )} />
          </View>
          <View style={styles.splitItem}>
            <Controller control={control} name="minInvestment"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input label={t('project.minInvestment')} icon="cash-outline" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              )} />
          </View>
        </View>

        <Controller control={control} name="description" rules={rules.required(t, 'Description')}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label={t('project.about')} icon="document-text-outline" multiline autoCapitalize="sentences" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.description} />
          )} />

        <Button title={t('common.save')} size="lg" loading={save.isPending || uploading} onPress={handleSubmit(onSubmit)} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  cover: { height: 160, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20 },
  coverImg: { width: '100%', height: '100%' },
  label: { marginBottom: 8, marginLeft: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  split: { flexDirection: 'row', gap: 12 },
  splitItem: { flex: 1 },
});
