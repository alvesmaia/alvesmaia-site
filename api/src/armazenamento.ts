import { TableClient } from "@azure/data-tables";
import type { DadosContato, ContextoEmpresa } from "./validacao";

const TABELA = "submissoes";

export interface Submissao extends DadosContato, ContextoEmpresa {
  ip: string;
}

function cliente(conexao: string): TableClient {
  return TableClient.fromConnectionString(conexao, TABELA);
}

/** Chave de partição: ano-mês, para consultas por período ficarem baratas. */
function particao(agora: Date): string {
  return `${agora.getUTCFullYear()}-${String(agora.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * O timestamp sozinho colide quando duas submissões caem no mesmo
 * milissegundo, e a colisão descartaria uma delas silenciosamente.
 *
 * O prefixo AAAA-MM do ISO coincide com particao() de propósito:
 * marcarEnviado() recupera a partição a partir do rowKey.
 */
function chaveLinha(agora: Date): string {
  const sufixo = Math.random().toString(36).slice(2, 10);
  return `${agora.toISOString()}-${sufixo}`;
}

export async function gravarSubmissao(
  s: Submissao,
  conexao: string,
): Promise<string | null> {
  const agora = new Date();
  const rowKey = chaveLinha(agora);

  try {
    const tabela = cliente(conexao);
    // Idempotente: se a tabela já existe, o SDK ignora.
    await tabela.createTable();
    await tabela.createEntity({
      partitionKey: particao(agora),
      rowKey,
      nome: s.nome.trim(),
      email: s.email.trim(),
      mensagem: s.mensagem.trim(),
      empresa: s.empresa,
      segmento: s.segmento,
      funcionarios: s.funcionarios,
      ip: s.ip,
      enviado: false,
    });
    return rowKey;
  } catch (e) {
    console.error("Falha ao gravar a submissao:", e);
    return null;
  }
}

/**
 * Best-effort: a mensagem já foi entregue quando isto roda, então falhar
 * aqui não pode derrubar a requisição. Pior caso, a linha fica com
 * enviado:false e parece um falso negativo no relatório.
 */
export async function marcarEnviado(rowKey: string, conexao: string): Promise<void> {
  try {
    await cliente(conexao).updateEntity(
      { partitionKey: rowKey.slice(0, 7), rowKey, enviado: true },
      "Merge",
    );
  } catch (e) {
    console.error("Falha ao marcar a submissao como enviada:", e);
  }
}
