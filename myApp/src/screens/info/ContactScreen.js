import React from 'react';
import { InfoScreenLayout } from './InfoScreenLayout';

export default function ContactScreen() {
  return (
    <InfoScreenLayout
      title="Contact us"
      intro="We'd love to hear from you. Reach our team through any of the channels below."
      sections={[
        { heading: 'Email', body: 'support@investly.ly' },
        { heading: 'Phone', body: '+218 91 000 0000 (Sun–Thu, 9am–5pm)' },
        { heading: 'Office', body: 'Tripoli, Libya' },
      ]}
    />
  );
}
