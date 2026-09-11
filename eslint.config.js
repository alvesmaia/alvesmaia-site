/**
 * Lint do site. Tres alvos com regras diferentes, porque o codigo roda em
 * tres lugares diferentes:
 *
 *   api/src   TypeScript em Node, dentro do Azure Functions
 *   tests     TypeScript em Node, sob Vitest
 *   public/js JavaScript de navegador, sem bundler e sem modulos
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "api/node_modules/**",
      "api/dist/**",
      "public/vendor/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["api/src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { project: false },
    },
    rules: {
      // O modelo v4 do Functions recebe o contexto tipado; any explicito
      // aqui seria uma forma de calar o compilador, nao de simplificar.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": "off", // context.log e o canal de log das Functions
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser },
    },
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
      // A pagina nao tem console de producao; um log esquecido e ruido.
      "no-console": "warn",
    },
  },

  {
    files: ["*.config.js", "*.config.ts", "vitest.config.ts"],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    // Ferramentas de operacao: rodam em Node, na maquina de quem opera.
    files: ["docs/deploy/**/*.js", "docs/deploy/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      // O proposito destes scripts e imprimir no terminal.
      "no-console": "off",
    },
  },
];
