// Proxy entre o site e o OmniRoute (gateway de IA compatível com a API da OpenAI).
// A chave fica só no servidor; o navegador nunca vê OMNIROUTE_API_KEY.
//
// Variáveis de ambiente (Netlify → Site configuration → Environment variables):
//   OMNIROUTE_BASE_URL  URL pública do OmniRoute, ex.: https://omniroute.seudominio.com/v1
//   OMNIROUTE_API_KEY   chave criada em Dashboard → Endpoints (opcional se REQUIRE_API_KEY=false)
//   OMNIROUTE_MODEL     modelo ou combo do OmniRoute (padrão: "auto")

const SYSTEM_PROMPT = `Você é o assistente virtual da Genesis Landing Pages, que cria landing pages profissionais,
modernas e responsivas para pequenos negócios, com botão de WhatsApp, publicação e manutenção inclusas.
Responda em português do Brasil, de forma curta, simpática e objetiva.
Não invente preços nem prazos: para orçamento, peça que a pessoa chame no WhatsApp +55 21 99681-6846.`;

const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const baseUrl = (process.env.OMNIROUTE_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) return json(503, { error: "Assistente indisponível no momento." });

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Requisição inválida." });
  }

  const history = Array.isArray(payload?.messages) ? payload.messages : [];
  const messages = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json(400, { error: "Envie uma mensagem." });
  }

  const headers = { "Content-Type": "application/json" };
  if (process.env.OMNIROUTE_API_KEY) headers.Authorization = `Bearer ${process.env.OMNIROUTE_API_KEY}`;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: process.env.OMNIROUTE_MODEL || "auto",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 400,
        temperature: 0.5,
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      console.error("OmniRoute respondeu", res.status, await res.text().catch(() => ""));
      return json(502, { error: "Não consegui responder agora. Tente novamente ou chame no WhatsApp." });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return json(502, { error: "Resposta vazia do assistente." });

    return json(200, { reply });
  } catch (err) {
    console.error("Falha ao conectar ao OmniRoute:", err);
    return json(504, { error: "O assistente demorou para responder. Tente novamente." });
  }
};

export const config = { path: "/api/chat" };
