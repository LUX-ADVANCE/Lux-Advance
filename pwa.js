(() => {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js", { scope: "./" })
    .catch(() => console.warn("[LUX] Não foi possível ativar o modo offline."));

  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) return;

  let installPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "lux-install-app";
  button.textContent = "Instalar app";
  button.setAttribute("aria-label", "Instalar LUX como aplicativo");
  Object.assign(button.style, {
    position: "fixed",
    zIndex: "10000",
    right: "16px",
    bottom: "16px",
    minHeight: "44px",
    padding: "0 16px",
    border: "1px solid rgba(240,216,120,.6)",
    borderRadius: "999px",
    color: "#17120b",
    background: "linear-gradient(135deg,#f0d878,#c9a227)",
    boxShadow: "0 8px 25px rgba(0,0,0,.35)",
    font: "600 13px Inter,Arial,sans-serif",
    cursor: "pointer",
  });

  const instructions = document.createElement("dialog");
  instructions.setAttribute("aria-labelledby", "lux-install-title");
  Object.assign(instructions.style, {
    width: "min(390px,calc(100% - 32px))",
    padding: "26px",
    border: "1px solid rgba(240,216,120,.5)",
    borderRadius: "18px",
    color: "#f7f2f4",
    background: "#151115",
    boxShadow: "0 20px 80px rgba(0,0,0,.7)",
    font: "14px/1.6 Inter,Arial,sans-serif",
  });
  instructions.innerHTML = `<h2 id="lux-install-title" style="font:500 24px 'Playfair Display',Georgia,serif">Adicionar a LUX</h2><p>${isIOS
    ? "No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”."
    : "Use a opção “Instalar app” ou “Adicionar à tela inicial” no menu do navegador."}</p><button type="button" style="min-height:44px;padding:0 16px;border:0;border-radius:8px;background:#f0d878;font-weight:700;cursor:pointer">Entendi</button>`;
  instructions.querySelector("button").addEventListener("click", () => instructions.close());
  instructions.addEventListener("click", event => {
    if (event.target === instructions) instructions.close();
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.append(button, instructions);
  }, { once: true });

  button.addEventListener("click", async () => {
    if (!installPrompt) {
      instructions.showModal();
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    button.hidden = true;
    installPrompt = null;
  });
})();
