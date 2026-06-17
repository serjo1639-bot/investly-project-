import React from 'react';
import { InfoScreenLayout } from './InfoScreenLayout';

export default function PrivacyScreen() {
  return (
    <InfoScreenLayout
      title="Privacy Policy"
      intro="This summary explains how Investly handles your data. It is provided for the graduation project and is not legal advice."
      sections={[
        { heading: 'Data we collect', body: 'Account details (name, email, phone), identity documents you submit for verification, and transaction history needed to operate the service.' },
        { heading: 'How we use it', body: 'To authenticate you, process investments and payments, verify your identity, and improve the app experience.' },
        { heading: 'Data security', body: 'Authentication tokens are stored in your device’s encrypted keystore. Communication with our servers uses standard secure practices.' },
        { heading: 'Your choices', body: 'You can edit your profile or request account deletion at any time from the account section.' },
      ]}
    />
  );
}
