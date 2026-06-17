/**
 * InfoScreenLayout — shared scaffold for static content screens (About, FAQ,
 * Privacy, Terms…). Renders a header + a list of { heading, body } sections.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text } from '../../components';

export function InfoScreenLayout({ title, intro, sections = [] }) {
  return (
    <ScreenContainer scroll padded={false}>
      <AppHeader title={title} showBack />
      <View style={styles.body}>
        {intro ? <Text variant="body" color="textSecondary" style={styles.intro}>{intro}</Text> : null}
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            {s.heading ? <Text variant="h3" style={styles.heading}>{s.heading}</Text> : null}
            <Text variant="body" color="textSecondary" style={styles.text}>{s.body}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  intro: { marginBottom: 20, lineHeight: 23 },
  section: { marginBottom: 22 },
  heading: { marginBottom: 8 },
  text: { lineHeight: 23 },
});
