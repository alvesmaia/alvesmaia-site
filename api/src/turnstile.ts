const VERIFICAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function turnstileValido(
  token: string,
  segredo: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;

  const corpo = new FormData();
  corpo.append("secret", segredo);
  corpo.append("response", token);
  if (ip) corpo.append("remoteip", ip);

  try {
    const r = await fetch(VERIFICAR, { method: "POST", body: corpo });
    const json = (await r.json()) as { success?: boolean };
    return json.success === true;
  } catch (e) {
    console.error("Falha ao verificar o Turnstile:", e);
    return false;
  }
}
