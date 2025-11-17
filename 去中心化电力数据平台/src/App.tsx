import { useState, useEffect } from 'react';
import { DeviceManagement } from './components/DeviceManagement';
import { EnergyMarket } from './components/EnergyMarket';
import { MaintenanceService } from './components/MaintenanceService';
import { WalletConnect } from './components/WalletConnect';
import { LanguageSwitch } from './components/LanguageSwitch';
import { RoleSelectionDialog } from './components/RoleSelectionDialog';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { Zap, Activity, Wrench, Shield, User } from 'lucide-react';
import { Badge } from './components/ui/badge';

interface WalletInfo {
  address: string;
  balance: string;
}

function AppContent() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'market' | 'maintenance'>('devices');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const { t, language } = useLanguage();
  const { role, isOwner, isMaintainer, setRole, setWalletAddress, registeredMaintainer, resetRole } = useRole();

  // 当钱包连接时，显示角色选择对话框
  useEffect(() => {
    if (walletInfo) {
      setWalletAddress(walletInfo.address);
      // 每次钱包信息变化且没有选择角色时都显示对话框
      if (!role) {
        setShowRoleDialog(true);
      }
    } else {
      // 钱包断开时关闭对话框
      setShowRoleDialog(false);
    }
  }, [walletInfo, role, setWalletAddress]);

  // 当切换到维修人员角色时，自动切换到维护服务页面
  useEffect(() => {
    if (isMaintainer) {
      setActiveTab('maintenance');
    }
  }, [isMaintainer]);

  // 处理角色选择
  const handleRoleSelect = (selectedRole: 'owner' | 'maintainer') => {
    setRole(selectedRole);
  };

  // 处理断开连接
  const handleDisconnect = () => {
    setWalletInfo(null);
    resetRole();
    setShowRoleDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-right" />
      
      {/* 角色选择对话框 */}
      {walletInfo && (
        <RoleSelectionDialog
          open={showRoleDialog}
          walletAddress={walletInfo.address}
          registeredMaintainer={registeredMaintainer}
          onRoleSelect={handleRoleSelect}
          onClose={() => setShowRoleDialog(false)}
        />
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">{t('app.title')}</h1>
                <p className="text-sm text-gray-600">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 当前角色显示 - 点击可重新选择 */}
              {walletInfo && role && (
                <button
                  onClick={() => setShowRoleDialog(true)}
                  className="transition-transform hover:scale-105"
                  title={language === 'zh' ? '点击切换角色' : 'Click to switch role'}
                >
                  <Badge className={`cursor-pointer ${isMaintainer ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}>
                    {isMaintainer ? <Wrench className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                    {isMaintainer ? (t('role.maintainer') || '维修人员') : (t('role.owner') || '设备所有者')}
                  </Badge>
                </button>
              )}
              <LanguageSwitch />
              <WalletConnect walletInfo={walletInfo} setWalletInfo={setWalletInfo} onDisconnect={handleDisconnect} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!walletInfo ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-gray-900 mb-2">{t('welcome.title')}</h2>
            <p className="text-gray-600 mb-6">
              {t('welcome.description')}
            </p>
            <div className="inline-block">
              <WalletConnect walletInfo={walletInfo} setWalletInfo={setWalletInfo} />
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                {/* 设备管理 - 仅设备所有者可见 */}
                {isOwner && (
                  <button
                    onClick={() => setActiveTab('devices')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                      activeTab === 'devices'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Activity className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('tab.devices')}</span>
                    <span className="sm:hidden">Devices</span>
                  </button>
                )}
                
                {/* 能源市场 - 仅设备所有者可见 */}
                {isOwner && (
                  <button
                    onClick={() => setActiveTab('market')}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                      activeTab === 'market'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('tab.market')}</span>
                    <span className="sm:hidden">Market</span>
                  </button>
                )}
                
                {/* 维护服务 - 所有人可见 */}
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                    activeTab === 'maintenance'
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Wrench className="w-5 h-5" />
                  <span className="hidden sm:inline">{t('tab.maintenance')}</span>
                  <span className="sm:hidden">Maintenance</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'devices' && isOwner && <DeviceManagement walletAddress={walletInfo.address} />}
              {activeTab === 'market' && isOwner && <EnergyMarket walletAddress={walletInfo.address} />}
              {activeTab === 'maintenance' && <MaintenanceService walletAddress={walletInfo.address} />}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-1">⛓️</div>
                <h3 className="text-sm text-gray-900 mb-1">{t('footer.blockchain')}</h3>
                <p className="text-xs text-gray-600">{t('footer.blockchain.desc')}</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🔗</div>
                <h3 className="text-sm text-gray-900 mb-1">{t('footer.chainlink')}</h3>
                <p className="text-xs text-gray-600">{t('footer.chainlink.desc')}</p>
              </div>
              <div>
                <div className="text-2xl mb-1">📊</div>
                <h3 className="text-sm text-gray-900 mb-1">{t('footer.thegraph')}</h3>
                <p className="text-xs text-gray-600">{t('footer.thegraph.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </RoleProvider>
  );
}