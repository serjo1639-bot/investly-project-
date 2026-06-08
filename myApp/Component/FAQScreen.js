import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoScreenLayout from './InfoScreenLayout';

const FAQScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr
    ? {
        title: 'الأسئلة الشائعة',
        eyebrow: 'مساعدة سريعة',
        heroTitle: 'أكثر الأمور التي يسأل عنها المستخدمون',
        heroDescription:
          'جمعنا أهم الأسئلة الشائعة حول المنصة وطريقة الاستخدام حتى تكون البداية أوضح ويكون الوصول للمعلومة أسرع.',
        stats: [
          { value: '4', label: 'أسئلة أساسية' },
          { value: 'سريع', label: 'وصول للمعلومة' },
        ],
        sections: [
          {
            icon: 'help-circle-outline',
            title: 'ما هي منصة Investly؟',
            description: 'هي منصة رقمية لعرض المشاريع الاستثمارية ومساعدة المستخدمين على استكشاف الفرص والمساهمة فيها ضمن تجربة منظمة.',
          },
          {
            icon: 'cash-outline',
            title: 'كيف أبدأ بالمساهمة في مشروع؟',
            description: 'يمكنك تصفح المشاريع، فتح التفاصيل، ثم حفظ المشروع في استثماراتي أو المتابعة حسب آلية الاستثمار المعتمدة داخل التطبيق.',
          },
          {
            icon: 'card-outline',
            title: 'ما وسائل الدفع أو المساهمة؟',
            description: 'واجهة المنصة مصممة لعرض خيارات المساهمة بوضوح، ويمكن ربطها لاحقًا بوسائل الدفع المحلية أو الإلكترونية المناسبة.',
          },
          {
            icon: 'stats-chart-outline',
            title: 'هل أستطيع متابعة مساهماتي؟',
            description: 'نعم، صفحة الحساب الجديدة تعرض لك إجمالي المساهمات، عدد المساهمات، وعدد المشاريع المرتبطة بنشاطك.',
          },
        ],
      }
    : {
        title: 'FAQ',
        eyebrow: 'Quick help',
        heroTitle: 'The most common questions from users',
        heroDescription:
          'We collected the most important questions about the platform so the first experience feels clearer and easier to navigate.',
        stats: [
          { value: '4', label: 'Core answers' },
          { value: 'Fast', label: 'Access to info' },
        ],
        sections: [
          {
            icon: 'help-circle-outline',
            title: 'What is Investly?',
            description: 'It is a digital platform for showcasing investment projects and helping users explore and contribute with clarity.',
          },
          {
            icon: 'cash-outline',
            title: 'How do I start contributing?',
            description: 'Browse projects, open the details, then save the project to My Investments or continue through the supported flow.',
          },
          {
            icon: 'card-outline',
            title: 'What contribution methods are available?',
            description: 'The app is structured to present contribution methods clearly and can be connected to local or electronic payment options.',
          },
          {
            icon: 'stats-chart-outline',
            title: 'Can I track my activity?',
            description: 'Yes, the redesigned account page shows total contributions, contribution count, and project-related activity.',
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
      heroIcon="chatbubbles-outline"
      stats={content.stats}
      sections={content.sections}
    />
  );
};

export default FAQScreen;
