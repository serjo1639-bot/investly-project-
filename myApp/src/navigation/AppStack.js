/**
 * AppStack — the authenticated app: the bottom tabs plus every pushable detail
 * / form / info screen. Screens render their own AppHeader, so native headers
 * are disabled here.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from './routes';
import { MainTabs } from './MainTabs';

import ProjectDetailScreen from '../screens/investor/ProjectDetailScreen';
import CheckoutScreen from '../screens/investor/CheckoutScreen';
import TopupScreen from '../screens/investor/TopupScreen';
import WithdrawScreen from '../screens/investor/WithdrawScreen';
import PaymentsScreen from '../screens/investor/PaymentsScreen';
import MyInvestmentsScreen from '../screens/investor/MyInvestmentsScreen';
import NotificationsScreen from '../screens/investor/NotificationsScreen';
import NotificationDetailScreen from '../screens/investor/NotificationDetailScreen';

import EditAccountScreen from '../screens/shared/EditAccountScreen';
import KycScreen from '../screens/shared/KycScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

import CreateProjectScreen from '../screens/owner/CreateProjectScreen';
import ProjectStatsScreen from '../screens/owner/ProjectStatsScreen';

import AboutScreen from '../screens/info/AboutScreen';
import ContactScreen from '../screens/info/ContactScreen';
import FaqScreen from '../screens/info/FaqScreen';
import PrivacyScreen from '../screens/info/PrivacyScreen';
import TermsScreen from '../screens/info/TermsScreen';

const Stack = createNativeStackNavigator();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />

      <Stack.Screen name={ROUTES.PROJECT_DETAIL} component={ProjectDetailScreen} />
      <Stack.Screen name={ROUTES.CHECKOUT} component={CheckoutScreen} />
      <Stack.Screen name={ROUTES.TOPUP} component={TopupScreen} />
      <Stack.Screen name={ROUTES.WITHDRAW} component={WithdrawScreen} />
      <Stack.Screen name={ROUTES.PAYMENTS} component={PaymentsScreen} />
      <Stack.Screen name={ROUTES.MY_INVESTMENTS} component={MyInvestmentsScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATION_DETAIL} component={NotificationDetailScreen} />

      <Stack.Screen name={ROUTES.EDIT_ACCOUNT} component={EditAccountScreen} />
      <Stack.Screen name={ROUTES.KYC} component={KycScreen} />
      <Stack.Screen name={ROUTES.CHANGE_PASSWORD} component={ChangePasswordScreen} />
      <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />

      <Stack.Screen name={ROUTES.CREATE_PROJECT} component={CreateProjectScreen} />
      <Stack.Screen name={ROUTES.PROJECT_STATS} component={ProjectStatsScreen} />

      <Stack.Screen name={ROUTES.ABOUT} component={AboutScreen} />
      <Stack.Screen name={ROUTES.CONTACT} component={ContactScreen} />
      <Stack.Screen name={ROUTES.FAQ} component={FaqScreen} />
      <Stack.Screen name={ROUTES.PRIVACY} component={PrivacyScreen} />
      <Stack.Screen name={ROUTES.TERMS} component={TermsScreen} />
    </Stack.Navigator>
  );
}
