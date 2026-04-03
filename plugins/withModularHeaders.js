const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(file, 'utf-8');
      
      const requiresStr = "require 'json'";
      const globalModularHeaders = "use_modular_headers!\n";
      
      if (contents.includes(requiresStr) && !contents.includes(globalModularHeaders)) {
        contents = contents.replace(requiresStr, globalModularHeaders + requiresStr);
      }
      
      fs.writeFileSync(file, contents);
      return config;
    },
  ]);
};

module.exports = withModularHeaders;