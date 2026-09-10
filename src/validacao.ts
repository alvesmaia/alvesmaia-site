export interface DadosContato {
  nome: string;
  email: string;
  assunto: string;
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
