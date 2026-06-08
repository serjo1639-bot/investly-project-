import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const AboutScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'عن المنصة',
        eyebrow: 'منصة استثمار رقمية',
        heroTitle: 'نربط بين الفرص والمساهمين بطريقة أوضح وأسرع',
        heroDescription:
          'توفر Investly مساحة منظمة لعرض المشاريع، متابعة التمويل، واستكشاف الفرص الاستثمارية ضمن تجربة مبسطة وواضحة تساعد المستخدم على اتخاذ قرار مدروس.',
        stats: [
          { value: '24/7', label: 'وصول دائم' },
          { value: 'شفاف', label: 'عرض البيانات' },
        ],
        sections: [
          {
            icon: 'grid-outline',
            title: 'لوحة مشاريع مرتبة',
            description: 'عرض واضح للمشاريع مع تفاصيل التمويل، المدة، والفئة لتسهيل المقارنة والوصول السريع للفرصة المناسبة.',
          },
          {
            icon: 'shield-checkmark-outline',
            title: 'تجربة موثوقة',
            description: 'نهتم بإظهار المعلومات الأساسية للمستخدم بشكل شفاف مع واجهات سهلة تقلل التعقيد أثناء التصفح أو المساهمة.',
          },
          {
            icon: 'pulse-outline',
            title: 'متابعة مستمرة',
            description: 'يمكن للمستخدم الانتقال بين الحساب والمشاريع والسلة والتفاصيل من خلال تنقل واضح ومتناسق داخل التطبيق.',
          },
        ],
        footer: {
          title: 'رؤيتنا',
          description: 'بناء منصة استثمار محلية حديثة تجعل الوصول إلى المشاريع أسهل، وتمنح المستخدم صورة مباشرة عن مساهماته ونشاطه داخل المنصة.',
        },
      }
    : {
        title: 'About Platform',
        eyebrow: 'Digital investment platform',
        heroTitle: 'We connect opportunities and contributors in a clearer way',
        heroDescription:
          'Investly offers an organized space to showcase projects, track funding, and explore investment opportunities through a simple and guided experience.',
        stats: [
          { value: '24/7', label: 'Always available' },
          { value: 'Clear', label: 'Data visibility' },
        ],
        sections: [
          {
            icon: 'grid-outline',
            title: 'Curated project browsing',
            description: 'Projects are presented with funding, duration, and category details so users can compare opportunities quickly.',
          },
          {
            icon: 'shield-checkmark-outline',
            title: 'Reliable experience',
            description: 'The interface focuses on clarity and trust, helping users understand what they are viewing before taking action.',
          },
          {
            icon: 'pulse-outline',
            title: 'Continuous follow-up',
            description: 'Users can move smoothly between account, projects, cart, and detail pages through a consistent navigation flow.',
          },
        ],
        footer: {
          title: 'Our vision',
          description: 'Build a modern local investment platform that makes project discovery easier and gives users a direct view of their activity.',
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
      heroIcon="planet-outline"
      stats={content.stats}
      sections={content.sections}
      footer={content.footer}
    />
  );
};

export default AboutScreen;
