import { useRole } from '../contexts/RoleContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { User, Wrench } from 'lucide-react';

export function RoleSwitch() {
  const { role, setRole } = useRole();
  const { language } = useLanguage();

  const toggleRole = () => {
    setRole(role === 'owner' ? 'maintainer' : 'owner');
  };

  const roleText = {
    owner: {
      zh: '设备所有者',
      en: 'Device Owner'
    },
    maintainer: {
      zh: '维修人员',
      en: 'Maintainer'
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleRole}
      className="gap-2"
    >
      {role === 'owner' ? (
        <User className="w-4 h-4" />
      ) : (
        <Wrench className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {roleText[role][language]}
      </span>
      <span className="sm:hidden">
        {role === 'owner' ? (language === 'zh' ? '用户' : 'User') : (language === 'zh' ? '维修' : 'Tech')}
      </span>
    </Button>
  );
}
