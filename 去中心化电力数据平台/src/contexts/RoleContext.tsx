import { createContext, useContext, useState, ReactNode } from 'react';
import { BLOCKCHAIN_CONFIG } from '../config/constants';

type UserRole = 'owner' | 'maintainer' | null;

interface RoleContextType {
  role: UserRole;
  walletAddress: string;
  registeredMaintainer: string;
  setRole: (role: 'owner' | 'maintainer') => void;
  setWalletAddress: (address: string) => void;
  setRegisteredMaintainer: (address: string) => void;
  isMaintainer: boolean;
  isOwner: boolean;
  canAccessMaintainerRole: () => boolean;
  resetRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [registeredMaintainer, setRegisteredMaintainer] = useState<string>(
    BLOCKCHAIN_CONFIG.TEST_ACCOUNTS.MAINTAINER_1 // 维修人员地址: 0x28c3...
  );

  // 检查当前钱包是否可以访问维修人员角色
  const canAccessMaintainerRole = () => {
    if (!walletAddress || !registeredMaintainer) return false;
    return walletAddress.toLowerCase() === registeredMaintainer.toLowerCase();
  };

  // 重置角色（断开连接时）
  const resetRole = () => {
    setRole(null);
    setWalletAddress('');
  };

  return (
    <RoleContext.Provider 
      value={{ 
        role, 
        walletAddress,
        registeredMaintainer,
        setRole,
        setWalletAddress,
        setRegisteredMaintainer,
        isMaintainer: role === 'maintainer',
        isOwner: role === 'owner',
        canAccessMaintainerRole,
        resetRole
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}