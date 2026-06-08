import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const TermsScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'الشروط والأحكام',
        eyebrow: 'تنظيم الاستخدام',
        heroTitle: 'نوضح القواعد الأساسية لاستخدام المنصة',
        heroDescription:
          'هذه البنود تقدم تصورًا مبسطًا لكيفية استخدام المنصة ومسؤولية المستخدم وحدود التعامل داخلها.',
        stats: [
          { value: '6', label: 'بنود رئيسية' },
          { value: 'واضح', label: 'أسلوب العرض' },
        ],
        sections: [
          {
            icon: 'compass-outline',
            title: 'استخدام المنصة',
            description: 'يجب استخدام المنصة للأغراض المشروعة فقط، مع الامتناع عن أي سلوك يسيء للتجربة أو يسبب ضررًا للآخرين.',
          },
          {
            icon: 'shield-outline',
            title: 'حماية البيانات',
            description: 'تُعامل بيانات المستخدم بعناية، ويجب على المستخدم أيضًا حماية معلومات حسابه وعدم مشاركتها مع الآخرين.',
          },
          {
            icon: 'person-circle-outline',
            title: 'مسؤولية الحساب',
            description: 'صاحب الحساب مسؤول عن النشاط الذي يتم من خلاله وعن صحة البيانات التي يضيفها أثناء التسجيل أو التصفح.',
          },
          {
            icon: 'create-outline',
            title: 'تحديث البنود',
            description: 'قد يتم تحديث الشروط عند الحاجة لتطوير الخدمة أو مواءمتها مع المتطلبات التنظيمية والتشغيلية.',
          },
          {
            icon: 'wallet-outline',
            title: 'المساهمات المالية',
            description: 'أي مساهمة أو عملية مرتبطة بالتمويل تخضع للضوابط المعتمدة داخل المنصة وللسياسات ذات العلاقة.',
          },
          {
            icon: 'git-compare-outline',
            title: 'حل النزاعات',
            description: 'عند وجود إشكال، تكون الأولوية للتواصل المباشر والتوضيح قبل أي خطوات تصعيد لاحقة.',
          },
        ],
      }
    : {
        title: 'Terms & Conditions',
        eyebrow: 'Usage rules',
        heroTitle: 'The core rules for using the platform',
        heroDescription:
          'These terms provide a simplified view of how the platform should be used, what users are responsible for, and the scope of interaction.',
        stats: [
          { value: '6', label: 'Main clauses' },
          { value: 'Clear', label: 'Presentation' },
        ],
        sections: [
          {
            icon: 'compass-outline',
            title: 'Platform use',
            description: 'The platform should be used for legitimate purposes only, without misuse or actions that harm the experience of others.',
          },
          {
            icon: 'shield-outline',
            title: 'Data protection',
            description: 'User data should be handled carefully, and users are also expected to keep their own account details secure.',
          },
          {
            icon: 'person-circle-outline',
            title: 'Account responsibility',
            description: 'Each account holder is responsible for the activity performed through the account and the accuracy of submitted information.',
          },
          {
            icon: 'create-outline',
            title: 'Terms updates',
            description: 'The terms may be updated when needed to improve the service or align it with operational requirements.',
          },
          {
            icon: 'wallet-outline',
            title: 'Financial contributions',
            description: 'Any funding-related action is subject to the platform rules and the relevant operational policies.',
          },
          {
            icon: 'git-compare-outline',
            title: 'Dispute resolution',
            description: 'When issues arise, direct communication and clarification should come first before escalation.',
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
      heroIcon="document-text-outline"
      stats={content.stats}
      sections={content.sections}
    />
  );
};

export default TermsScreen;
