import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wallet, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';

interface WalletInfo {
  address: string;
  balance: string;
}

interface WalletConnectProps {
  walletInfo: WalletInfo | null;
  setWalletInfo: (info: WalletInfo | null) => void;
  onDisconnect?: () => void;
}

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function WalletConnect({ walletInfo, setWalletInfo, onDisconnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const { t, language } = useLanguage();

  // 检查 MetaMask 是否安装
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasMetaMask(true);
      
      // 监听账户变化
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // 处理账户变化
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // 用户断开了连接
      disconnectWallet();
    } else if (accounts[0] !== walletInfo?.address) {
      // 用户切换了账户
      toast.info(language === 'zh' ? '账户已切换' : 'Account switched');
      connectWallet();
    }
  };

  // 处理链变化
  const handleChainChanged = () => {
    // 重新加载页面是处理链变化的推荐方式
    window.location.reload();
  };

  // 连接 MetaMask 钱包
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error(language === 'zh' ? '未检测到 MetaMask' : 'MetaMask not detected', {
        description: language === 'zh' 
          ? '请先安装 MetaMask 浏览器扩展' 
          : 'Please install MetaMask browser extension first'
      });
      // 打开 MetaMask 下载页面
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    
    try {
      // 请求连接 MetaMask
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // 获取余额
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // 将 Wei 转换为 ETH
      const balanceETH = (parseInt(balanceWei, 16) / 1e18).toFixed(4);
      
      setWalletInfo({
        address: address,
        balance: balanceETH
      });
      
      toast.success(language === 'zh' ? '钱包连接成功' : 'Wallet connected successfully', {
        description: `${address.slice(0, 10)}...${address.slice(-8)}`
      });
      
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      
      if (error.code === 4001) {
        // 用户拒绝连接
        toast.error(language === 'zh' ? '连接被拒绝' : 'Connection rejected', {
          description: language === 'zh' 
            ? '您拒绝了连接请求' 
            : 'You rejected the connection request'
        });
      } else {
        toast.error(language === 'zh' ? '连接失败' : 'Connection failed', {
          description: error.message || 'Unknown error'
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletInfo(null);
    onDisconnect?.();
    toast.info(language === 'zh' ? '钱包已断开' : 'Wallet disconnected');
  };

  // 如果没有连接钱包，显示连接按钮
  if (!walletInfo) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button 
          onClick={connectWallet}
          disabled={isConnecting}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting 
            ? (language === 'zh' ? '连接中...' : 'Connecting...') 
            : (language === 'zh' ? '连接 MetaMask' : 'Connect MetaMask')}
        </Button>
        
        {!hasMetaMask && (
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertCircle className="w-3 h-3" />
            <span>
              {language === 'zh' ? '未安装 MetaMask' : 'MetaMask not installed'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 已连接钱包，显示地址和余额
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-xs text-gray-500">
          {language === 'zh' ? '余额' : 'Balance'}
        </div>
        <div className="text-sm text-gray-900">{walletInfo.balance} ETH</div>
      </div>
      <Button 
        variant="outline"
        onClick={disconnectWallet}
        className="gap-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm">
          {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
        </span>
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  );
}
