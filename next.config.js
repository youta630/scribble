/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    dirs: ['src'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Tauri API modules should be treated as external in web mode
    config.externals = config.externals || [];
    config.externals.push({
      '@tauri-apps/api/fs': 'undefined',
      '@tauri-apps/api/notification': 'undefined',
      '@tauri-apps/api/core': 'undefined',
      '@tauri-apps/api/event': 'undefined',
      '@tauri-apps/api/path': 'undefined'
    });
    
    return config;
  }
}

module.exports = nextConfig