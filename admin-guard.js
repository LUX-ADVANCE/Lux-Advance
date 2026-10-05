/* =========================================================
   LUX ADVANCE — PROTEÇÃO DO PAINEL ADMINISTRATIVO
   admin-guard.js

   Carregar no <head>, depois de config.js.
   Esconde o painel até confirmar: sessão ativa + admin no banco
   (public.is_admin(), que já exige aal2) + nível aal2 do MFA.
   A segurança real é o RLS do Supabase (supabase/seguranca-admin.sql);
   este arquivo só controla a experiência de uso.
   ========================================================= */

(function () {

  "use strict";

  const LOGIN_URL = "./acesso-admin.html";
  const CHAVE_MSG = "lux_admin_msg";
  const INATIVIDADE_MS = 15 * 60 * 1000;
  const AVISO_MS = 60 * 1000;

  const raiz = document.documentElement;

  raiz.classList.add("lux-guard-oculto");

  const estilo = document.createElement("style");

  estilo.textContent =
    "html.lux-guard-oculto body>*:not(#luxGuardTela){display:none!important}" +
    "#luxGuardTela{position:fixed;inset:0;z-index:99999;display:flex;" +
    "flex-direction:column;align-items:center;justify-content:center;gap:16px;" +
    "background:#0b0609;color:#f8d58a;font:600 14px Arial,sans-serif;letter-spacing:.08em}" +
    "#luxGuardTela i{width:38px;height:38px;border-radius:50%;" +
    "border:3px solid rgba(248,213,138,.2);border-top-color:#f8d58a;" +
    "animation:luxGuardGira .9s linear infinite}" +
    "@keyframes luxGuardGira{to{transform:rotate(360deg)}}" +
    "#luxGuardAviso{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
    "z-index:99998;max-width:92vw;padding:14px 20px;border-radius:14px;" +
    "background:rgba(20,8,17,.97);border:1px solid #f8d58a;color:#f8d58a;" +
    "font:600 14px Arial,sans-serif;display:none;text-align:center}";

  document.head.appendChild(estilo);

  let tela = null;
  let aviso = null;
  let temporizador = null;
  let temporizadorAviso = null;
  let contagem = null;
  let encerrando = false;

  function mostrarTela() {

    if (tela || !document.body) {

      if (!document.body) {
        document.addEventListener("DOMContentLoaded", mostrarTela, { once: true });
      }

      return;
    }

    tela = document.createElement("div");
    tela.id = "luxGuardTela";
    tela.innerHTML = "<i></i><span>VERIFICANDO ACESSO...</span>";
    document.body.appendChild(tela);
  }

  mostrarTela();

  function liberar() {

    raiz.classList.remove("lux-guard-oculto");

    if (tela) {
      tela.remove();
      tela = null;
    }
  }

  async function sair(mensagem) {

    if (encerrando) {
      return;
    }

    encerrando = true;

    try {
      sessionStorage.setItem(CHAVE_MSG, mensagem || "");
    } catch (e) { /* ignora */ }

    try {
      await window.luxSupabase.auth.signOut();
    } catch (e) { /* ignora */ }

    window.location.replace(LOGIN_URL);
  }

  function redirecionar(mensagem) {

    try {
      sessionStorage.setItem(CHAVE_MSG, mensagem || "");
    } catch (e) { /* ignora */ }

    window.location.replace(LOGIN_URL);
  }

  /* ---------------- INATIVIDADE ---------------- */

  function esconderAviso() {

    if (aviso) {
      aviso.style.display = "none";
    }

    clearInterval(contagem);
  }

  function reiniciarInatividade() {

    if (encerrando) {
      return;
    }

    clearTimeout(temporizador);
    clearTimeout(temporizadorAviso);
    esconderAviso();

    temporizadorAviso = setTimeout(function () {

      if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "luxGuardAviso";
        aviso.setAttribute("role", "alert");
        document.body.appendChild(aviso);
      }

      let restante = Math.round(AVISO_MS / 1000);

      aviso.textContent =
        "Sessão expira em " + restante + "s por inatividade. Mova o mouse para continuar.";

      aviso.style.display = "block";

      contagem = setInterval(function () {

        restante -= 1;

        if (restante > 0) {
          aviso.textContent =
            "Sessão expira em " + restante + "s por inatividade. Mova o mouse para continuar.";
        }

      }, 1000);

    }, INATIVIDADE_MS - AVISO_MS);

    temporizador = setTimeout(function () {
      sair("Sessão encerrada por inatividade.");
    }, INATIVIDADE_MS);
  }

  function iniciarInatividade() {

    ["mousemove", "mousedown", "keydown", "touchstart", "scroll"]
      .forEach(function (nome) {
        document.addEventListener(nome, reiniciarInatividade, { passive: true });
      });

    reiniciarInatividade();
  }

  /* ---------------- VERIFICAÇÃO ---------------- */

  let verificacao = null;

  async function executarVerificacao() {

    const supabase = window.luxSupabase;

    if (!supabase) {
      redirecionar("Não foi possível iniciar o Supabase.");
      return false;
    }

    try {

      const sessao = await supabase.auth.getSession();

      if (sessao.error || !sessao.data || !sessao.data.session) {
        redirecionar("Faça login para acessar o painel.");
        return false;
      }

      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aal.error || !aal.data || aal.data.currentLevel !== "aal2") {
        redirecionar("Confirme o código do autenticador para acessar o painel.");
        return false;
      }

      const admin = await supabase.rpc("is_admin");

      if (admin.error || admin.data !== true) {
        await sair("Esta conta não tem autorização administrativa.");
        return false;
      }

    } catch (e) {

      await sair("Não foi possível validar o acesso. Entre novamente.");
      return false;
    }

    liberar();
    iniciarInatividade();

    if (window.luxSupabase.auth.onAuthStateChange) {
      window.luxSupabase.auth.onAuthStateChange(function (evento) {
        if (evento === "SIGNED_OUT" && !encerrando) {
          redirecionar("Sessão encerrada.");
        }
      });
    }

    return true;
  }

  function verificar() {

    if (!verificacao) {
      verificacao = executarVerificacao();
    }

    return verificacao;
  }

  window.LuxAdminGuard = {
    verificar: verificar,
    sair: sair,
    CHAVE_MSG: CHAVE_MSG
  };

  verificar();

})();
