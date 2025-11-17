import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, DollarSign, Zap, Users, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';
import { APP_CONFIG, CHAINLINK_CONFIG } from '../config/constants';

interface Order {
  id: number;
  type: 'buy' | 'sell';
  kwh: number;
  price: number;
  seller: string;
  buyer?: string;
  status: 'active' | 'completed';
  timestamp: string;
}

interface EnergyMarketProps {
  walletAddress: string;
}

export function EnergyMarket({ walletAddress }: EnergyMarketProps) {
  const { t, language } = useLanguage();
  
  // 从配置获取实时电价
  const [currentPrice] = useState(CHAINLINK_CONFIG.MOCK_ELECTRICITY_PRICE);
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState(currentPrice.toString());
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  const [myListings, setMyListings] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 1, 
      type: 'sell', 
      kwh: 500, 
      price: 0.14, 
      seller: '0x8ba...9c3',
      status: 'active',
      timestamp: '2025-11-17 09:30'
    },
    { 
      id: 2, 
      type: 'sell', 
      kwh: 300, 
      price: 0.145, 
      seller: '0x7a1...8d2',
      status: 'active',
      timestamp: '2025-11-17 08:15'
    },
    { 
      id: 3, 
      type: 'sell', 
      kwh: 1000, 
      price: 0.138, 
      seller: '0x6c5...7e1',
      status: 'active',
      timestamp: '2025-11-17 07:45'
    },
  ]);

  const createSellOrder = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast.error(t('market.amount.required'));
      return;
    }

    setIsCreatingOrder(true);
    
    // 模拟MetaMask交易确认
    setTimeout(() => {
      toast.success(t('market.create.success'), {
        description: `${sellAmount} kWh @ $${currentPrice}/kWh`
      });
      
      setSellAmount('');
      setIsCreatingOrder(false);
    }, 2000);
  };

  const fulfillOrder = async (order: Order) => {
    // 模拟MetaMask交易确认
    toast.info(t('market.order.processing'), {
      description: t('market.order.confirm')
    });

    setTimeout(() => {
      const updatedOrders = orders.map(o => 
        o.id === order.id ? { ...o, status: 'completed' as const } : o
      );
      setOrders(updatedOrders);
      
      const totalValue = (order.kwh * order.price).toFixed(2);
      toast.success(t('market.order.success'), {
        description: `${t('market.order.success.desc')} ${order.kwh} kWh, $${totalValue}`
      });
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Current Price from Chainlink */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('market.price.title')}</div>
              <div className="text-3xl text-gray-900 flex items-baseline gap-2">
                ${currentPrice}
                <span className="text-lg text-gray-600">/kWh</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{t('market.price.source')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Create Sell Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t('market.create.title')}
          </CardTitle>
          <CardDescription>
            {t('market.create.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sellAmount">{t('market.amount.label')}</Label>
              <Input
                id="sellAmount"
                type="number"
                placeholder={t('market.amount.placeholder')}
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
              />
            </div>
            
            {sellAmount && parseFloat(sellAmount) > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{t('market.estimated.income')}</span>
                  <span className="text-xl text-gray-900">
                    ${(parseFloat(sellAmount) * currentPrice).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {sellAmount} kWh × ${currentPrice}/kWh
                </div>
              </div>
            )}

            <Button 
              onClick={createSellOrder}
              disabled={isCreatingOrder}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingOrder ? t('market.creating') : t('market.create.button')}
            </Button>

            <p className="text-xs text-gray-500">
              💡 {t('market.create.hint')} <code className="bg-gray-100 px-1 py-0.5 rounded">createSellOrder()</code> {t('market.create.function')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Buy Orders from The Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('market.orders.title')}
          </CardTitle>
          <CardDescription>
            {t('market.orders.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.filter(o => o.status === 'active').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('market.orders.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.filter(o => o.status === 'active').map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-gray-900">
                        {t('market.order.buying')} {order.kwh} kWh
                      </div>
                      <div className="text-sm text-gray-500">
                        {t('market.order.buyer')}: {order.buyer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-gray-900">${order.price}/kWh</div>
                      <div className="text-sm text-gray-500">
                        {t('market.order.total')}: ${(order.kwh * order.price).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      onClick={() => fulfillOrder(order)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {t('market.order.sell')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              📊 <strong>{t('market.query.example')}</strong>
            </div>
            <pre className="mt-2 text-xs text-gray-700 overflow-x-auto">
{`query {
  buyOrders(where: { status: "active" }) {
    id
    kwh
    price
    buyer
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="text-sm text-gray-900 mb-3">💡 {t('market.process.title')}</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex gap-2">
              <span>1️⃣</span>
              <span>{t('market.process.step1')}</span>
            </div>
            <div className="flex gap-2">
              <span>2️⃣</span>
              <span>{t('market.process.step2')} <code className="bg-white px-1 py-0.5 rounded">fulfillOrder()</code></span>
            </div>
            <div className="flex gap-2">
              <span>3️⃣</span>
              <span>{t('market.process.step3')}</span>
            </div>
            <div className="flex gap-2">
              <span>4️⃣</span>
              <span>{t('market.process.step4')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}