import { useState, useEffect } from 'react';

const RELEASE_API = 'https://api.github.com/repos/florida99771/saipair/releases/latest';
const RELEASE_PAGE = 'https://github.com/florida99771/saipair/releases/latest';

export function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'windows';
}

function matchAsset(assets, platform) {
  if (!assets) return null;
  const find = (test) => assets.find((a) => test(a.name));

  if (platform === 'windows') {
    return find((n) => n.endsWith('.exe') && !n.endsWith('.blockmap'));
  }
  if (platform === 'macos') {
    return find((n) => n.endsWith('.dmg') && !n.includes('arm64') && !n.endsWith('.blockmap'));
  }
  if (platform === 'linux') {
    return find((n) => n.endsWith('.AppImage'));
  }
  return null;
}

function matchAllAssets(assets) {
  if (!assets) return {};
  return {
    windows: matchAsset(assets, 'windows'),
    macos: matchAsset(assets, 'macos'),
    macosArm: assets.find((a) => a.name.includes('arm64') && a.name.endsWith('.dmg') && !a.name.endsWith('.blockmap')),
    linux: matchAsset(assets, 'linux'),
  };
}

export function useRelease() {
  const [data, setData] = useState({ version: '', assets: {}, loading: true });

  useEffect(() => {
    fetch(RELEASE_API)
      .then((r) => r.json())
      .then((json) => {
        setData({
          version: json.tag_name || '',
          assets: matchAllAssets(json.assets),
          loading: false,
        });
      })
      .catch(() => setData((prev) => ({ ...prev, loading: false })));
  }, []);

  const platform = detectPlatform();
  const currentAsset = data.assets[platform];

  return {
    platform,
    version: data.version,
    loading: data.loading,
    downloadUrl: currentAsset?.browser_download_url || RELEASE_PAGE,
    fileName: currentAsset?.name || '',
    assets: data.assets,
    releasePage: RELEASE_PAGE,
  };
}
