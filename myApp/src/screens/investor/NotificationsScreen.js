/**
 * NotificationsScreen — list of notifications with clear read/unread styling.
 *
 * Tapping any card opens the full NotificationDetailScreen, which marks it as
 * read on open (no separate action needed). A "mark all read" action lives in
 * the header. Unread rows carry a left accent bar, tinted icon and a dot.
 */
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, IconButton, Skeleton, EmptyState, ErrorState, PressableScale } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useUiStore } from '../../store/uiStore';
import { useNotifications, useMarkAllRead } from '../../hooks/useNotifications';
import { formatRelative } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

const TYPE_ICON = {
  investment: 'trending-up',
  project: 'briefcase',
  system: 'settings',
  user: 'person',
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;
  const openDrawer = useUiStore((s) => s.openDrawer);
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const markAllRead = useMarkAllRead();
  const items = Array.isArray(data) ? data : data?.items ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <IconButton icon="menu" onPress={openDrawer} style={styles.menuBtn} />
        <View style={styles.headerTitles}>
          <Text variant="h2">{t('tabs.notifications')}</Text>
          <Text variant="caption" color="textSecondary">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <IconButton
          icon="checkmark-done-outline"
          onPress={() => unreadCount > 0 && markAllRead.mutate()}
          color={unreadCount > 0 ? c.primary : c.textMuted}
        />
      </View>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const unread = !item.isRead;
            const icon = (TYPE_ICON[item.type] || 'notifications') + (unread ? '' : '-outline');
            return (
              <PressableScale
                scaleTo={0.99}
                onPress={() => navigation.navigate(ROUTES.NOTIFICATION_DETAIL, { id: item.id, notification: item })}
              >
                <View
                  style={[
                    styles.row,
                    {
                      backgroundColor: unread ? c.primarySoft : c.surface,
                      borderColor: c.border,
                      borderRadius: theme.radii.lg,
                    },
                    theme.shadows.sm,
                  ]}
                >
                  {unread ? <View style={[styles.accent, { backgroundColor: c.primary }]} /> : null}
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: unread ? c.primary : c.surfaceAlt },
                    ]}
                  >
                    <Ionicons name={icon} size={18} color={unread ? c.onPrimary : c.icon} />
                  </View>
                  <View style={styles.body}>
                    <Text
                      variant="bodyStrong"
                      numberOfLines={1}
                      color={unread ? 'text' : 'textSecondary'}
                    >
                      {item.title}
                    </Text>
                    {item.body ? (
                      <Text variant="caption" color="textSecondary" numberOfLines={2} style={styles.bodyText}>
                        {item.body}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={12} color={c.textMuted} />
                      <Text variant="tiny" color="textMuted" style={styles.time}>
                        {formatRelative(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {unread ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
                </View>
              </PressableScale>
            );
          }}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.skeletons}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height={82} radius={16} style={{ marginBottom: 12 }} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="notifications-off-outline"
                title="You're all caught up"
                message="New notifications about your investments and projects will show up here."
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  menuBtn: { marginRight: 4 },
  headerTitles: { flex: 1, marginLeft: 4 },
  content: { paddingHorizontal: 16, paddingBottom: 104, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  bodyText: { marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  time: { marginLeft: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
  skeletons: { paddingTop: 4 },
});
