import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Os pacotes do Azure existem em duas cópias: a da raiz, que o Vitest
 * resolveria a partir dos testes, e a de `api/node_modules`, que é a que
 * o código sob teste realmente importa.
 *
 * Sem estes alias, `vi.mock("@azure/data-tables")` intercepta a cópia da
 * raiz enquanto o módulo testado carrega a de `api/` — o mock não pega e
 * o teste chama o SDK de verdade.
 */
const naApi = (pacote: string) =>
  fileURLToPath(new URL(`./api/node_modules/${pacote}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@azure/data-tables": naApi("@azure/data-tables"),
      "@azure/functions": naApi("@azure/functions"),
    },
  },
});
