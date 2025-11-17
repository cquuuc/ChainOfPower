import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Shield, Wrench, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_CONFIG } from '../config/constants';

interface RoleSelectionDialogProps {
  open: boolean;
  walletAddress: string;
  registeredMaintainer?: string;
  onRoleSelect: (role: 'owner' | 'maintainer') => void;
  onClose: () => void;
}

export function RoleSelectionDialog({
  open,
  walletAddress,
  registeredMaintainer,
  onRoleSelect,
  onClose
}: RoleSelectionDialogProps) {
  const { language } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<'owner' | 'maintainer' | null>(null);

  // 检查当前钱包是否可以作为维修人员登录
  const canLoginAsMaintainer = registeredMaintainer 
    ? walletAddress.toLowerCase() === registeredMaintainer.toLowerCase()
    : false;

  const handleConfirm = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
      onClose();
    }
  };

  const roleOptions = [
    {
      role: 'owner' as const,
      title: language === 'zh' ? '设备所有者' : 'Device Owner',
      description: language === 'zh' 
        ? '管理设备、查看数据、进行能源交易' 
        : 'Manage devices, view data, trade energy',
      icon: Shield,
      color: 'blue',
      available: true
    },
    {
      role: 'maintainer' as const,
      title: language === 'zh' ? '维修人员' : 'Maintainer',
      description: language === 'zh' 
        ? '解密设备数据、提交维修证明' 
        : 'Decrypt device data, submit repair proof',
      icon: Wrench,
      color: 'purple',
      available: canLoginAsMaintainer
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {language === 'zh' ? '🔐 选择登录角色' : '🔐 Select Login Role'}
          </DialogTitle>
          <DialogDescription>
            {language === 'zh' 
              ? '请选择您要使用的角色登录系统' 
              : 'Please select the role you want to use to login'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* 钱包地址显示 */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs text-gray-500 mb-1">
              {language === 'zh' ? '钱包地址' : 'Wallet Address'}
            </div>
            <div className="text-xs font-mono text-gray-900">
              {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
            </div>
          </div>

          {/* 角色选项 */}
          <div className="space-y-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.role;
              const isAvailable = option.available;

              return (
                <button
                  key={option.role}
                  onClick={() => isAvailable && setSelectedRole(option.role)}
                  disabled={!isAvailable}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all
                    ${isSelected 
                      ? option.color === 'blue' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${option.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'}
                      `}>
                        <Icon className={`
                          w-5 h-5
                          ${option.color === 'blue' ? 'text-blue-600' : 'text-purple-600'}
                        `} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {option.title}
                          </span>
                          {!isAvailable && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                              {language === 'zh' ? '不可用' : 'Unavailable'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center
                        ${option.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}
                      `}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 维修人员不可用提示 */}
          {!canLoginAsMaintainer && registeredMaintainer && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-orange-800">
                  <div className="font-medium mb-1">
                    {language === 'zh' ? '维修人员角色不可用' : 'Maintainer role unavailable'}
                  </div>
                  <div>
                    {language === 'zh' 
                      ? '当前钱包地址与注册的维修人员地址不匹配。只有在注册设备时指定的维修人员地址才能使用维修人员角色登录。' 
                      : 'Current wallet address does not match the registered maintainer address. Only the maintainer address specified during device registration can login as maintainer.'}
                  </div>
                  <div className="mt-2 p-2 bg-white rounded border border-orange-300">
                    <div className="text-xs text-gray-600 mb-1">
                      {language === 'zh' ? '注册的维修人员地址：' : 'Registered maintainer address:'}
                    </div>
                    <div className="font-mono text-xs text-gray-900">
                      {registeredMaintainer.slice(0, 10)}...{registeredMaintainer.slice(-8)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 演示模式提示 */}
          {APP_CONFIG.DEMO_MODE && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800">
                💡 <strong>{language === 'zh' ? '演示模式' : 'Demo Mode'}</strong>
                <p className="mt-1">
                  {language === 'zh' 
                    ? `要体验维修人员角色，请使用注册设备时填写的维修人员地址登录：` 
                    : 'To experience the maintainer role, login with the maintainer address specified during device registration:'}
                </p>
                <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                  <div className="font-mono text-xs text-gray-900">
                    0x28c3...7Fd1
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRole}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {language === 'zh' ? '确认登录' : 'Confirm Login'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}