import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2"
    >
      <Languages className="w-4 h-4" />
      <span className="hidden sm:inline">{language === 'zh' ? '中文' : 'English'}</span>
      <span className="sm:hidden">{language === 'zh' ? '中' : 'EN'}</span>
    </Button>
  );
}
