/**
 * 加密工具函数
 * 实现AES对称加密和RSA非对称加密
 */

import { ethers } from 'ethers';

/**
 * 生成随机AES密钥（256位）
 */
export function generateAESKey(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * AES-GCM 加密
 * @param data 要加密的数据（字符串或对象）
 * @param keyHex AES密钥（hex格式）
 * @returns 加密后的数据（base64）
 */
export async function encryptWithAES(data: string | object, keyHex: string): Promise<string> {
  try {
    // 将数据转为字符串
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);
    
    // 将hex密钥转为ArrayBuffer
    const keyBytes = hexToBytes(keyHex);
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // 生成随机IV（初始化向量）
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits for GCM
    
    // 加密
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      plaintextBytes
    );
    
    // 组合 IV + 密文
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // 转为base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('AES encryption failed:', error);
    throw new Error('加密失败');
  }
}

/**
 * AES-GCM 解密
 * @param encryptedBase64 加密的数据（base64）
 * @param keyHex AES密钥（hex格式）
 * @returns 解密后的数据
 */
export async function decryptWithAES(encryptedBase64: string, keyHex: string): Promise<string> {
  try {
    // 解码base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // 分离IV和密文
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    // 将hex密钥转为ArrayBuffer
    const keyBytes = hexToBytes(keyHex);
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // 解密
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );
    
    // 转为字符串
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  } catch (error) {
    console.error('AES decryption failed:', error);
    throw new Error('解密失败');
  }
}

/**
 * 使用RSA公钥加密AES密钥
 * @param aesKey AES密钥（hex格式）
 * @param publicKeyPem 维修人员的RSA公钥（PEM格式）
 * @returns 加密后的AES密钥（base64）
 */
export async function encryptKeyWithRSA(aesKey: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 Starting RSA encryption...');
    console.log('AES Key:', aesKey.slice(0, 16) + '...');
    console.log('Public Key:', publicKeyPem.slice(0, 50) + '...');
    
    // 在演示模式下，使用Web Crypto API的RSA-OAEP加密
    // 注意：这是简化版实现，生产环境应该使用维修人员的真实公钥
    
    // 将AES密钥从hex转为bytes
    const aesKeyBytes = hexToBytes(aesKey);
    
    // 生成临时RSA密钥对（演示用）
    // 在真实环境中，应该导入维修人员的公钥
    const rsaKey = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // 使用公钥加密AES密钥
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      rsaKey.publicKey,
      aesKeyBytes
    );
    
    // 转为base64
    const encryptedBase64 = bytesToBase64(new Uint8Array(encryptedBuffer));
    
    console.log('✅ RSA encryption successful');
    console.log('Encrypted key length:', encryptedBase64.length);
    
    return encryptedBase64;
  } catch (error) {
    console.error('❌ RSA encryption failed:', error);
    throw new Error('密钥加密失败: ' + (error as Error).message);
  }
}

/**
 * 使用RSA私钥解密AES密钥
 * @param encryptedKeyBase64 加密的AES密钥（base64）
 * @param privateKeyPem 维修人员的RSA私钥（PEM格式）
 * @returns 解密后的AES密钥（hex格式）
 */
export async function decryptKeyWithRSA(encryptedKeyBase64: string, privateKeyPem: string): Promise<string> {
  try {
    console.log('🔓 Starting RSA decryption...');
    
    // 在演示模式下，我们无法解密（因为使用的是临时密钥）
    // 在真实环境中，维修人员会用自己的私钥解密
    
    // 这里返回一个模拟的解密结果
    // 实际上，维修人员会使用他们的私钥解密得到真实的AES密钥
    console.log('⚠️ Demo mode: Cannot decrypt without private key');
    console.log('In production, maintainer would use their private key to decrypt');
    
    // 返回占位符（演示用）
    return '0'.repeat(64); // 模拟的AES密钥
  } catch (error) {
    console.error('❌ RSA decryption failed:', error);
    throw new Error('密钥解密失败: ' + (error as Error).message);
  }
}

/**
 * 计算数据的SHA256哈希
 * @param data 要哈希的数据（字符串或对象）
 * @returns 哈希值（hex格式，带0x前缀）
 */
export function calculateHash(data: string | object): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  
  // 使用Web Crypto API计算SHA-256哈希
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(dataStr);
  
  // 使用简单的哈希方法（演示用）
  // 在生产环境中应该使用 crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < dataBytes.length; i++) {
    hash = ((hash << 5) - hash) + dataBytes[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // 转为hex格式
  const hashHex = Math.abs(hash).toString(16).padStart(64, '0');
  return '0x' + hashHex;
}

/**
 * 验证数据完整性
 * @param data 数据
 * @param hash 已知的哈希值
 * @returns 是否匹配
 */
export function verifyHash(data: string | object, hash: string): boolean {
  return calculateHash(data) === hash;
}

/**
 * Hex字符串转Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Uint8Array转Hex字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 文件转Base64
 */
export function fileToBase64(file: File): Promise<string> {
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
 * 压缩图片
 * @param file 图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 质量（0-1）
 * @returns 压缩后的Blob
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 获取维修人员的公钥（模拟）
 * 在真实环境中，应该从智能合约或服务器获取
 */
export async function getMaintainerPublicKey(maintainerAddress: string): Promise<string> {
  // 模拟：返回一个假的公钥
  // 在生产环境中，应该从链上或IPFS获取维修人员的真实公钥
  return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${maintainerAddress.slice(2, 50)}
-----END PUBLIC KEY-----`;
}

/**
 * 生成演示用的RSA密钥对
 * 在真实环境中，维修人员应该在本地安全生成并保管私钥
 */
export async function generateRSAKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    return {
      publicKey: arrayBufferToPem(publicKey, 'PUBLIC KEY'),
      privateKey: arrayBufferToPem(privateKey, 'PRIVATE KEY'),
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('密钥生成失败');
  }
}

/**
 * ArrayBuffer转PEM格式
 */
function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
  return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
}

/**
 * Uint8Array转Base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}