const fs = require('fs');
const path = require('path');

const files = [
  'App.js',
  'Component/AccountScreen.js',
  'Component/AddProjectScreen.js',
  'Component/AppHeader.js',
  'Component/AppNavigator.js',
  'Component/BrandLogo.js',
  'Component/CartScreen.js',
  'Component/CheckEmailScreen.js',
  'Component/ContributionScreen.js',
  'Component/DrawerContent.js',
  'Component/EditAccountScreen.js',
  'Component/ForgotPasswordScreen.js',
  'Component/HomeScreen.js',
  'Component/InfoScreenLayout.js',
  'Component/LoginScreen.js',
  'Component/NotificationsScreen.js',
  'Component/OwnerDashboard.js',
  'Component/ProjectDetailScreen.js',
  'Component/ProjectsScreen.js',
  'Component/RechargeWalletScreen.js',
  'Component/RegisterScreen.js',
  'Component/ResetPasswordScreen.js',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('useTheme')) return; // Already refactored
  if (!content.includes('COLORS')) return; // No colors used
  
  // 1. Replace import { COLORS, ... } from '../constants/theme'
  content = content.replace(/import\s+\{\s*([^}]*?)\s*\}\s+from\s+['"](?:\.\.\/|\.\/)constants\/theme['"];/, (match, group1) => {
    let newGroup = group1.split(',').map(s => s.trim()).filter(s => s !== 'COLORS' && s !== 'SHADOWS');
    let replacement = `import { useTheme } from '../hooks/useTheme';\n`;
    if (newGroup.length > 0) {
      // Keep the other imports, figure out the path
      const themePath = match.includes('../') ? '../constants/theme' : './constants/theme';
      replacement += `import { ${newGroup.join(', ')} } from '${themePath}';`;
    }
    return replacement;
  });

  // Handle case where COLORS is imported differently
  if (!content.includes('useTheme')) {
      content = `import { useTheme } from '../hooks/useTheme';\n` + content;
  }

  // 2. Inject `const { colors, shadows, isDarkMode } = useTheme();` into the component
  content = content.replace(/(?:export\s+default\s+)?(?:function\s+(\w+)\s*\(.*?\)\s*\{|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{)/g, (match, p1, p2) => {
    // Exclude TabBar inside AppNavigator if it's already there or handle it carefully
    return `${match}\n  const { colors: COLORS, shadows: SHADOWS, isDarkMode } = useTheme();\n  const styles = React.useMemo(() => getStyles(COLORS, SHADOWS), [COLORS, SHADOWS]);`;
  });

  // Make sure React is imported for React.useMemo
  if (!content.includes('import React')) {
    content = `import React from 'react';\n` + content;
  }

  // 3. Replace const styles = StyleSheet.create({ ... }) with const getStyles = (COLORS, SHADOWS) => StyleSheet.create({ ... })
  content = content.replace(/const\s+styles\s*=\s*StyleSheet\.create\(\{/g, 'const getStyles = (COLORS, SHADOWS) => StyleSheet.create({');

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${file}`);
});
