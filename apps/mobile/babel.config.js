const nodePath = require('path');

const appFolder = nodePath.join(__dirname, 'app');

/** Workaround: ensure expo-router _ctx files get a real path (monorepo / Windows). */
function inlineExpoRouterAppRoot(api) {
  const { types: t } = api;

  return {
    name: 'inline-expo-router-app-root',
    visitor: {
      MemberExpression(babelPath, state) {
        const object = babelPath.node.object;
        if (!t.isMemberExpression(object)) return;
        if (!t.isIdentifier(object.object, { name: 'process' })) return;
        if (!t.isIdentifier(object.property, { name: 'env' })) return;
        if (t.isAssignmentExpression(babelPath.parent) && babelPath.parent.left === babelPath.node) return;

        const key = babelPath.node.property;
        if (!t.isIdentifier(key)) return;

        const filename = state.filename || state.file.opts.filename;
        if (!filename?.includes('expo-router')) return;

        if (key.name === 'EXPO_ROUTER_APP_ROOT') {
          const relative = nodePath
            .relative(nodePath.dirname(filename), appFolder)
            .replace(/\\/g, '/');
          babelPath.replaceWith(t.stringLiteral(relative || 'app'));
          return;
        }

        if (key.name === 'EXPO_ROUTER_IMPORT_MODE') {
          babelPath.replaceWith(t.stringLiteral('sync'));
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [inlineExpoRouterAppRoot, 'react-native-reanimated/plugin'],
  };
};
