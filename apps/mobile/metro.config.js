const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Entry must resolve from apps/mobile, not the monorepo root (see EXPO_NO_METRO_WORKSPACE_ROOT in .env).
const config = getDefaultConfig(projectRoot);
config.projectRoot = projectRoot;

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a single React instance (fixes "Invalid hook call" in monorepos).
const reactDir = path.dirname(require.resolve('react/package.json', { paths: [projectRoot] }));
const reactDomDir = path.dirname(require.resolve('react-dom/package.json', { paths: [projectRoot] }));

config.resolver.extraNodeModules = {
  react: reactDir,
  'react-dom': reactDomDir,
};

module.exports = config;
