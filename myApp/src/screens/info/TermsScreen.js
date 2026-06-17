import React from 'react';
import { InfoScreenLayout } from './InfoScreenLayout';

export default function TermsScreen() {
  return (
    <InfoScreenLayout
      title="Terms of Service"
      intro="By using Investly you agree to these terms. This summary is provided for the graduation project and is not legal advice."
      sections={[
        { heading: 'Eligibility', body: 'You must be at least 18 years old and provide accurate information when creating an account.' },
        { heading: 'Investments', body: 'All investments carry risk. Investly does not guarantee returns. Review each project carefully before investing.' },
        { heading: 'Account responsibility', body: 'You are responsible for keeping your credentials secure and for all activity under your account.' },
        { heading: 'Acceptable use', body: 'Do not misuse the platform, attempt to access other users’ data, or upload fraudulent documents.' },
      ]}
    />
  );
}
