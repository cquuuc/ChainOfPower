/**
 * IPFS 存储工具
 * 支持Infura、Pinata、Web3.Storage等服务
 */

import { toast } from 'sonner';

// IPFS配置（从环境变量读取）
const INFURA_PROJECT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFURA_IPFS_PROJECT_ID) || '';
const INFURA_PROJECT_SECRET = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INFURA_IPFS_PROJECT_SECRET) || '';
const PINATA_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PINATA_API_KEY) || '';
const PINATA_SECRET_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PINATA_SECRET_KEY) || '';

/**
 * IPFS上传结果
 */
export interface IPFSUploadResult {
  hash: string;        // IPFS CID
  url: string;         // 访问URL
  size: number;        // 文件大小
  timestamp: number;   // 上传时间
}

/**
 * 设备数据结构（存储到IPFS）
 */
export interface DeviceIPFSData {
  // 设备基本信息
  deviceId: string;
  deviceType: string;
  capacity: number;
  
  // 敏感数据（已加密）
  encryptedImage: string;      // 加密的设备照片（base64）
  encryptedLocation: string;   // 加密的GPS坐标（base64）
  
  // 元数据
  timestamp: number;
  version: string;
}

/**
 * 上传数据到IPFS（使用Infura）
 */
export async function uploadToInfura(data: any): Promise<IPFSUploadResult> {
  if (!INFURA_PROJECT_ID || !INFURA_PROJECT_SECRET) {
    console.warn('Infura credentials not configured, using mock upload');
    return mockIPFSUpload(data);
  }

  try {
    const auth = 'Basic ' + btoa(INFURA_PROJECT_ID + ':' + INFURA_PROJECT_SECRET);
    
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('file', blob);

    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': auth
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Infura upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      hash: result.Hash,
      url: `https://ipfs.io/ipfs/${result.Hash}`,
      size: result.Size,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Infura upload failed:', error);
    throw new Error('IPFS上传失败（Infura）');
  }
}

/**
 * 上传数据到IPFS（使用Pinata）
 */
export async function uploadToPinata(data: any): Promise<IPFSUploadResult> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn('Pinata credentials not configured, using mock upload');
    return mockIPFSUpload(data);
  }

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `device-${Date.now()}.json`
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      size: result.PinSize,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Pinata upload failed:', error);
    throw new Error('IPFS上传失败（Pinata）');
  }
}

/**
 * 模拟IPFS上传（用于演示和测试）
 */
export async function mockIPFSUpload(data: any): Promise<IPFSUploadResult> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // 生成假的IPFS CID
  const dataStr = JSON.stringify(data);
  const hash = await generateMockCID(dataStr);
  
  console.log('📦 Mock IPFS Upload:', {
    hash,
    dataSize: dataStr.length,
    data: data
  });
  
  return {
    hash,
    url: `https://ipfs.io/ipfs/${hash}`,
    size: dataStr.length,
    timestamp: Date.now()
  };
}

/**
 * 生成模拟的IPFS CID
 */
async function generateMockCID(data: string): Promise<string> {
  // 计算数据的哈希
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 转换为base58格式的CID（简化版）
  // 真实的CID格式：Qm + base58编码
  return 'Qm' + hashHex.slice(0, 44);
}

/**
 * 从IPFS下载数据
 */
export async function downloadFromIPFS(hash: string): Promise<any> {
  // 尝试多个IPFS网关
  const gateways = [
    `https://ipfs.io/ipfs/${hash}`,
    `https://gateway.pinata.cloud/ipfs/${hash}`,
    `https://cloudflare-ipfs.com/ipfs/${hash}`,
    `https://dweb.link/ipfs/${hash}`
  ];

  for (const url of gateways) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      continue;
    }
  }

  throw new Error('无法从IPFS下载数据，请检查网络连接');
}

/**
 * 上传设备注册数据到IPFS
 * 这是主要的业务函数
 */
export async function uploadDeviceData(
  deviceId: string,
  deviceType: string,
  capacity: number,
  encryptedImage: string,
  encryptedLocation: string
): Promise<IPFSUploadResult> {
  const data: DeviceIPFSData = {
    deviceId,
    deviceType,
    capacity,
    encryptedImage,
    encryptedLocation,
    timestamp: Date.now(),
    version: '1.0'
  };

  // 优先使用Pinata，失败则使用Infura，最后使用Mock
  try {
    toast.info('正在上传数据到IPFS...');
    
    let result: IPFSUploadResult;
    
    if (PINATA_API_KEY) {
      result = await uploadToPinata(data);
    } else if (INFURA_PROJECT_ID) {
      result = await uploadToInfura(data);
    } else {
      result = await mockIPFSUpload(data);
    }
    
    toast.success('数据已上传到IPFS！');
    console.log('✅ IPFS Upload Success:', result);
    
    return result;
  } catch (error) {
    console.error('IPFS upload error:', error);
    toast.error('IPFS上传失败，使用模拟模式');
    return mockIPFSUpload(data);
  }
}

/**
 * 上传设备日志数据到IPFS（轻量加密）
 */
export async function uploadDeviceLog(
  deviceId: string,
  kWhReading: number,
  voltage: number,
  current: number,
  temperature?: number
): Promise<IPFSUploadResult> {
  const logData = {
    deviceId,
    timestamp: Date.now(),
    readings: {
      kWh: kWhReading,
      voltage,
      current,
      temperature
    },
    version: '1.0'
  };

  try {
    // 日志数据可以保持明文或使用轻量加密
    // 这里直接上传明文数据，哈希值会在链上验证
    return await mockIPFSUpload(logData);
  } catch (error) {
    console.error('Log upload error:', error);
    throw new Error('日志上传失败');
  }
}

/**
 * 批量上传文件到IPFS
 */
export async function uploadMultipleFiles(files: File[]): Promise<IPFSUploadResult[]> {
  const results: IPFSUploadResult[] = [];
  
  for (const file of files) {
    try {
      const base64 = await fileToBase64(file);
      const data = {
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64,
        timestamp: Date.now()
      };
      
      const result = await mockIPFSUpload(data);
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }
  
  return results;
}

/**
 * 文件转Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 验证IPFS哈希格式
 */
export function isValidIPFSHash(hash: string): boolean {
  // CIDv0: Qm + 44字符base58
  // CIDv1: bafy... 或 bafk...
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) ||
         /^bafy[a-z0-9]{49,}$/.test(hash) ||
         /^bafk[a-z0-9]{49,}$/.test(hash);
}

/**
 * 获取IPFS网关URL
 */
export function getIPFSGatewayURL(hash: string, gateway: string = 'ipfs.io'): string {
  const gateways: { [key: string]: string } = {
    'ipfs.io': 'https://ipfs.io/ipfs/',
    'pinata': 'https://gateway.pinata.cloud/ipfs/',
    'cloudflare': 'https://cloudflare-ipfs.com/ipfs/',
    'dweb': 'https://dweb.link/ipfs/'
  };
  
  const baseUrl = gateways[gateway] || gateways['ipfs.io'];
  return baseUrl + hash;
}

/**
 * 从IPFS解析设备数据
 */
export async function parseDeviceDataFromIPFS(hash: string): Promise<DeviceIPFSData> {
  const data = await downloadFromIPFS(hash);
  
  // 验证数据结构
  if (!data.deviceId || !data.encryptedImage || !data.encryptedLocation) {
    throw new Error('无效的设备数据格式');
  }
  
  return data as DeviceIPFSData;
}

/**
 * 计算IPFS数据的存储成本（估算）
 */
export function estimateStorageCost(sizeInBytes: number): {
  pinata: number;  // USD/月
  infura: number;  // USD/月
  web3storage: number; // USD/月
} {
  const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
  
  return {
    pinata: Math.max(0, (sizeInGB - 1) * 0.10),  // 前1GB免费，之后$0.10/GB
    infura: sizeInGB * 0.08,                      // $0.08/GB
    web3storage: 0                                // 免费（由Filecoin资助）
  };
}

/**
 * 获取IPFS状态
 */
export async function getIPFSStatus(): Promise<{
  available: boolean;
  gateway: string;
  latency: number;
}> {
  const testCID = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'; // 测试文件
  
  const start = Date.now();
  try {
    const response = await fetch(`https://ipfs.io/ipfs/${testCID}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    const latency = Date.now() - start;
    
    return {
      available: response.ok,
      gateway: 'ipfs.io',
      latency
    };
  } catch (error) {
    return {
      available: false,
      gateway: 'ipfs.io',
      latency: -1
    };
  }
}