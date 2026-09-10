export interface DadosContato {
  nome: string;
  email: string;
  mensagem: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Retorna a lista de erros. Vazia quando os dados estão válidos. */
export function validarFormulario(d: DadosContato): string[] {
  const erros: string[] = [];

  if (d.nome.trim().length < 2) erros.push("nome");
  if (!EMAIL_RE.test(d.email.trim())) erros.push("email");

  const msg = d.mensagem.trim();
  if (msg.length < 10) erros.push("mensagem_curta");
  if (msg.length > 5000) erros.push("mensagem_longa");

  return erros;
}

/**
 * Contexto opcional da empresa. Não entra na validação: campo opcional em
 * branco não pode barrar o envio. O que precisa de guarda é o tamanho —
 * `empresa` é texto livre, e sem teto vira vetor de abuso.
 */
export interface ContextoEmpresa {
  empresa: string;
  segmento: string;
  funcionarios: string;
}

const TETO_CONTEXTO = 120;

export function normalizarContexto(c: ContextoEmpresa): ContextoEmpresa {
  const limpar = (v: string) => (v ?? "").trim().slice(0, TETO_CONTEXTO);
  return {
    empresa: limpar(c.empresa),
    segmento: limpar(c.segmento),
    funcionarios: limpar(c.funcionarios),
  };
}
