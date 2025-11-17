/**
 * 地理定位工具
 * 获取设备当前GPS坐标
 */

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;        // 精度（米）
  altitude?: number;       // 海拔（米）
  heading?: number;        // 方向（度）
  speed?: number;          // 速度（米/秒）
  timestamp: number;
}

export interface Address {
  country: string;
  province: string;
  city: string;
  district: string;
  street: string;
  fullAddress: string;
}

/**
 * 获取当前GPS坐标
 */
export function getCurrentLocation(): Promise<GPSCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('您的浏览器不支持地理定位'));
      return;
    }

    const options = {
      enableHighAccuracy: true,  // 启用高精度
      timeout: 10000,            // 10秒超时
      maximumAge: 0              // 不使用缓存
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GPSCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };
        resolve(coords);
      },
      (error) => {
        let message = '获取位置失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '用户拒绝了地理定位请求';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '位置信息不可用';
            break;
          case error.TIMEOUT:
            message = '获取位置超时';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
}

/**
 * 监听位置变化
 */
export function watchLocation(
  callback: (coords: GPSCoordinates) => void,
  errorCallback?: (error: Error) => void
): number {
  if (!navigator.geolocation) {
    errorCallback?.(new Error('浏览器不支持地理定位'));
    return -1;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      });
    },
    (error) => {
      errorCallback?.(new Error(error.message));
    },
    options
  );
}

/**
 * 停止监听位置
 */
export function stopWatchingLocation(watchId: number): void {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * 反向地理编码：将GPS坐标转换为地址（使用高德地图API）
 * 需要配置高德地图API Key
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Address> {
  const AMAP_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AMAP_API_KEY) || '';
  
  if (!AMAP_KEY) {
    // 如果没有配置API Key，返回模拟地址
    return getMockAddress(latitude, longitude);
  }

  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${longitude},${latitude}&extensions=base`
    );

    if (!response.ok) {
      throw new Error('地理编码请求失败');
    }

    const data = await response.json();

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      return {
        country: addressComponent.country || '中国',
        province: addressComponent.province || '',
        city: addressComponent.city || addressComponent.province || '',
        district: addressComponent.district || '',
        street: addressComponent.township + addressComponent.street || '',
        fullAddress: data.regeocode.formatted_address
      };
    } else {
      throw new Error('无法解析地址');
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return getMockAddress(latitude, longitude);
  }
}

/**
 * 生成模拟地址（用于演示）
 */
function getMockAddress(latitude: number, longitude: number): Address {
  // 根据大致经纬度范围判断可能的地区
  const addresses = [
    {
      country: '中国',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      street: '科技园南区',
      fullAddress: '广东省深圳市南山区科技园南区'
    },
    {
      country: '中国',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '中关村大街',
      fullAddress: '北京市海淀区中关村大街'
    },
    {
      country: '中国',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      street: '张江高科技园区',
      fullAddress: '上海市浦东新区张江高科技园区'
    }
  ];

  // 简单的区域判断
  let addressIndex = 0;
  if (latitude > 39 && latitude < 41 && longitude > 116 && longitude < 117) {
    addressIndex = 1; // 北京
  } else if (latitude > 30 && latitude < 32 && longitude > 121 && longitude < 122) {
    addressIndex = 2; // 上海
  }

  return addresses[addressIndex];
}

/**
 * 计算两个GPS坐标之间的距离（米）
 * 使用Haversine公式
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距离（米）
}

/**
 * 格式化GPS坐标为字符串
 */
export function formatCoordinates(coords: GPSCoordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * 将GPS坐标转换为地图URL
 */
export function getMapURL(
  latitude: number,
  longitude: number,
  provider: 'google' | 'amap' | 'baidu' = 'amap'
): string {
  switch (provider) {
    case 'google':
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    case 'amap':
      return `https://uri.amap.com/marker?position=${longitude},${latitude}`;
    case 'baidu':
      const bd_coords = wgs84ToBd09(latitude, longitude);
      return `https://api.map.baidu.com/marker?location=${bd_coords.lat},${bd_coords.lng}&coord_type=bd09ll`;
    default:
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}

/**
 * WGS84坐标系转百度坐标系BD09
 */
function wgs84ToBd09(lat: number, lng: number): { lat: number; lng: number } {
  const x_PI = (3.14159265358979324 * 3000.0) / 180.0;
  const x = lng;
  const y = lat;
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_PI);
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_PI);
  const bd_lng = z * Math.cos(theta) + 0.0065;
  const bd_lat = z * Math.sin(theta) + 0.006;
  return { lat: bd_lat, lng: bd_lng };
}

/**
 * 验证GPS坐标是否有效
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * 获取位置权限状态
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    return 'prompt';
  }
}

/**
 * 请求位置权限
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const coords = await getCurrentLocation();
    return true;
  } catch (error) {
    console.error('Location permission denied:', error);
    return false;
  }
}