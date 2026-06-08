import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const PrivacyScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'سياسة الخصوصية',
        eyebrow: 'بياناتك مهمة',
        heroTitle: 'نشرح كيف يتم التعامل مع معلومات المستخدم',
        heroDescription:
          'الهدف من هذه الصفحة هو توضيح نوع المعلومات الأساسية التي تظهر داخل المنصة وكيف يمكن حمايتها وعرضها بشكل مسؤول.',
        stats: [
          { value: 'آمن', label: 'نهج التعامل' },
          { value: '6', label: 'محاور رئيسية' },
        ],
        sections: [
          {
            icon: 'person-outline',
            title: 'جمع المعلومات',
            description: 'يتم الاعتماد على البيانات الأساسية اللازمة فقط مثل الاسم ورقم الهاتف والبريد عند الحاجة لتحسين الخدمة.',
          },
          {
            icon: 'shield-checkmark-outline',
            title: 'حماية البيانات',
            description: 'نعمل على عرض البيانات وحفظها ضمن تجربة آمنة قدر الإمكان مع تقليل الوصول غير الضروري إليها.',
          },
          {
            icon: 'share-social-outline',
            title: 'مشاركة البيانات',
            description: 'لا يتم تصور مشاركة البيانات الشخصية إلا ضمن ما تفرضه الحاجة التشغيلية أو المتطلبات النظامية.',
          },
          {
            icon: 'time-outline',
            title: 'الاحتفاظ بالمعلومات',
            description: 'الاحتفاظ بالمعلومات يكون بقدر ما يخدم تشغيل المنصة وتحسين التجربة دون تضخم غير مبرر في البيانات.',
          },
          {
            icon: 'trash-outline',
            title: 'التحكم في البيانات',
            description: 'يمكن مستقبلاً تطوير إجراءات أوضح لتعديل أو حذف البيانات بحسب السياسة المعتمدة لدى الجهة المشغلة.',
          },
          {
            icon: 'options-outline',
            title: 'تحسين التجربة',
            description: 'قد تستخدم بعض البيانات بشكل عام لتحسين الأداء والتنقل داخل التطبيق وتبسيط رحلة المستخدم.',
          },
        ],
      }
    : {
        title: 'Privacy Policy',
        eyebrow: 'Your data matters',
        heroTitle: 'How user information is handled',
        heroDescription:
          'This page explains the basic information used within the platform and how it should be presented and protected responsibly.',
        stats: [
          { value: 'Safe', label: 'Handling approach' },
          { value: '6', label: 'Key topics' },
        ],
        sections: [
          {
            icon: 'person-outline',
            title: 'Information collection',
            description: 'Only essential details such as name, phone number, and email are expected when needed to improve the service.',
          },
          {
            icon: 'shield-checkmark-outline',
            title: 'Data protection',
            description: 'The interface is designed to keep user information visible only where necessary and presented responsibly.',
          },
          {
            icon: 'share-social-outline',
            title: 'Data sharing',
            description: 'Personal information is not intended to be shared except where operational or regulatory requirements apply.',
          },
          {
            icon: 'time-outline',
            title: 'Data retention',
            description: 'Information should be retained only to support the platform experience and improve service quality.',
          },
          {
            icon: 'trash-outline',
            title: 'Data control',
            description: 'Clearer edit or deletion workflows can be added later depending on the organization policy.',
          },
          {
            icon: 'options-outline',
            title: 'Experience improvement',
            description: 'Some general information may be used to improve performance, navigation, and the overall user flow.',
          },
        ],
      };

  return (
    <InfoScreenLayout
      navigation={navigation}
      isAr={isAr}
      title={content.title}
      eyebrow={content.eyebrow}
      heroTitle={content.heroTitle}
      heroDescription={content.heroDescription}
      heroIcon="lock-closed-outline"
      stats={content.stats}
      sections={content.sections}
    />
  );
};

export default PrivacyScreen;
