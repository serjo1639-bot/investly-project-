/**
 * NotificationsScreen.js — Notification inbox
 *
 * Fetches notifications via notificationsAPI.getAll().
 * Supports mark-as-read per item and mark-all-as-read.
 *
 * In mock mode: shows 3 static notifications (2 unread, 1 read).
 * In real mode: fetches from GET /notifications.
 *
 * Unread items are visually distinguished with a colored left border
 * and a dot indicator.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { notificationsAPI } from '../services/api';
import { useTopPopup } from '../hooks/useTopPopup';

// ─── Notification type meta ───────────────────────────────────────────────────
const TYPE_META = {
  investment: { icon: 'trending-up-outline',    color: COLORS.teal,    bg: COLORS.tealLight    },
  project:    { icon: 'briefcase-outline',       color: COLORS.primary, bg: COLORS.primaryLight },
  system:     { icon: 'information-circle-outline', color: COLORS.amber, bg: COLORS.amberLight  },
  default:    { icon: 'notifications-outline',   color: COLORS.textMuted, bg: COLORS.backgroundDark },
};

// ─── Relative time helper ─────────────────────────────────────────────────────
const relativeTime = (isoString, isAr) => {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)   return isAr ? 'الآن'             : 'Just now';
  if (diff < 3600) return isAr ? `${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return isAr ? `${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h ago`;
  return isAr ? `${Math.floor(diff / 86400)} يوم` : `${Math.floor(diff / 86400)}d ago`;
};

// ─── Single notification row ──────────────────────────────────────────────────
const NotifItem = ({ item, isAr, onPress }) => {
  const meta    = TYPE_META[item.type] || TYPE_META.default;
  const title   = isAr ? item.titleAr   : item.titleEn;
  const message = isAr ? item.messageAr : item.messageEn;
  const time    = relativeTime(item.createdAt, isAr);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const press = (v) =>
    Animated.spring(scaleAnim, { toValue: v, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.notifCard,
          { flexDirection: isAr ? 'row-reverse' : 'row' },
          !item.isRead && styles.notifCardUnread,
        ]}
        onPress={() => onPress(item)}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        activeOpacity={1}
      >
        {/* Icon */}
        <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        {/* Content */}
        <View style={styles.notifBody}>
          <View style={[styles.notifTitleRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.notifTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.notifTime}>{time}</Text>
          </View>
          <Text
            style={[styles.notifMsg, { textAlign: isAr ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {/* Unread dot */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ isAr }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.emptyWrap}>
      <Animated.View style={[styles.emptyIconWrap, { transform: [{ scale: pulse }] }]}>
        <Ionicons name="notifications-off-outline" size={52} color={COLORS.textLight} />
        <View style={styles.emptyBadge}>
          <Text style={styles.emptyBadgeTxt}>?</Text>
        </View>
      </Animated.View>
      <Text style={[styles.emptyTitle, { textAlign: isAr ? 'right' : 'left' }]}>
        {isAr ? 'لا يوجد شيء لعرضه' : 'Nothing to show'}
      </Text>
      <Text style={[styles.emptySub, { textAlign: 'center' }]}>
        {isAr
          ? 'ستظهر هنا إشعاراتك حول المشاريع والمساهمات'
          : 'Your project and investment notifications will appear here'}
      </Text>
    </View>
  );
};

// ─── NotificationsScreen ──────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const { i18n } = useTranslation();
  const isAr     = i18n.language === 'ar';
  const insets   = useSafeAreaInsets();
  const popup    = useTopPopup();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res?.data || []);
    } catch {
      setNotifications([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    if (!unreadCount) return;
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      popup.success(isAr ? 'تمت قراءة جميع الإشعارات' : 'All notifications marked as read');
    } catch {
      popup.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    }
    setMarkingAll(false);
  };

  const handleItemPress = useCallback(async (item) => {
    if (item.isRead) return;
    try {
      await notificationsAPI.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n)
      );
    } catch {}
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[COLORS.white, COLORS.white]}
        style={styles.header}
      >
        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAr ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={COLORS.primaryDark}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isAr ? 'الإشعارات' : 'Notifications'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeTxt}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              disabled={markingAll}
              activeOpacity={0.75}
            >
              {markingAll
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={styles.markAllTxt}>
                    {isAr ? 'قراءة الكل' : 'Mark all'}
                  </Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={{ width: 72 }} />
          )}
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTxt}>
            {isAr ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotifItem item={item} isAr={isAr} onPress={handleItemPress} />
          )}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState isAr={isAr} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerRow:   { alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  headerTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  headerBadge: {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeTxt: { fontSize: 11, fontWeight: FONTS.bold, color: COLORS.white },
  markAllBtn:  { paddingVertical: 6, paddingHorizontal: SPACING.sm },
  markAllTxt:  { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.primary },

  // ── List ─────────────────────────────────────────────────────────────────
  listContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  listEmpty:   { flex: 1, justifyContent: 'center' },
  separator:   { height: SPACING.sm },

  // ── Notification card ─────────────────────────────────────────────────────
  notifCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  notifCardUnread: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#F5F7FF',
  },
  notifIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  notifBody:     { flex: 1, gap: 4 },
  notifTitleRow: { alignItems: 'center', justifyContent: 'space-between', gap: SPACING.xs },
  notifTitle:    { flex: 1, fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  notifTime:     { fontSize: FONTS.xs, color: COLORS.textMuted, flexShrink: 0 },
  notifMsg:      { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: FONTS.sm * 1.5 },
  unreadDot: {
    position: 'absolute', top: SPACING.base, right: SPACING.base,
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: COLORS.primary,
    borderWidth: 1.5, borderColor: COLORS.white,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.base,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.amber,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.backgroundDark,
  },
  emptyBadgeTxt: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white },
  emptyTitle:    { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  emptySub:      { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: FONTS.sm * 1.6 },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.base },
  loadingTxt:  { fontSize: FONTS.sm, color: COLORS.textMuted },
});
