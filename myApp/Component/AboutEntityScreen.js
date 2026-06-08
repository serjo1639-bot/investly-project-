import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const AboutEntityScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'عن الجهة',
        eyebrow: 'الجهة المشغلة',
        heroTitle: 'هوية الجهة التي تقف خلف المنصة',
        heroDescription:
          'هذه الصفحة مخصصة للتعريف بالجهة أو الفريق المسؤول عن تشغيل المنصة، ورسالتها، وطبيعة دورها في إدارة التجربة ومتابعة المحتوى.',
        stats: [
          { value: 'تشغيلي', label: 'نوع الدور' },
          { value: 'محلي', label: 'نطاق العمل' },
        ],
        sections: [
          {
            icon: 'business-outline',
            title: 'من نحن',
            description: 'جهة تعمل على تنظيم عرض المشاريع وتقديم واجهة رقمية تساعد المستخدم على الوصول للمعلومات بشكل أوضح وأسهل.',
          },
          {
            icon: 'eye-outline',
            title: 'مهمتنا',
            description: 'تطوير تجربة استثمارية منظمة تدعم عرض المبادرات والمشاريع وتسهّل المتابعة والتواصل داخل التطبيق.',
          },
          {
            icon: 'people-outline',
            title: 'دورنا في المنصة',
            description: 'متابعة المحتوى، تحسين واجهات الاستخدام، وتوفير قنوات تواصل واضحة بين المستخدم والمنصة.',
          },
        ],
        footer: {
          title: 'تخصيص المحتوى',
          description: 'يمكن استبدال هذا النص لاحقًا بمعلومات الجهة الحقيقية، اسمها الرسمي، رؤيتها، وسجلها أو بيانات التواصل الخاصة بها.',
        },
      }
    : {
        title: 'About Entity',
        eyebrow: 'Operating organization',
        heroTitle: 'Who is behind the platform',
        heroDescription:
          'This page introduces the organization or team responsible for operating the platform, its mission, and its role in managing the experience.',
        stats: [
          { value: 'Operational', label: 'Role type' },
          { value: 'Local', label: 'Scope' },
        ],
        sections: [
          {
            icon: 'business-outline',
            title: 'Who we are',
            description: 'An organization focused on structuring project presentation and offering a clearer digital experience for users.',
          },
          {
            icon: 'eye-outline',
            title: 'Our mission',
            description: 'Build an organized investment experience that supports showcasing initiatives and simplifies follow-up inside the app.',
          },
          {
            icon: 'people-outline',
            title: 'Our role in the platform',
            description: 'We oversee content, improve interface quality, and keep communication channels clear between users and the platform.',
          },
        ],
        footer: {
          title: 'Customizable content',
          description: 'You can later replace this text with the real organization profile, official name, vision, and contact information.',
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
      heroIcon="business-outline"
      stats={content.stats}
      sections={content.sections}
      footer={content.footer}
    />
  );
};

export default AboutEntityScreen;
