// Metro de Expo con soporte de monorepo pnpm: vigila la raíz y resuelve los
// paquetes del workspace por su `dist` compilado (patrón P-38/P-51).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = false;
// Los paquetes del workspace se consumen compilados (`dist`), no por la
// condición `react-native` de sus exports (que apuntaría a `src` con
// imports `.js` sin resolver). En tests, vitest usa alias a fuentes (P-51).
// Los paquetes @ryuunest/* se consumen compilados (`dist`). Su `exports`
// no tiene condición `default`, así que Metro cae a `src`; aquí se fuerza
// el `main` compilado. En tests, vitest usa alias a fuentes (P-51).
// El resto de paquetes sí usan package exports (entities, css-select…).
const WORKSPACE_PACKAGES = ["@ryuunest/core", "@ryuunest/test-site", "@ryuunest/ui-tokens"];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (WORKSPACE_PACKAGES.includes(moduleName)) {
    const resolved = path.join(workspaceRoot, "packages", moduleName.split("/")[1], "dist", "index.js");
    return { type: "sourceFile", filePath: resolved };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
