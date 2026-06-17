import React from 'react';
import { InfoScreenLayout } from './InfoScreenLayout';

export default function FaqScreen() {
  return (
    <InfoScreenLayout
      title="Help & FAQ"
      intro="Answers to the questions we hear most often."
      sections={[
        { heading: 'How do I invest in a project?', body: 'Open a project, tap “Invest now”, choose an amount and a payment method, then confirm. The amount is deducted from your wallet or charged to your card.' },
        { heading: 'How do I add money to my wallet?', body: 'Go to the Wallet tab and tap “Top up”. You can add a custom amount or redeem a prepaid code.' },
        { heading: 'What is identity verification (KYC)?', body: 'To keep the platform secure, we ask you to upload a government ID. Verification usually completes within a short review period.' },
        { heading: 'How do I become a Project Manager?', body: 'Select “Project Manager” when you register. You can then create and manage funding campaigns from your dashboard.' },
      ]}
    />
  );
}
