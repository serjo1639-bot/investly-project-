/**
 * NotificationDetailScreen — full view of a single notification.
 *
 * Reached by tapping any notification in the list. It shows the complete
 * record (title, message, date/time, type and — when the backend provides
 * them — sender and a related action), and marks the notification as read on
 * open so no separate action is needed.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Card, Badge, Button, Divider, toast } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useMarkRead } from '../../hooks/useNotifications';
import { queryKeys } from '../../constants/queryKeys';
import { formatDateTime, formatRelative } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

const TYPE_META = {
  investment: { icon: 'trending-up', tone: 'success', label: 'Investment' },
  project: { icon: 'briefcase', tone: 'info', label: 'Project' },
  system: { icon: 'settings', tone: 'neutral', label: 'System' },
  user: { icon: 'person', tone: 'info', label: 'Account' },
};

export default function NotificationDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;
  const markRead = useMarkRead();
  const qc = useQueryClient();

  const { id, notification } = route.params ?? {};
  // Prefer the item passed from the list; fall back to the cached list by id.
  const cached = qc.getQueryData(queryKeys.notifications.all);
  const fromCache = Array.isArray(cached) ? cached.find((n) => n.id === id) : null;
  const item = notification ?? fromCache ?? {};

  // Auto-mark as read on open (only if currently unread).
  useEffect(() => {
    if (item?.id && !item.isRead) markRead.mutate(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const meta = TYPE_META[item.type] ?? { icon: 'notifications', tone: 'neutral', label: 'Notification' };

  const openProject = () => navigation.navigate(ROUTES.PROJECT_DETAIL, { id: item.projectId });
  const openLink = async () => {
    try {
      const ok = await Linking.canOpenURL(item.link);
      if (ok) return Linking.openURL(item.link);
      toast.error("This link can't be opened");
    } catch {
      toast.error("This link can't be opened");
    }
  };

  return (
    <ScreenContainer scroll padded={false}>
      <AppHeader title={t('tabs.notifications')} showBack />
      <View style={styles.body}>
        <Card style={styles.card}>
          <View style={styles.head}>
            <View style={[styles.icon, { backgroundColor: c.primarySoft }]}>
              <Ionicons name={meta.icon} size={26} color={c.primary} />
            </View>
            <Badge tone={meta.tone} label={meta.label} />
          </View>

          <Text variant="h2" style={styles.title}>{item.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={c.textMuted} />
            <Text variant="caption" color="textSecondary" style={styles.metaText}>
              {formatDateTime(item.createdAt)}
              {item.createdAt ? `  ·  ${formatRelative(item.createdAt)}` : ''}
            </Text>
          </View>

          {item.sender ? (
            <View style={styles.metaRow}>
              <Ionicons name="person-circle-outline" size={15} color={c.textMuted} />
              <Text variant="caption" color="textSecondary" style={styles.metaText}>
                {item.sender}
              </Text>
            </View>
          ) : null}

          {item.body ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="body" color="textSecondary" style={styles.message}>
                {item.body}
              </Text>
            </>
          ) : null}
        </Card>

        {item.projectId ? (
          <Button title={t('project.details')} icon="open-outline" iconRight onPress={openProject} style={styles.action} />
        ) : null}
        {item.link ? (
          <Button title="Open link" icon="link-outline" variant="outline" onPress={openLink} style={styles.action} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  card: { marginBottom: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  icon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { marginLeft: 6 },
  divider: { marginVertical: 16 },
  message: { lineHeight: 24 },
  action: { marginBottom: 12 },
});
