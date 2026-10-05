# LUX como aplicativo (PWA)

O site pode ser instalado no Android/Chrome e adicionado à tela inicial no iOS. O GitHub Pages já entrega o site por HTTPS; mantenha os caminhos relativos para que também funcione no subdiretório `/Lux-Advance/`.

## Conferência antes de publicar

- `manifest.json` deve responder com status 200, `scope` relativo, `start_url` com `?source=pwa` e ícones 192×192 e 512×512 válidos.
- As páginas carregam o manifest, `theme-color`, `apple-touch-icon` e `pwa.js`.
- `pwa.js` registra `./sw.js` com escopo `./`.
- O service worker não armazena chamadas externas/Supabase nem páginas de login, cadastro, pagamento ou painéis autenticados.
- `offline.html` é o fallback de navegação quando a rede está indisponível.

## Instalar e validar

1. Publique os arquivos no GitHub Pages e acesse a URL HTTPS.
2. No Chrome para Android, abra o menu **Instalar app** ou toque no botão discreto **Instalar app** da página. O botão usa `beforeinstallprompt` quando disponível.
3. No Safari para iOS, toque em **Compartilhar → Adicionar à Tela de Início**. O botão da página também mostra estas instruções.
4. No Chrome DevTools, abra **Application → Manifest** e confirme que não há erros de instalação, que os três ícones carregam e que `start_url`/escopo estão corretos.
5. Em **Application → Service Workers**, confirme que `sw.js` está ativo. Em **Cache Storage**, confira `lux-app-v3`, e teste a navegação à vitrine em modo offline.
6. Execute o Lighthouse com a categoria **Progressive Web App**. Após alterar ícones/manifest, remova a instalação antiga e limpe o cache do service worker antes de repetir o teste.

O cache é apenas uma cópia de shell para navegação offline; autenticação, contato e dados do Supabase continuam dependendo da rede e são consultados no servidor.
