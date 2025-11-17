import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Upload, Activity, CheckCircle, AlertCircle, Camera, MapPin, Lock, FileUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../contexts/RoleContext';
import { BLOCKCHAIN_CONFIG } from '../config/constants';
import { 
  generateAESKey, 
  encryptWithAES, 
  encryptKeyWithRSA, 
  calculateHash,
  fileToBase64,
  compressImage,
  getMaintainerPublicKey
} from '../utils/encryption';
import { uploadDeviceData, uploadDeviceLog } from '../utils/ipfs';
import { getCurrentLocation, formatCoordinates } from '../utils/geolocation';

interface Device {
  id: string;
  name: string;
  status: 'good' | 'warning' | 'error';
  lastReading: number;
  registeredAt: string;
  ipfsHash?: string;
  dataHash?: string;
}

interface DeviceManagementProps {
  walletAddress: string;
}

export function DeviceManagement({ walletAddress }: DeviceManagementProps) {
  const { t } = useLanguage();
  const { role } = useRole();
  const [devices, setDevices] = useState<Device[]>([
    { id: 'DG-001', name: t('device.status.good') + ' A', status: 'good', lastReading: 125.5, registeredAt: '2025-01-10' },
    { id: 'DG-002', name: t('device.status.good') + ' B', status: 'warning', lastReading: 89.3, registeredAt: '2025-01-08' },
  ]);
  
  // 注册设备表单
  const [newDeviceId, setNewDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState('Solar Panel');
  const [capacity, setCapacity] = useState('');
  const [maintainerAddress, setMaintainerAddress] = useState(BLOCKCHAIN_CONFIG.TEST_ACCOUNTS.MAINTAINER_1);
  const [devicePhoto, setDevicePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showManualGPS, setShowManualGPS] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // 上报数据表单
  const [selectedDevice, setSelectedDevice] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [voltage, setVoltage] = useState('230');
  const [current, setCurrent] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 处理照片上传
   */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      // 压缩图片
      toast.info('正在压缩图片...');
      const compressedBlob = await compressImage(file, 1920, 1080, 0.8);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

      setDevicePhoto(compressedFile);

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);

      toast.success('图片已选择并压缩');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('图片处理失败');
    }
  };

  /**
   * 获取GPS定位
   */
  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      toast.info('正在获取GPS定位...');
      const coords = await getCurrentLocation();
      
      setGpsCoords({
        lat: coords.latitude,
        lng: coords.longitude
      });

      toast.success(`定位成功：${formatCoordinates(coords)}`, {
        description: `精度: ±${coords.accuracy.toFixed(0)}米`
      });
    } catch (error) {
      console.error('Location error:', error);
      const errorMessage = (error as Error).message || '获取定位失败';
      
      toast.error(errorMessage, {
        description: '您可以选择"手动输入"或"使用模拟坐标"',
        duration: 5000
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  /**
   * 使用手动输入的GPS坐标
   */
  const useManualGPS = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    // 验证坐标有效性
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('请输入有效的经纬度');
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error('纬度范围应在 -90 到 90 之间');
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error('经度范围应在 -180 到 180 之间');
      return;
    }

    setGpsCoords({ lat, lng });
    setShowManualGPS(false);
    toast.success(`已设置GPS坐标：${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  /**
   * 使用模拟GPS坐标（用于演示）
   */
  const useMockGPS = () => {
    // 使用深圳南山区的模拟坐标
    const mockCoords = {
      lat: 22.547856,
      lng: 114.062996
    };
    
    setGpsCoords(mockCoords);
    toast.success('已使用模拟GPS坐标（深圳南山区）', {
      description: '仅用于演示，加密后存储'
    });
  };

  /**
   * 注册设备（完整加密流程）
   */
  const registerDevice = async () => {
    // 表单验证
    if (!newDeviceId || !capacity || !devicePhoto || !gpsCoords) {
      toast.error('请填写完整信息并上传照片、获取定位');
      return;
    }

    setIsRegistering(true);

    try {
      toast.info('步骤 1/5: 生成AES密钥...');
      
      // 1. 生成AES密钥
      const aesKey = generateAESKey();
      console.log('✅ AES Key generated:', aesKey.slice(0, 16) + '...');

      // 2. 加密敏感数据
      toast.info('步骤 2/5: 加密敏感数据...');
      
      // 加密照片
      const photoBase64 = await fileToBase64(devicePhoto);
      const encryptedPhoto = await encryptWithAES(photoBase64, aesKey);
      
      // 加密GPS坐标
      const locationData = {
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        timestamp: Date.now()
      };
      const encryptedLocation = await encryptWithAES(locationData, aesKey);
      
      console.log('✅ Sensitive data encrypted');

      // 3. 用维修人员公钥加密AES密钥
      toast.info('步骤 3/5: 加密AES密钥...');
      const maintainerPubKey = await getMaintainerPublicKey(maintainerAddress);
      const encryptedAESKey = await encryptKeyWithRSA(aesKey, maintainerPubKey);
      console.log('✅ AES key encrypted with maintainer public key');

      // 4. 上传到IPFS
      toast.info('步骤 4/5: 上传到IPFS...');
      const ipfsResult = await uploadDeviceData(
        newDeviceId,
        deviceType,
        parseInt(capacity),
        encryptedPhoto,
        encryptedLocation
      );
      console.log('✅ IPFS Upload:', ipfsResult);

      // 5. 计算数据哈希
      const deviceData = {
        deviceId: newDeviceId,
        deviceType,
        capacity: parseInt(capacity),
        maintainer: maintainerAddress,
        ipfsHash: ipfsResult.hash,
        timestamp: Date.now()
      };
      const dataHash = calculateHash(deviceData);
      console.log('✅ Data hash:', dataHash);

      // 6. 调用智能合约（模拟）
      toast.info('步骤 5/5: 提交到区块链...');
      
      // 这里应该调用真实的智能合
      // await contract.registerDevice(
      //   newDeviceId,
      //   deviceType,
      //   parseInt(capacity),
      //   maintainerAddress,
      //   ipfsResult.hash,
      //   encryptedAESKey,
      //   dataHash
      // );
      
      // 模拟交易确认
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 7. 更新本地状态
      const newDevice: Device = {
        id: newDeviceId,
        name: `${deviceType} ${String.fromCharCode(65 + devices.length)}`,
        status: 'good',
        lastReading: 0,
        registeredAt: new Date().toISOString().split('T')[0],
        ipfsHash: ipfsResult.hash,
        dataHash
      };
      
      setDevices([...devices, newDevice]);
      
      // 重置表单
      setNewDeviceId('');
      setCapacity('');
      setDevicePhoto(null);
      setPhotoPreview('');
      setGpsCoords(null);
      
      toast.success('设备注册成功！', {
        description: `${newDeviceId} 已上链，IPFS: ${ipfsResult.hash.slice(0, 12)}...`
      });

      // 显示详细信息
      console.log('🎉 Device Registered:', {
        deviceId: newDeviceId,
        ipfsHash: ipfsResult.hash,
        dataHash,
        encryptedAESKey: encryptedAESKey.slice(0, 32) + '...',
        maintainer: maintainerAddress
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error((error as Error).message || '注册失败');
    } finally {
      setIsRegistering(false);
    }
  };

  /**
   * 提交设备读数
   */
  const submitReading = async () => {
    if (!selectedDevice || !meterReading) {
      toast.error(t('device.select.required'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      toast.info('正在上传数据到IPFS...');

      // 1. 上传日志数据到IPFS（明文或轻量加密）
      const ipfsResult = await uploadDeviceLog(
        selectedDevice,
        parseFloat(meterReading),
        parseFloat(voltage),
        parseFloat(current)
      );

      // 2. 计算数据哈希
      const logData = {
        deviceId: selectedDevice,
        kWhReading: parseFloat(meterReading),
        voltage: parseFloat(voltage),
        current: parseFloat(current),
        timestamp: Date.now()
      };
      const logHash = calculateHash(logData);

      toast.info('正在提交到区块链...');

      // 3. 调用智能合约（模拟）
      // await contract.submitDeviceData(
      //   selectedDevice,
      //   parseFloat(meterReading),
      //   parseFloat(voltage),
      //   parseFloat(current),
      //   ipfsResult.hash,
      //   logHash
      // );

      // 模拟交易确认
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. 更新本地状态
      const updatedDevices = devices.map(device => 
        device.id === selectedDevice 
          ? { ...device, lastReading: parseFloat(meterReading) }
          : device
      );
      
      setDevices(updatedDevices);
      setMeterReading('');
      
      toast.success(t('device.submit.success'), {
        description: `IPFS: ${ipfsResult.hash.slice(0, 12)}..., Hash: ${logHash.slice(0, 12)}...`
      });

      console.log('✅ Data Submitted:', {
        deviceId: selectedDevice,
        ipfsHash: ipfsResult.hash,
        dataHash: logHash,
        readings: { kWh: meterReading, voltage, current }
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error((error as Error).message || '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'good':
        return { icon: CheckCircle, text: t('device.status.good'), color: 'bg-green-100 text-green-800' };
      case 'warning':
        return { icon: AlertCircle, text: t('device.status.warning'), color: 'bg-yellow-100 text-yellow-800' };
      case 'error':
        return { icon: AlertCircle, text: t('device.status.error'), color: 'bg-red-100 text-red-800' };
      default:
        return { icon: Activity, text: t('device.status.unknown'), color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Register New Device */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('device.register.title')}
          </CardTitle>
          <CardDescription>
            {t('device.register.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 设备ID */}
            <div>
              <Label htmlFor="deviceId">{t('device.id.label')}</Label>
              <Input
                id="deviceId"
                placeholder={t('device.id.placeholder')}
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
              />
            </div>

            {/* 设备类型和容量 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="deviceType">设备类型</Label>
                <select
                  id="deviceType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                >
                  <option value="Solar Panel">太阳能板</option>
                  <option value="Wind Turbine">风力涡轮机</option>
                  <option value="Battery Storage">储能电池</option>
                  <option value="Generator">发电机</option>
                </select>
              </div>
              <div>
                <Label htmlFor="capacity">设备容量 (kWh)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="5000"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            </div>

            {/* 维修人员地址 */}
            <div>
              <Label htmlFor="maintainerAddress">指派维修人员地址</Label>
              <Input
                id="maintainerAddress"
                placeholder="0x..."
                value={maintainerAddress}
                onChange={(e) => setMaintainerAddress(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                维修人员的以太坊地址，用于加密敏感数据
              </p>
            </div>

            {/* 设备照片上传 */}
            <div>
              <Label htmlFor="devicePhoto">
                <Camera className="w-4 h-4 inline mr-1" />
                设备照片（将被加密）
              </Label>
              <div className="mt-2">
                <input
                  id="devicePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label htmlFor="devicePhoto">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                    {photoPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-gray-600">
                          <Lock className="w-3 h-3 inline" /> 将被AES加密后上传到IPFS
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-12 h-12 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">点击上传设备照片</p>
                        <p className="text-xs text-gray-500">支持 JPG, PNG（最大5MB）</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* GPS定位 */}
            <div>
              <Label>
                <MapPin className="w-4 h-4 inline mr-1" />
                GPS坐标（将被加密）
              </Label>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                  className="flex-1"
                >
                  {isGettingLocation ? (
                    <>定位中...</>
                  ) : gpsCoords ? (
                    <>
                      ✓ {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      获取当前位置
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualGPS(!showManualGPS)}
                >
                  {showManualGPS ? '隐藏手动输入' : '手动输入'}
                </Button>
              </div>
              {gpsCoords && (
                <p className="text-xs text-gray-500 mt-1">
                  <Lock className="w-3 h-3 inline" /> 坐标将被AES加密，只有维修人员能解密查看
                </p>
              )}
              {showManualGPS && (
                <div className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="manualLat">纬度 (Lat)</Label>
                      <Input
                        id="manualLat"
                        type="number"
                        step="0.000001"
                        placeholder="22.547856"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="manualLng">经度 (Lng)</Label>
                      <Input
                        id="manualLng"
                        type="number"
                        step="0.000001"
                        placeholder="114.062996"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useManualGPS}
                      disabled={!manualLat || !manualLng}
                      className="flex-1"
                    >
                      ✓ 使用手动输入的坐标
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useMockGPS}
                      className="flex-1"
                    >
                      🎭 使用模拟坐标（演示）
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 模拟坐标: 深圳南山区 (22.547856, 114.062996)
                  </p>
                </div>
              )}
              {!showManualGPS && !gpsCoords && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={useMockGPS}
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    🎭 或使用模拟GPS坐标（快速演示）
                  </Button>
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <Button 
              onClick={registerDevice}
              disabled={isRegistering || !devicePhoto || !gpsCoords}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isRegistering ? (
                <>🔄 注册中...</>
              ) : (
                <>
                  <FileUp className="w-4 h-4 mr-2" />
                  加密并上链注册设备
                </>
              )}
            </Button>

            {/* 说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900 mb-2">🔐 <strong>分层加密流程：</strong></p>
              <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                <li>生成随机AES-256密钥</li>
                <li>用AES加密照片和GPS坐标</li>
                <li>用维修人员RSA公钥加密AES密钥</li>
                <li>加密数据上传到IPFS</li>
                <li>IPFS哈希和数据哈希上链</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Meter Reading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('device.submit.title')}
          </CardTitle>
          <CardDescription>
            {t('device.submit.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label htmlFor="selectDevice">{t('device.select.label')}</Label>
              <select
                id="selectDevice"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                <option value="">{t('device.select.placeholder')}</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.id})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="meterReading">{t('device.reading.label')}</Label>
                <Input
                  id="meterReading"
                  type="number"
                  placeholder="250"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="voltage">电压 (V)</Label>
                <Input
                  id="voltage"
                  type="number"
                  placeholder="230"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="current">电流 (A)</Label>
                <Input
                  id="current"
                  type="number"
                  placeholder="10"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={submitReading}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? t('device.submitting') : t('device.submit.button')}
            </Button>
            
            <p className="text-xs text-gray-500">
              💡 数据明文存储到IPFS，计算哈希值上链保证完整性
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('device.list.title')}</CardTitle>
          <CardDescription>
            {t('device.list.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('device.list.empty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map(device => {
                const statusInfo = getStatusInfo(device.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-gray-900">{device.name}</div>
                        <div className="text-sm text-gray-500">ID: {device.id}</div>
                        {device.ipfsHash && (
                          <div className="text-xs text-blue-600 mt-1">
                            <Lock className="w-3 h-3 inline" /> IPFS: {device.ipfsHash.slice(0, 12)}...
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{t('device.latest.reading')}</div>
                        <div className="text-gray-900">{device.lastReading} kWh</div>
                      </div>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.text}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}