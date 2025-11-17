import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Wrench, AlertTriangle, CheckCircle, Upload, Activity, Phone, Mail, User, Eye, MapPin, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { decryptKeyWithRSA, decryptWithAES } from '../utils/encryption';

interface AlertItem {
  id: number;
  deviceId: string;
  deviceName: string;
  healthScore: number;
  issue: string;
  timestamp: string;
  status: 'pending' | 'resolved';
  maintainerContact?: {
    name: string;
    phone: string;
    email: string;
  };
}

interface MaintenanceServiceProps {
  walletAddress: string;
}

// 模拟设备数据接口
interface DeviceData {
  deviceId: string;
  deviceType: string;
  capacity: string;
  owner: string;
  maintainer: string;
  encryptedPhoto: string;
  encryptedGPS: string;
  encryptedAESKey: string;
  ipfsHash: string;
  registrationTime: string;
  healthScore: number;
}

export function MaintenanceService({ walletAddress }: MaintenanceServiceProps) {
  const { t, language } = useLanguage();
  const { isMaintainer, isOwner } = useRole();
  const [maintenanceDeviceId, setMaintenanceDeviceId] = useState('');
  const [proofFile, setProofFile] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{
    photo: string | null;
    gps: { lat: number; lng: number; address?: string } | null;
  }>({ photo: null, gps: null });
  
  // 模拟设备数据（从区块链和IPFS获取）
  const [devices] = useState<DeviceData[]>([
    {
      deviceId: 'DG-001',
      deviceType: language === 'zh' ? '太阳能板' : 'Solar Panel',
      capacity: '5000 kWh',
      owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      maintainer: walletAddress,
      encryptedPhoto: 'encrypted_photo_data_base64...',
      encryptedGPS: 'encrypted_gps_data_base64...',
      encryptedAESKey: 'rsa_encrypted_aes_key_base64...',
      ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
      registrationTime: '2025-11-10 10:30',
      healthScore: 85
    },
    {
      deviceId: 'DG-002',
      deviceType: language === 'zh' ? '风力发电机' : 'Wind Turbine',
      capacity: '8000 kWh',
      owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      maintainer: walletAddress,
      encryptedPhoto: 'encrypted_photo_data_base64...',
      encryptedGPS: 'encrypted_gps_data_base64...',
      encryptedAESKey: 'rsa_encrypted_aes_key_base64...',
      ipfsHash: 'QmXx7YzHJKL8Mn9OpQrSt4VwXyZ1AbCdEfGhIjKlMnOpQr',
      registrationTime: '2025-11-11 14:20',
      healthScore: 45
    },
    {
      deviceId: 'DG-003',
      deviceType: language === 'zh' ? '储能电池' : 'Energy Storage',
      capacity: '10000 kWh',
      owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      maintainer: walletAddress,
      encryptedPhoto: 'encrypted_photo_data_base64...',
      encryptedGPS: 'encrypted_gps_data_base64...',
      encryptedAESKey: 'rsa_encrypted_aes_key_base64...',
      ipfsHash: 'QmAb1Cd2Ef3Gh4Ij5Kl6Mn7Op8Qr9St0Uv1Wx2Yz3Ab4Cd',
      registrationTime: '2025-11-12 09:15',
      healthScore: 92
    }
  ]);

  const submitMaintenanceProof = async () => {
    if (!maintenanceDeviceId) {
      toast.error(t('maintenance.device.required'));
      return;
    }

    setIsSubmitting(true);
    
    // 模拟MetaMask交易确认
    setTimeout(() => {
      // 更新对应设备的预警状态
      const updatedAlerts = alerts.map(alert =>
        alert.deviceId === maintenanceDeviceId
          ? { ...alert, status: 'resolved' as const }
          : alert
      );
      setAlerts(updatedAlerts);

      toast.success(t('maintenance.submit.success'), {
        description: `${maintenanceDeviceId} ${t('maintenance.submit.success.desc')}`
      });

      setMaintenanceDeviceId('');
      setProofFile('');
      setIsSubmitting(false);
    }, 2000);
  };

  const handleFileSelect = () => {
    // 模拟文件选择
    setProofFile('maintenance_proof_' + Date.now() + '.pdf');
    toast.info(t('maintenance.file.selected'), {
      description: t('maintenance.file.selected.desc')
    });
  };

  const contactMaintainer = (contact: any) => {
    toast.success(
      language === 'zh' ? '联系信息已复制' : 'Contact info copied',
      {
        description: `${contact.name} - ${contact.phone}`
      }
    );
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const decryptDeviceData = async (device: DeviceData) => {
    setIsDecrypting(true);
    try {
      // 演示模式：使用模拟数据
      // 在真实环境中，这里会使用真正的解密函数
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟解密后的数据
      const mockPhoto = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800';
      const mockGPS = {
        lat: 39.9042,
        lng: 116.4074,
        address: language === 'zh' ? '北京市朝阳区' : 'Chaoyang District, Beijing'
      };
      
      setDecryptedData({ 
        photo: mockPhoto, 
        gps: mockGPS 
      });
      
      toast.success(
        language === 'zh' ? '✅ 解密成功' : '✅ Decryption successful',
        {
          description: language === 'zh' 
            ? '已成功解密设备的敏感数据' 
            : 'Successfully decrypted sensitive device data'
        }
      );
      
      // 在真实环境中的代码：
      // const aesKey = await decryptKeyWithRSA(device.encryptedAESKey);
      // const photo = await decryptWithAES(device.encryptedPhoto, aesKey);
      // const gpsData = await decryptWithAES(device.encryptedGPS, aesKey);
      // const gps = JSON.parse(gpsData) as { lat: number; lng: number; address?: string };
      // setDecryptedData({ photo, gps });
    } catch (error) {
      toast.error(
        language === 'zh' ? '解密失败' : 'Decryption failed',
        {
          description: language === 'zh' 
            ? '无法解密设备数据，请检查您的权限' 
            : 'Unable to decrypt device data, please check your permissions'
        }
      );
      console.error('Decryption error:', error);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDeviceSelect = (device: DeviceData) => {
    setSelectedDevice(device);
    setShowDecryptDialog(true);
    decryptDeviceData(device);
  };

  const closeDecryptDialog = () => {
    setShowDecryptDialog(false);
    setDecryptedData({ photo: null, gps: null });
  };

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 1,
      deviceId: 'DG-002',
      deviceName: language === 'zh' ? '设备B' : 'Device B',
      healthScore: 45,
      issue: language === 'zh' ? '电压波动异常，建议检查电路连接' : 'Abnormal voltage fluctuation, check circuit connection',
      timestamp: '2025-11-13 09:30',
      status: 'pending',
      maintainerContact: {
        name: language === 'zh' ? '张师傅' : 'John Smith',
        phone: '+86 138-0000-1234',
        email: 'zhang@powertech.com'
      }
    },
    {
      id: 2,
      deviceId: 'DG-005',
      deviceName: language === 'zh' ? '设备E' : 'Device E',
      healthScore: 38,
      issue: language === 'zh' ? '功率输出下降20%，可能需要更换部件' : 'Power output decreased by 20%, may need component replacement',
      timestamp: '2025-11-13 08:15',
      status: 'pending',
      maintainerContact: {
        name: language === 'zh' ? '李师傅' : 'Mike Chen',
        phone: '+86 139-0000-5678',
        email: 'li@powertech.com'
      }
    }
  ]);

  return (
    <div className="space-y-6">
      {/* 维修人员专用：设备列表 */}
      {isMaintainer && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Unlock className="w-5 h-5" />
              {language === 'zh' ? '🔓 设备列表（可解密查看）' : '🔓 Device List (Decryptable)'}
            </CardTitle>
            <CardDescription className="text-purple-700">
              {language === 'zh' 
                ? '作为维修人员，您可以解密查看设备的敏感数据（照片和GPS位置）' 
                : 'As a maintainer, you can decrypt and view sensitive device data (photos and GPS locations)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.map(device => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-white hover:bg-purple-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gray-900">
                        <strong>{device.deviceId}</strong>
                      </span>
                      <Badge className={getHealthScoreColor(device.healthScore)}>
                        {language === 'zh' ? '健康度' : 'Health'}: {device.healthScore}%
                      </Badge>
                      {device.healthScore < 50 && (
                        <Badge className="bg-red-100 text-red-800">
                          {language === 'zh' ? '⚠️ 需要维修' : '⚠️ Needs Repair'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{device.deviceType}</span>
                      <span>•</span>
                      <span>{device.capacity}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {language === 'zh' ? '数据已加密' : 'Data Encrypted'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      IPFS: {device.ipfsHash.slice(0, 20)}...
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeviceSelect(device)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '解密查看' : 'Decrypt & View'}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
              <div className="text-xs text-gray-600 mb-2">
                🔐 <strong>{language === 'zh' ? '解密说明' : 'Decryption Info'}</strong>
              </div>
              <p className="text-xs text-gray-700">
                {language === 'zh' 
                  ? '点击"解密查看"将使用您的RSA私钥解密AES密钥，然后用AES密钥解密设备的照片和GPS位置数据。所有解密操作在本地完成，确保数据安全。' 
                  : 'Click "Decrypt & View" to use your RSA private key to decrypt the AES key, then use the AES key to decrypt device photos and GPS location data. All decryption operations are performed locally to ensure data security.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Alerts */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-5 h-5" />
            {t('maintenance.alert.title')}
          </CardTitle>
          <CardDescription className="text-orange-700">
            {t('maintenance.alert.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.filter(a => a.status === 'pending').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600 opacity-50" />
              <p className="text-gray-600">{t('maintenance.alert.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.filter(a => a.status === 'pending').map(alert => (
                <Alert key={alert.id} className="border-orange-300 bg-white">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900">
                            {language === 'zh' ? '设备' : 'Device'} <strong>{alert.deviceName}</strong> ({alert.deviceId})
                          </span>
                          <Badge className={getHealthScoreColor(alert.healthScore)}>
                            {t('maintenance.alert.health')}: {alert.healthScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.issue}</p>
                        <p className="text-xs text-gray-500">
                          {alert.timestamp}
                        </p>
                        
                        {/* 设备所有者视图：显示维修人员联系方式 */}
                        {isOwner && alert.maintainerContact && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-900 mb-2">
                              <strong>{language === 'zh' ? '指派维修人员：' : 'Assigned Maintainer:'}</strong>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{alert.maintainerContact.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{alert.maintainerContact.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{alert.maintainerContact.email}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="mt-2 h-7 text-xs"
                              onClick={() => contactMaintainer(alert.maintainerContact)}
                            >
                              {language === 'zh' ? '联系维修' : 'Contact Maintainer'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
            <div className="text-xs text-gray-600">
              🤖 <strong>{t('maintenance.alert.ai')}</strong>
            </div>
            <p className="text-xs text-gray-700 mt-1">
              {t('maintenance.alert.ai.desc')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 维修人员专用：提交维护证明 */}
      {isMaintainer && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Wrench className="w-5 h-5" />
              {t('maintenance.submit.title')}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {t('maintenance.submit.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maintenanceDevice">{t('maintenance.device.label')}</Label>
                <Input
                  id="maintenanceDevice"
                  placeholder={t('maintenance.device.placeholder')}
                  value={maintenanceDeviceId}
                  onChange={(e) => setMaintenanceDeviceId(e.target.value)}
                />
              </div>

              <div>
                <Label>{t('maintenance.proof.label')}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleFileSelect}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {proofFile ? t('maintenance.proof.selected') : t('maintenance.proof.select')}
                  </Button>
                </div>
                {proofFile && (
                  <p className="text-xs text-gray-600 mt-2">
                    📄 {proofFile}
                  </p>
                )}
              </div>

              <Button
                onClick={submitMaintenanceProof}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? t('maintenance.submitting') : t('maintenance.submit.button')}
              </Button>

              <p className="text-xs text-gray-500">
                💡 {t('maintenance.submit.hint')} <code className="bg-white px-1 py-0.5 rounded">submitMaintenanceProof()</code> {t('maintenance.submit.function')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 设备所有者专用：维修指南 */}
      {isOwner && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">
              {language === 'zh' ? '💡 设备所有者须知' : '💡 Owner Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-2">
                <span>1️⃣</span>
                <span>
                  {language === 'zh' 
                    ? '当设备健康度低于50时，系统会自动发出预警' 
                    : 'System alerts when device health score falls below 50'}
                </span>
              </div>
              <div className="flex gap-2">
                <span>2️⃣</span>
                <span>
                  {language === 'zh' 
                    ? '使用上方显示的联系方式联系指派的维修人员' 
                    : 'Contact assigned maintainer using info shown above'}
                </span>
              </div>
              <div className="flex gap-2">
                <span>3️⃣</span>
                <span>
                  {language === 'zh' 
                    ? '维修人员将查看设备详细数据并现场维修' 
                    : 'Maintainer will review device data and perform on-site repair'}
                </span>
              </div>
              <div className="flex gap-2">
                <span>4️⃣</span>
                <span>
                  {language === 'zh' 
                    ? '维修完成后，维修人员会上传维护证明到区块链' 
                    : 'After repair, maintainer uploads proof to blockchain'}
                </span>
              </div>
              <div className="flex gap-2">
                <span>5️⃣</span>
                <span>
                  {language === 'zh' 
                    ? '您可以在维护历史中查看所有完成的维修记录' 
                    : 'View all completed repairs in maintenance history'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('maintenance.history.title')}</CardTitle>
          <CardDescription>
            {t('maintenance.history.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.filter(a => a.status === 'resolved').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('maintenance.history.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.filter(a => a.status === 'resolved').map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-gray-900">
                        {alert.deviceName} ({alert.deviceId})
                      </div>
                      <div className="text-sm text-gray-600">{alert.issue}</div>
                      {isMaintainer && (
                        <div className="text-xs text-gray-500 mt-1">
                          {language === 'zh' ? '维修时间：' : 'Repair time: '}2025-11-13 14:30
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {t('maintenance.history.resolved')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="text-sm text-gray-900 mb-3">💡 {t('maintenance.workflow.title')}</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex gap-2">
              <span>1️⃣</span>
              <span>{t('maintenance.workflow.step1')}</span>
            </div>
            <div className="flex gap-2">
              <span>2️⃣</span>
              <span>{t('maintenance.workflow.step2')}</span>
            </div>
            <div className="flex gap-2">
              <span>3️⃣</span>
              <span>{t('maintenance.workflow.step3')}</span>
            </div>
            <div className="flex gap-2">
              <span>4️⃣</span>
              <span>{t('maintenance.workflow.step4')}</span>
            </div>
            <div className="flex gap-2">
              <span>5️⃣</span>
              <span>{t('maintenance.workflow.step5')}</span>
            </div>
          </div>

          {isMaintainer && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-2">
                📊 <strong>{t('maintenance.query.title')}</strong>
              </div>
              <pre className="text-xs text-gray-700 overflow-x-auto">
{`query {
  devices(where: { healthScore_lt: 50 }) {
    id
    healthScore
    owner
    lastMaintenance
  }
}`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 设备详情对话框 */}
      <Dialog open={showDecryptDialog} onOpenChange={closeDecryptDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {language === 'zh' ? '设备详情' : 'Device Details'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {language === 'zh' ? '查看设备的详细信息' : 'View detailed information about the device'}
            </DialogDescription>
          </DialogHeader>
          <CardContent className="space-y-4">
            {isDecrypting ? (
              <div className="text-center py-8">
                <Activity className="w-10 h-10 mx-auto mb-2 animate-spin text-purple-600" />
                <p className="text-gray-600">
                  {language === 'zh' ? '🔓 正在解密设备数据...' : '🔓 Decrypting device data...'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'zh' ? '使用RSA私钥解密AES密钥...' : 'Using RSA private key to decrypt AES key...'}
                </p>
              </div>
            ) : (
              <>
                {selectedDevice && (
                  <div className="space-y-4">
                    {/* 基本信息 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '设备ID' : 'Device ID'}
                        </div>
                        <div className="text-sm text-gray-900">
                          {selectedDevice.deviceId}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '设备类型' : 'Device Type'}
                        </div>
                        <div className="text-sm text-gray-900">
                          {selectedDevice.deviceType}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '容量' : 'Capacity'}
                        </div>
                        <div className="text-sm text-gray-900">
                          {selectedDevice.capacity}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '健康评分' : 'Health Score'}
                        </div>
                        <div className="text-sm text-gray-900">
                          <Badge className={getHealthScoreColor(selectedDevice.healthScore)}>
                            {selectedDevice.healthScore}%
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '所有者' : 'Owner'}
                        </div>
                        <div className="text-xs text-gray-900 font-mono">
                          {selectedDevice.owner.slice(0, 10)}...{selectedDevice.owner.slice(-8)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">
                          {language === 'zh' ? '注册时间' : 'Registration Time'}
                        </div>
                        <div className="text-sm text-gray-900">
                          {selectedDevice.registrationTime}
                        </div>
                      </div>
                    </div>

                    {/* 解密后的敏感数据 */}
                    {(decryptedData.photo || decryptedData.gps) && (
                      <div className="border-t pt-4">
                        <div className="text-sm text-gray-900 mb-3">
                          🔓 <strong>{language === 'zh' ? '解密后的敏感数据' : 'Decrypted Sensitive Data'}</strong>
                        </div>
                        
                        {/* 设备照片 */}
                        {decryptedData.photo && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              {language === 'zh' ? '设备照片' : 'Device Photo'}
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <img 
                                src={decryptedData.photo} 
                                alt="Device" 
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* GPS位置 */}
                        {decryptedData.gps && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {language === 'zh' ? 'GPS位置' : 'GPS Location'}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border">
                              <div className="text-sm text-gray-900 mb-2">
                                {decryptedData.gps.address || `${decryptedData.gps.lat}, ${decryptedData.gps.lng}`}
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${decryptedData.gps.lat},${decryptedData.gps.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                📍 {language === 'zh' ? '在Google地图中打开' : 'Open in Google Maps'}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* IPFS信息 */}
                    <div className="border-t pt-4">
                      <div className="text-xs text-gray-500 mb-1">
                        {language === 'zh' ? 'IPFS存储哈希' : 'IPFS Storage Hash'}
                      </div>
                      <div className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                        {selectedDevice.ipfsHash}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}