/**
 * Lista as submissões do formulário que foram gravadas mas não entregues.
 *
 * Por que isso existe
 * -------------------
 * O handler grava a submissão ANTES de tentar enviar o e-mail, de propósito:
 * se o Graph falhar, o contato continua recuperável. Mas a linha fica com
 * `enviado: false` e nada no sistema avisa — o visitante vê "não foi
 * possível enviar", desiste, e o lead dorme na tabela.
 *
 * Em 11/09/2026 uma indisponibilidade de três horas deixou quatro linhas
 * assim. Eram todas de teste, e só foram descobertas porque alguém foi
 * olhar. Este script existe para que da próxima vez não dependa disso.
 *
 * Uso
 * ---
 *     node docs/deploy/leads-nao-entregues.js
 *     node docs/deploy/leads-nao-entregues.js --todos    (inclui os entregues)
 *
 * A connection string é lida das Application Settings do Static Web App,
 * via Azure CLI já autenticado. Ela nunca é impressa.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

// O @azure/data-tables vive em api/node_modules — o mesmo pacote que a
// Function usa. Resolver a partir de api/ evita duplicar a dependencia na
// raiz, onde ela ja causou problema de modulo duplicado nos testes.
const exigir = createRequire(new URL("../../api/package.json", import.meta.url));
const { TableClient } = exigir("@azure/data-tables");

const TODOS = process.argv.includes("--todos");

/**
 * O endpoint de appsettings do Static Web App corta a conexão com alguma
 * frequência ("Connection aborted"). Três tentativas resolvem na prática.
 */
function conexao() {
  let ultimoErro = "";
  // Pausa síncrona entre tentativas: sem ela as três saem no mesmo instante
  // e batem na mesma janela ruim.
  const esperar = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  for (let i = 1; i <= 6; i++) {
    if (i > 1) esperar(3000);
    try {
      const saida = execFileSync(
        "az",
        [
          "staticwebapp", "appsettings", "list",
          "-n", "swa-alvesmaia-site",
          "-g", "rg-alvesmaia-site",
          "--query", "properties.TABLES_CONNECTION_STRING",
          "-o", "tsv",
        ],
        { encoding: "utf8", shell: true, stdio: ["ignore", "pipe", "pipe"] },
      ).trim();
      if (saida) return saida;
      ultimoErro = "resposta vazia";
    } catch (e) {
      ultimoErro = String(e.stderr || e.message).split(/\r?\n/)[0].slice(0, 120);
    }
  }
  console.error("Não consegui ler a connection string após 6 tentativas.");
  console.error("  último erro: " + ultimoErro);
  console.error("  se for de autenticação, rode: az login");
  process.exit(1);
}

/**
 * Lido pelo SDK, nao pela saida do `az`: no Windows o CLI escreve na pagina
 * de codigo do console e "Industria" volta com caractere de substituicao no
 * lugar do acento. O dado na tabela esta correto; era o caminho que corrompia.
 */
async function submissoes(cs) {
  const cliente = TableClient.fromConnectionString(cs, "submissoes");
  const itens = [];
  for await (const e of cliente.listEntities()) itens.push(e);
  return itens;
}

function entregue(e) {
  return e.enviado === true || e.enviado === "true";
}

/** O rowKey é o carimbo ISO mais um sufixo aleatório. */
function quando(e) {
  return String(e.rowKey).slice(0, 19).replace("T", " ") + " UTC";
}

const itens = (await submissoes(conexao())).sort((a, b) =>
  String(a.rowKey).localeCompare(String(b.rowKey)),
);

const pendentes = itens.filter((e) => !entregue(e));
const mostrar = TODOS ? itens : pendentes;

console.log(`\n${itens.length} submissões na tabela · ${pendentes.length} não entregues\n`);

if (mostrar.length === 0) {
  console.log("  Nada pendente. Todos os contatos chegaram por e-mail.\n");
  process.exit(0);
}

for (const e of mostrar) {
  const marca = entregue(e) ? "entregue" : "NÃO ENTREGUE";
  console.log("─".repeat(66));
  console.log(`  ${marca}  ·  ${quando(e)}`);
  console.log(`  ${e.nome}  <${e.email}>`);
  const contexto = [e.empresa, e.segmento, e.funcionarios].filter(Boolean).join(" · ");
  if (contexto) console.log(`  ${contexto}`);
  console.log("");
  console.log(
    String(e.mensagem || "")
      .split("\n")
      .map((l) => "    " + l)
      .join("\n"),
  );
  console.log("");
}

if (pendentes.length > 0) {
  console.log("─".repeat(66));
  console.log("\n  Estes contatos NÃO receberam resposta automática nem chegaram");
  console.log("  na sua caixa. Responda manualmente pelo e-mail acima.\n");
}
