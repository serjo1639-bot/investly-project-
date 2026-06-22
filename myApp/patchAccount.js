const fs = require('fs');

let content = fs.readFileSync('Component/AccountScreen.js', 'utf8');

// 1. Pull toggleTheme
content = content.replace(
  'const { colors: COLORS, shadows: SHADOWS, isDarkMode } = useTheme();',
  'const { colors: COLORS, shadows: SHADOWS, isDarkMode, toggleTheme } = useTheme();'
);

// 2. Add Theme toggle
const oldItems = `  const commonItems = [
    {
      icon: 'wallet-outline',`;

const newItems = `  const commonItems = [
    {
      icon: isDarkMode ? 'moon' : 'sunny-outline',
      label: isAr ? 'المظهر' : 'Theme',
      value: isDarkMode ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'فاتح' : 'Light'),
      iconColor: { color: ACCOUNT_ACCENT.primaryDark, backgroundColor: ACCOUNT_ACCENT.primarySoft },
      onPress: toggleTheme,
    },
    {
      icon: 'wallet-outline',`;

content = content.replace(oldItems, newItems);

fs.writeFileSync('Component/AccountScreen.js', content);
console.log('AccountScreen.js successfully patched!');
