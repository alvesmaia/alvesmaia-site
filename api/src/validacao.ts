export interface DadosContato {
  nome: string;
  email: string;
  mensagem: string;
}

/**
 * Regex deliberadamente mais estrita que "tem arroba e ponto". A anterior
 * aceitava `maria@empresa..com`, `maria@-.com` e `a@b.<script>`; todos
 * passavam a validacao, eram gravados, e so falhavam la no Graph — que
 * devolve 400 e deixa a linha na tabela com enviado:false, sem ninguem
 * olhando. Errar cedo e visivel; errar tarde e silencioso.
 *
 * Local: sem espaco, sem arroba, sem ponto na ponta, sem ponto duplo.
 * Dominio: rotulos alfanumericos separados por ponto, hifen so no meio,
 * TLD com 2+ letras.
 */
const EMAIL_RE =
  /^[^\s@.](?:[^\s@]*[^\s@.])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

/** RFC 5321: 64 no local + 1 arroba + 255 no dominio. */
const TETO_EMAIL = 254;
/** Vira o assunto do e-mail e uma propriedade do Table Storage (limite 32K). */
const TETO_NOME = 120;
const TETO_MENSAGEM = 5000;

/** Retorna a lista de erros. Vazia quando os dados estão válidos. */
export function validarFormulario(d: DadosContato): string[] {
  const erros: string[] = [];

  const nome = d.nome.trim();
  if (nome.length < 2) erros.push("nome");
  if (nome.length > TETO_NOME) erros.push("nome_longo");

  const email = d.email.trim();
  if (email.length > TETO_EMAIL || !EMAIL_RE.test(email)) erros.push("email");

  const msg = d.mensagem.trim();
  if (msg.length < 10) erros.push("mensagem_curta");
  if (msg.length > TETO_MENSAGEM) erros.push("mensagem_longa");

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
  // Array.from itera por ponto de codigo, nao por unidade UTF-16. Um slice
  // direto parte emoji e outros pares substitutos ao meio, e o que chega no
  // e-mail e um substituto solto — caractere invalido, nao texto truncado.
  const limpar = (v: string) =>
    Array.from((v ?? "").trim()).slice(0, TETO_CONTEXTO).join("");
  return {
    empresa: limpar(c.empresa),
    segmento: limpar(c.segmento),
    funcionarios: limpar(c.funcionarios),
  };
}
