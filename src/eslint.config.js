const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                // Node.js globals
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                process: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                console: "readonly",
                Buffer: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^(next|err)$" }]
        }
    }
];