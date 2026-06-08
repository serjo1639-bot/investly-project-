import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const ContactScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'اتصل بنا',
        eyebrow: 'نحن هنا للمساعدة',
        heroTitle: 'يمكنك التواصل مع فريق المنصة في أي وقت',
        heroDescription:
          'إذا كان لديك استفسار عن مشروع، مساهمة، أو آلية الاستخدام، فهذه قنوات التواصل الأساسية لفريق المنصة.',
        stats: [
          { value: '24h', label: 'زمن الرد المتوقع' },
          { value: '3', label: 'قنوات تواصل' },
        ],
        sections: [
          {
            icon: 'mail-outline',
            title: 'البريد الإلكتروني',
            description: 'info@albir-platform.ly',
          },
          {
            icon: 'call-outline',
            title: 'الهاتف',
            description: '00218-91-0000000',
          },
          {
            icon: 'location-outline',
            title: 'العنوان',
            description: 'طرابلس، ليبيا',
          },
        ],
        footer: {
          title: 'ملاحظة',
          description: 'يمكن تخصيص هذه البيانات لاحقًا حسب الجهة المشغلة للمنصة أو فريق الدعم الفعلي.',
        },
      }
    : {
        title: 'Contact Us',
        eyebrow: 'We are here to help',
        heroTitle: 'Reach the platform team anytime',
        heroDescription:
          'If you have a question about a project, contribution, or platform flow, these are the main communication channels.',
        stats: [
          { value: '24h', label: 'Expected response' },
          { value: '3', label: 'Contact channels' },
        ],
        sections: [
          {
            icon: 'mail-outline',
            title: 'Email',
            description: 'info@albir-platform.ly',
          },
          {
            icon: 'call-outline',
            title: 'Phone',
            description: '00218-91-0000000',
          },
          {
            icon: 'location-outline',
            title: 'Address',
            description: 'Tripoli, Libya',
          },
        ],
        footer: {
          title: 'Note',
          description: 'These details can be updated later to match the organization operating the platform.',
        },
      };

  return (
    <InfoScreenLayout
      navigation={navigation}
      isAr={isAr}
      title={content.title}
      eyebrow={content.eyebrow}
      heroTitle={content.heroTitle}
      heroDescription={content.heroDescription}
      heroIcon="call-outline"
      stats={content.stats}
      sections={content.sections}
      footer={content.footer}
    />
  );
};

export default ContactScreen;
