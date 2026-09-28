/* =========================================================
   LUX ADVANCE — PAINEL ADMINISTRATIVO V2.0
   painel-admin.js

   V2.0 — REFINAMENTO ADMINISTRATIVO + LUX-DIAMOND

   PRINCIPAIS MELHORIAS:
   - Mantém aprovação/reprovação funcionando.
   - Mantém public.modelo_perfis.
   - Mantém public.perfis.
   - Mantém filtros.
   - Mantém ficha cadastral.
   - Mantém impressão.
   - Mantém avaliações.
   - Mantém reclamações.
   - Mantém assinaturas.
   - Mantém doações.
   - Mantém pagamentos.
   - Mantém usuários.
   - Inclui LUX-DIAMOND.
   - Layout dos cards mais refinado.
   - Layout dos planos mais profissional.
   - Melhor hierarquia visual.
   - Melhor responsividade.
   - Proteção contra duplo clique.
   ========================================================= */

(function () {

  "use strict";

  const VERSAO = "V2.0";

  let listaModelos = [];
  let filtroAtual = "todos";
  let fichaAtual = null;
  let alterandoStatus = false;


  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      console.log(
        "[LUX ADMIN V2.0] Painel iniciado."
      );

      if (!window.luxSupabase) {

        console.error(
          "[LUX ADMIN V2.0] Supabase não inicializado."
        );

        mostrarErroInicializacao(
          "Supabase não foi inicializado. Verifique o config.js."
        );

        return;
      }

      configurarFiltros();

      configurarBotoesStatus();

      await carregarModelos();

      atualizarDashboard();

    }
  );


  /* =========================================================
     CONFIGURAR BOTÕES APROVAR / REPROVAR
     ========================================================= */

  function configurarBotoesStatus() {

    const botaoAprovar =
      document.getElementById(
        "botao-aprovar"
      );

    const botaoRejeitar =
      document.getElementById(
        "botao-rejeitar"
      );


    if (botaoAprovar) {

      botaoAprovar.type =
        "button";

      botaoAprovar.addEventListener(
        "click",
        function (evento) {

          evento.preventDefault();

          evento.stopPropagation();

          window.aprovarModelo();

        }
      );

    }


    if (botaoRejeitar) {

      botaoRejeitar.type =
        "button";

      botaoRejeitar.addEventListener(
        "click",
        function (evento) {

          evento.preventDefault();

          evento.stopPropagation();

          window.rejeitarModelo();

        }
      );

    }

  }


  /* =========================================================
     ERRO DE INICIALIZAÇÃO
     ========================================================= */

  function mostrarErroInicializacao(
    mensagem
  ) {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );

    if (!lista) return;


    lista.innerHTML = `

      <div class="lux-admin-error">

        <div class="lux-admin-error-icon">
          !
        </div>

        <strong>
          Erro no sistema
        </strong>

        <p>
          ${escaparHTML(mensagem)}
        </p>

      </div>

    `;

  }


  /* =========================================================
     CARREGAR MODELOS
     ========================================================= */

  async function carregarModelos() {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );


    if (!lista) {

      console.warn(
        "[LUX ADMIN V2.0] #lista-precadastros não encontrado."
      );

      return;
    }


    inserirEstilosAdmin();


    lista.innerHTML = `

      <div class="lux-loading">

        <div class="lux-loading-ring"></div>

        <div>
          Carregando modelos
        </div>

        <small>
          LUX ADVANCE ADMIN
        </small>

      </div>

    `;


    try {

      const resultado =
        await window.luxSupabase
          .from("modelo_perfis")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      const data =
        resultado.data;

      const error =
        resultado.error;


      if (error) {

        console.error(
          "[LUX ADMIN V2.0] Erro:",
          error
        );


        lista.innerHTML = `

          <div class="lux-admin-error">

            <div class="lux-admin-error-icon">
              !
            </div>

            <strong>
              Não foi possível carregar os modelos
            </strong>

            <p>
              ${escaparHTML(
                error.message ||
                "Erro desconhecido."
              )}
            </p>

          </div>

        `;

        return;
      }


      listaModelos =
        Array.isArray(data)
          ? data
          : [];


      renderizarModelos();

      atualizarDashboard();

    } catch (erro) {

      console.error(
        "[LUX ADMIN V2.0] Erro inesperado:",
        erro
      );


      lista.innerHTML = `

        <div class="lux-admin-error">

          <div class="lux-admin-error-icon">
            !
          </div>

          <strong>
            Erro inesperado
          </strong>

          <p>
            ${escaparHTML(
              erro.message ||
              "Não foi possível carregar os modelos."
            )}
          </p>

        </div>

      `;

    }

  }


  /* =========================================================
     RENDERIZAR MODELOS
     ========================================================= */

  function renderizarModelos() {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );


    if (!lista) return;


    const modelos =
      listaModelos.filter(
        function (modelo) {

          const status =
            normalizarStatus(
              modelo.verificacao_status
            );


          if (
            filtroAtual === "todos"
          ) {

            return true;

          }


          return status ===
            filtroAtual;

        }
      );


    if (!modelos.length) {

      lista.innerHTML = `

        <div class="lux-empty">

          <div class="lux-empty-icon">
            ◇
          </div>

          <strong>
            Nenhum modelo encontrado
          </strong>

          <p>
            Não existem modelos para este filtro.
          </p>

        </div>

      `;

      return;
    }


    lista.innerHTML =
      modelos.map(
        function (modelo) {

          const nome =
            modelo.nome_exibicao ||
            "Sem nome";


          const apelido =
            modelo.apelido ||
            "";


          const cidade =
            modelo.cidade ||
            "Não informada";


          const whatsapp =
            modelo.whatsapp ||
            "Não informado";


          const categoria =
            modelo.categoria_catalogo ||
            "Não informada";


          const idade =
            modelo.idade ||
            "Não informada";


          const status =
            normalizarStatus(
              modelo.verificacao_status
            );


          const plano =
            modelo.plano ||
            "ESSENCE";


          const planoVisual =
            normalizarPlano(
              plano
            );


          return `

            <article
              class="lux-model-card"
              data-status="${escaparAtributo(status)}"
            >

              <div class="lux-model-top">

                <div class="lux-model-identity">

                  <div class="lux-model-avatar">
                    ${
                      modelo.foto_url
                        ? `
                          <img
                            src="${escaparAtributo(modelo.foto_url)}"
                            alt="Foto"
                          >
                        `
                        : `
                          <span>
                            ${escaparHTML(
                              primeiraLetra(nome)
                            )}
                          </span>
                        `
                    }
                  </div>


                  <div>

                    <div class="lux-model-name">
                      ${escaparHTML(nome)}
                    </div>

                    ${
                      apelido
                        ? `
                          <div class="lux-model-nickname">
                            @${escaparHTML(apelido)}
                          </div>
                        `
                        : ""
                    }

                    <div class="lux-model-id">
                      ID ${escaparHTML(
                        String(modelo.id || "")
                          .substring(0, 8)
                      )}
                    </div>

                  </div>

                </div>


                <div class="lux-model-status">
                  ${badgeStatus(status)}
                </div>

              </div>


              <div class="lux-model-divider"></div>


              <div class="lux-model-grid">

                <div class="lux-info-item">

                  <span>
                    LOCALIZAÇÃO
                  </span>

                  <strong>
                    ${escaparHTML(cidade)}
                  </strong>

                </div>


                <div class="lux-info-item">

                  <span>
                    IDADE
                  </span>

                  <strong>
                    ${escaparHTML(
                      String(idade)
                    )}
                  </strong>

                </div>


                <div class="lux-info-item">

                  <span>
                    CATEGORIA
                  </span>

                  <strong>
                    ${escaparHTML(categoria)}
                  </strong>

                </div>


                <div class="lux-info-item">

                  <span>
                    WHATSAPP
                  </span>

                  <strong>
                    ${escaparHTML(whatsapp)}
                  </strong>

                </div>

              </div>


              <div class="lux-model-bottom">

                <div class="lux-plan-mini">
                  <span>PLANO</span>
                  <strong>
                    ${escaparHTML(planoVisual.nome)}
                  </strong>
                </div>


                <button
                  type="button"
                  class="lux-btn-ficha"
                  onclick="
                    verFichaModelo(
                      '${escaparAtributo(modelo.id)}'
                    )
                  "
                >
                  <span>VER FICHA</span>
                  <b>→</b>
                </button>

              </div>

            </article>

          `;

        }
      ).join("");

  }


  /* =========================================================
     NORMALIZAR STATUS
     ========================================================= */

  function normalizarStatus(
    status
  ) {

    if (!status) {

      return "pendente";

    }


    const valor =
      String(status)
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );


    if (
      valor === "aprovado" ||
      valor === "aprovada"
    ) {

      return "aprovado";

    }


    if (
      valor === "reprovado" ||
      valor === "reprovada" ||
      valor === "rejeitado" ||
      valor === "rejeitada" ||
      valor === "recusado" ||
      valor === "recusada"
    ) {

      return "reprovado";

    }


    return "pendente";

  }


  /* =========================================================
     BADGE
     ========================================================= */

  function badgeStatus(
    status
  ) {

    if (
      status === "aprovado"
    ) {

      return `

        <span class="lux-status aprovado">
          <b>✓</b>
          APROVADO
        </span>

      `;

    }


    if (
      status === "reprovado"
    ) {

      return `

        <span class="lux-status reprovado">
          <b>×</b>
          REPROVADO
        </span>

      `;

    }


    return `

      <span class="lux-status pendente">
        <b>◷</b>
        PENDENTE
      </span>

    `;

  }


  /* =========================================================
     FILTROS
     ========================================================= */

  function configurarFiltros() {

    const botoes =
      document.querySelectorAll(
        ".btn-filtro"
      );


    botoes.forEach(
      function (botao) {

        botao.addEventListener(
          "click",
          function () {

            botoes.forEach(
              function (b) {

                b.classList.remove(
                  "ativo"
                );

              }
            );


            botao.classList.add(
              "ativo"
            );


            filtroAtual =
              botao.dataset.filtro ||
              "todos";


            if (
              filtroAtual ===
              "rejeitado"
            ) {

              filtroAtual =
                "reprovado";

            }


            renderizarModelos();

          }
        );

      }
    );

  }


  /* =========================================================
     DASHBOARD
     ========================================================= */

  function atualizarDashboard() {

    const total =
      listaModelos.length;


    const pendentes =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "pendente"
          );

        }
      ).length;


    const aprovados =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "aprovado"
          );

        }
      ).length;


    const reprovados =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "reprovado"
          );

        }
      ).length;


    atualizarElemento(
      "resumoTotal",
      total
    );


    atualizarElemento(
      "resumoPendentes",
      pendentes
    );


    atualizarElemento(
      "resumoAprovados",
      aprovados
    );


    atualizarElemento(
      "resumoRejeitados",
      reprovados
    );

  }


  function atualizarElemento(
    id,
    valor
  ) {

    const elemento =
      document.getElementById(id);


    if (elemento) {

      elemento.textContent =
        valor;

    }

  }


  /* =========================================================
     VER FICHA
     ========================================================= */

  window.verFichaModelo =
    function (id) {

      const modelo =
        listaModelos.find(
          function (item) {

            return (
              String(item.id) ===
              String(id)
            );

          }
        );


      if (!modelo) {

        alert(
          "Modelo não encontrado."
        );

        return;
      }


      fichaAtual =
        modelo;


      const modal =
        document.getElementById(
          "modal-ver-ficha"
        );


      const corpo =
        document.getElementById(
          "corpo-ficha"
        );


      if (!modal || !corpo) {

        alert(
          "Modal da ficha não encontrado no painel."
        );

        return;
      }


      const status =
        normalizarStatus(
          modelo.verificacao_status
        );


      const plano =
        normalizarPlano(
          modelo.plano
        );


      corpo.innerHTML = `

        <div class="lux-ficha-header">

          <div class="lux-ficha-avatar">

            ${
              modelo.foto_url
                ? `
                  <img
                    src="${escaparAtributo(modelo.foto_url)}"
                    alt="Foto"
                  >
                `
                : `
                  <span>
                    ${escaparHTML(
                      primeiraLetra(
                        modelo.nome_exibicao
                      )
                    )}
                  </span>
                `
            }

          </div>


          <div class="lux-ficha-title">

            <h2>
              ${escaparHTML(
                modelo.nome_exibicao ||
                "Sem nome"
              )}
            </h2>

            ${
              modelo.apelido
                ? `
                  <span>
                    @${escaparHTML(
                      modelo.apelido
                    )}
                  </span>
                `
                : ""
            }

            <div class="lux-ficha-plan">
              ${escaparHTML(plano.nome)}
            </div>

          </div>

        </div>


        <div class="lux-ficha-status">
          ${badgeStatus(status)}
        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            DADOS PESSOAIS
          </div>

          <div class="lux-ficha-grid">

            ${campoFicha(
              "Nome",
              modelo.nome_exibicao
            )}

            ${campoFicha(
              "Apelido",
              modelo.apelido
            )}

            ${campoFicha(
              "Categoria",
              modelo.categoria_catalogo
            )}

            ${campoFicha(
              "CPF",
              modelo.cpf
            )}

            ${campoFicha(
              "Data de nascimento",
              modelo.data_nascimento
            )}

            ${campoFicha(
              "Idade",
              modelo.idade
            )}

            ${campoFicha(
              "Maioridade confirmada",
              modelo.maioridade_confirmada
                ? "SIM"
                : "NÃO"
            )}

          </div>

        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            CONTATO
          </div>

          <div class="lux-ficha-grid">

            ${campoFicha(
              "WhatsApp",
              modelo.whatsapp
            )}

            ${campoFicha(
              "Cidade",
              modelo.cidade
            )}

            ${campoFicha(
              "Estado",
              modelo.estado
            )}

            ${campoFicha(
              "CEP",
              modelo.cep
            )}

          </div>

        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            ENDEREÇO
          </div>

          <div class="lux-ficha-grid">

            ${campoFicha(
              "Bairro",
              modelo.bairro
            )}

            ${campoFicha(
              "Endereço",
              modelo.endereco
            )}

            ${campoFicha(
              "Número",
              modelo.numero
            )}

            ${campoFicha(
              "Complemento",
              modelo.complemento
            )}

            ${campoFicha(
              "País",
              modelo.pais
            )}

          </div>

        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            CARACTERÍSTICAS
          </div>

          <div class="lux-ficha-grid">

            ${campoFicha(
              "Altura",
              modelo.altura_cm
                ? modelo.altura_cm + " cm"
                : null
            )}

            ${campoFicha(
              "Cor do cabelo",
              modelo.cor_cabelo
            )}

            ${campoFicha(
              "Cor dos olhos",
              modelo.cor_olhos
            )}

            ${campoFicha(
              "Idiomas",
              modelo.idiomas
            )}

          </div>

        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            PERFIL
          </div>

          ${campoFicha(
            "Descrição",
            modelo.descricao
          )}

        </div>


        <div class="lux-ficha-section">

          <div class="lux-section-title">
            PLANO E CONTROLE
          </div>

          <div class="lux-ficha-grid">

            ${campoFicha(
              "Plano",
              plano.nome
            )}

            ${campoFicha(
              "Status",
              status.toUpperCase()
            )}

            ${campoFicha(
              "Cadastro",
              formatarData(
                modelo.criado_em
              )
            )}

            ${campoFicha(
              "Atualizado",
              formatarData(
                modelo.atualizado_em
              )
            )}

          </div>

        </div>

      `;


      const botaoAprovar =
        document.getElementById(
          "botao-aprovar"
        );


      const botaoRejeitar =
        document.getElementById(
          "botao-rejeitar"
        );


      if (botaoAprovar) {

        botaoAprovar.type =
          "button";

        botaoAprovar.style.display =
          status === "aprovado"
            ? "none"
            : "inline-block";

        botaoAprovar.disabled =
          false;

      }


      if (botaoRejeitar) {

        botaoRejeitar.type =
          "button";

        botaoRejeitar.style.display =
          status === "reprovado"
            ? "none"
            : "inline-block";

        botaoRejeitar.disabled =
          false;

      }


      modal.style.display =
        "flex";

    };


  function campoFicha(
    titulo,
    valor
  ) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {

      valor =
        "Não informado";

    }


    return `

      <div class="lux-ficha-field">

        <span>
          ${escaparHTML(titulo)}
        </span>

        <strong>
          ${escaparHTML(
            String(valor)
          )}
        </strong>

      </div>

    `;

  }


  /* =========================================================
     APROVAR
     ========================================================= */

  window.aprovarModelo =
    async function () {

      if (!fichaAtual) {

        alert(
          "Nenhum modelo selecionado."
        );

        return;
      }


      await alterarStatusModelo(
        "aprovado"
      );

    };


  /* =========================================================
     REPROVAR
     ========================================================= */

  window.rejeitarModelo =
    async function () {

      if (!fichaAtual) {

        alert(
          "Nenhum modelo selecionado."
        );

        return;
      }


      await alterarStatusModelo(
        "reprovado"
      );

    };


  /* =========================================================
     ALTERAR STATUS
     ========================================================= */

  async function alterarStatusModelo(
    novoStatus
  ) {

    if (alterandoStatus) {

      return;

    }


    if (!fichaAtual) {

      alert(
        "Nenhum modelo selecionado."
      );

      return;

    }


    if (!window.luxSupabase) {

      alert(
        "Supabase não está disponível."
      );

      return;

    }


    const idModelo =
      fichaAtual.id;


    const nome =
      fichaAtual.nome_exibicao ||
      "modelo";


    if (!idModelo) {

      alert(
        "O ID da modelo não foi encontrado."
      );

      return;

    }


    const mensagem =
      novoStatus === "aprovado"
        ? `Deseja aprovar o cadastro de ${nome}?`
        : `Deseja reprovar o cadastro de ${nome}?`;


    const confirmou =
      window.confirm(
        mensagem
      );


    if (!confirmou) {

      return;

    }


    alterandoStatus =
      true;


    const botaoAprovar =
      document.getElementById(
        "botao-aprovar"
      );


    const botaoRejeitar =
      document.getElementById(
        "botao-rejeitar"
      );


    if (botaoAprovar) {

      botaoAprovar.disabled =
        true;

    }


    if (botaoRejeitar) {

      botaoRejeitar.disabled =
        true;

    }


    try {

      const novoStatusNormalizado =
        novoStatus === "aprovado"
          ? "aprovado"
          : "reprovado";


      /* =====================================================
         MODELO_PERFIS
         ===================================================== */

      const resultado =
        await window.luxSupabase
          .from("modelo_perfis")
          .update({

            verificacao_status:
              novoStatusNormalizado,

            atualizado_em:
              new Date().toISOString()

          })
          .eq(
            "id",
            idModelo
          )
          .select()
          .single();


      if (resultado.error) {

        console.error(
          "[LUX ADMIN V2.0]",
          resultado.error
        );


        alert(
          "Não foi possível alterar o status da modelo.\n\n" +
          "Erro do Supabase:\n" +
          (
            resultado.error.message ||
            "Erro desconhecido."
          )
        );


        return;

      }


      /* =====================================================
         PERFIS
         ===================================================== */

      const statusPerfil =
        novoStatusNormalizado === "aprovado"
          ? "ativo"
          : "bloqueado";


      const resultadoPerfil =
        await window.luxSupabase
          .from("perfis")
          .update({

            status:
              statusPerfil,

            updated_at:
              new Date().toISOString()

          })
          .eq(
            "id",
            idModelo
          );


      if (
        resultadoPerfil.error
      ) {

        console.warn(
          "[LUX ADMIN V2.0] Erro em perfis:",
          resultadoPerfil.error
        );


        alert(
          "A modelo foi atualizada, mas houve um problema ao atualizar o status geral da conta:\n\n" +
          resultadoPerfil.error.message
        );

      }


      /* =====================================================
         MEMÓRIA LOCAL
         ===================================================== */

      const modeloAtualizado =
        resultado.data ||
        {
          ...fichaAtual,

          verificacao_status:
            novoStatusNormalizado,

          atualizado_em:
            new Date().toISOString()

        };


      const indice =
        listaModelos.findIndex(
          function (item) {

            return (
              String(item.id) ===
              String(idModelo)
            );

          }
        );


      if (indice !== -1) {

        listaModelos[indice] =
          modeloAtualizado;

      }


      fichaAtual =
        modeloAtualizado;


      atualizarDashboard();

      renderizarModelos();


      const modal =
        document.getElementById(
          "modal-ver-ficha"
        );


      if (modal) {

        modal.style.display =
          "none";

      }


      fichaAtual =
        null;


      await carregarModelos();


      alert(
        novoStatusNormalizado === "aprovado"
          ? "Modelo aprovado com sucesso."
          : "Modelo reprovado com sucesso."
      );


    } catch (erro) {

      console.error(
        "[LUX ADMIN V2.0] Erro:",
        erro
      );


      alert(
        "Ocorreu um erro ao atualizar o modelo.\n\n" +
        (
          erro.message ||
          String(erro) ||
          "Erro desconhecido."
        )
      );


    } finally {

      alterandoStatus =
        false;


      if (botaoAprovar) {

        botaoAprovar.disabled =
          false;

      }


      if (botaoRejeitar) {

        botaoRejeitar.disabled =
          false;

      }

    }

  }


  /* =========================================================
     FECHAR FICHA
     ========================================================= */

  window.fecharModalFicha =
    function () {

      const modal =
        document.getElementById(
          "modal-ver-ficha"
        );


      if (modal) {

        modal.style.display =
          "none";

      }


      fichaAtual =
        null;

    };


  /* =========================================================
     IMPRIMIR FICHA
     ========================================================= */

  window.imprimirFicha =
    function () {

      if (!fichaAtual) {

        alert(
          "Nenhuma ficha selecionada."
        );

        return;

      }


      const nome =
        fichaAtual.nome_exibicao ||
        "Modelo";


      const conteudo = `

        <html>

        <head>

          <meta charset="UTF-8">

          <title>
            Ficha — ${escaparHTML(nome)}
          </title>

          <style>

            body {
              font-family:Arial,sans-serif;
              padding:30px;
              color:#111;
            }

            h1 {
              text-align:center;
              margin-bottom:30px;
            }

            .campo {
              padding:10px;
              border-bottom:1px solid #ddd;
            }

            .titulo {
              font-weight:bold;
              display:inline-block;
              width:220px;
            }

          </style>

        </head>

        <body>

          <h1>
            LUX ADVANCE — FICHA CADASTRAL
          </h1>

          ${campoImpressao(
            "Nome",
            fichaAtual.nome_exibicao
          )}

          ${campoImpressao(
            "Apelido",
            fichaAtual.apelido
          )}

          ${campoImpressao(
            "Categoria",
            fichaAtual.categoria_catalogo
          )}

          ${campoImpressao(
            "WhatsApp",
            fichaAtual.whatsapp
          )}

          ${campoImpressao(
            "CPF",
            fichaAtual.cpf
          )}

          ${campoImpressao(
            "Data de nascimento",
            fichaAtual.data_nascimento
          )}

          ${campoImpressao(
            "Idade",
            fichaAtual.idade
          )}

          ${campoImpressao(
            "Altura",
            fichaAtual.altura_cm
              ? fichaAtual.altura_cm + " cm"
              : null
          )}

          ${campoImpressao(
            "CEP",
            fichaAtual.cep
          )}

          ${campoImpressao(
            "Estado",
            fichaAtual.estado
          )}

          ${campoImpressao(
            "Cidade",
            fichaAtual.cidade
          )}

          ${campoImpressao(
            "Bairro",
            fichaAtual.bairro
          )}

          ${campoImpressao(
            "Endereço",
            fichaAtual.endereco
          )}

          ${campoImpressao(
            "Número",
            fichaAtual.numero
          )}

          ${campoImpressao(
            "Complemento",
            fichaAtual.complemento
          )}

          ${campoImpressao(
            "País",
            fichaAtual.pais
          )}

          ${campoImpressao(
            "Cor do cabelo",
            fichaAtual.cor_cabelo
          )}

          ${campoImpressao(
            "Cor dos olhos",
            fichaAtual.cor_olhos
          )}

          ${campoImpressao(
            "Idiomas",
            fichaAtual.idiomas
          )}

          ${campoImpressao(
            "Descrição",
            fichaAtual.descricao
          )}

          ${campoImpressao(
            "Plano",
            fichaAtual.plano
          )}

          ${campoImpressao(
            "Status",
            fichaAtual.verificacao_status
          )}

          ${campoImpressao(
            "Cadastro",
            formatarData(
              fichaAtual.criado_em
            )
          )}

        </body>

        </html>

      `;


      const janela =
        window.open(
          "",
          "_blank"
        );


      if (!janela) {

        alert(
          "O navegador bloqueou a janela de impressão."
        );

        return;

      }


      janela.document.open();

      janela.document.write(
        conteudo
      );

      janela.document.close();


      janela.onload =
        function () {

          janela.print();

        };

    };


  function campoImpressao(
    titulo,
    valor
  ) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {

      valor =
        "Não informado";

    }


    return `

      <div class="campo">

        <span class="titulo">
          ${escaparHTML(titulo)}:
        </span>

        ${escaparHTML(
          String(valor)
        )}

      </div>

    `;

  }


  /* =========================================================
     MÓDULOS ADMIN
     ========================================================= */

  window.abrirModuloAdmin =
    async function (
      titulo,
      texto
    ) {

      const tituloNormalizado =
        normalizarTexto(
          titulo
        );


      if (
        tituloNormalizado.includes(
          "avaliacoes"
        )
      ) {

        await abrirModuloAvaliacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "reclamacoes"
        )
      ) {

        await abrirModuloReclamacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "assinaturas"
        )
      ) {

        await abrirModuloAssinaturas();

        return;

      }


      if (
        tituloNormalizado.includes(
          "planos"
        )
      ) {

        abrirModuloPlanos();

        return;

      }


      if (
        tituloNormalizado.includes(
          "doacoes"
        )
      ) {

        abrirModuloDoacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "pagamentos"
        )
      ) {

        abrirModuloPagamentos();

        return;

      }


      if (
        tituloNormalizado.includes(
          "usuarios"
        )
      ) {

        abrirModuloUsuarios();

        return;

      }


      mostrarModalGenerico(
        titulo,
        texto ||
        "Módulo administrativo disponível."
      );

    };


  /* =========================================================
     AVALIAÇÕES
     ========================================================= */

  async function abrirModuloAvaliacoes() {

    try {

      const resultado =
        await window.luxSupabase
          .from("avaliacoes")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Não foi possível carregar as avaliações.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Nenhuma avaliação registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

            const nota =
              Number(
                item.nota || 0
              );


            const estrelas =
              "★".repeat(
                Math.max(
                  0,
                  Math.min(
                    5,
                    nota
                  )
                )
              ) +
              "☆".repeat(
                Math.max(
                  0,
                  5 - nota
                )
              );


            return `

              <div class="lux-module-card">

                <div class="lux-stars">
                  ${estrelas}
                </div>

                <div class="lux-module-text">
                  ${escaparHTML(
                    item.comentario ||
                    "Sem comentário."
                  )}
                </div>

                <div class="lux-module-date">
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "AVALIAÇÕES",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


      mostrarModalGenerico(
        "AVALIAÇÕES",
        "Erro inesperado ao carregar avaliações."
      );

    }

  }


  /* =========================================================
     RECLAMAÇÕES
     ========================================================= */

  async function abrirModuloReclamacoes() {

    try {

      const resultado =
        await window.luxSupabase
          .from("reclamacoes")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Não foi possível carregar as reclamações.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Nenhuma reclamação registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

            return `

              <div class="lux-module-card">

                <div class="lux-module-title">
                  ${escaparHTML(
                    item.assunto ||
                    "Sem assunto"
                  )}
                </div>

                <div class="lux-module-text">
                  ${escaparHTML(
                    item.mensagem ||
                    "Sem mensagem."
                  )}
                </div>

                <div class="lux-module-status">
                  Status:
                  ${escaparHTML(
                    item.status ||
                    "Pendente"
                  )}
                </div>

                <div class="lux-module-date">
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "RECLAMAÇÕES",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


      mostrarModalGenerico(
        "RECLAMAÇÕES",
        "Erro inesperado ao carregar reclamações."
      );

    }

  }


  /* =========================================================
     ASSINATURAS
     ========================================================= */

  async function abrirModuloAssinaturas() {

    try {

      const resultado =
        await window.luxSupabase
          .from("assinaturas")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Não foi possível carregar as assinaturas.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Nenhuma assinatura registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

            return `

              <div class="lux-module-card">

                <div class="lux-module-title">
                  ${escaparHTML(
                    item.plano ||
                    item.nome_plano ||
                    "Plano"
                  )}
                </div>

                <div class="lux-module-text">
                  Status:
                  ${escaparHTML(
                    item.status ||
                    "Não informado"
                  )}
                </div>

                <div class="lux-module-date">
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "ASSINATURAS",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


      mostrarModalGenerico(
        "ASSINATURAS",
        "Erro inesperado ao carregar assinaturas."
      );

    }

  }


  /* =========================================================
     PLANOS LUX
     ========================================================= */

  function abrirModuloPlanos() {

    const planos = [

      {
        codigo: "ESSENCE",
        nome: "LUX-ESSENCE",
        preco: "GRÁTIS",
        descricao:
          "Sua presença começa aqui.",
        destaque:
          "ENTRADA",
        fotos: 2,
        videos: 1,
        recursos: [
          "Perfil básico",
          "Até 2 fotos",
          "1 vídeo"
        ]
      },

      {
        codigo: "DESFIRE",
        nome: "LUX-DESFIRE",
        preco: "R$ 29,90 / mês",
        descricao:
          "Mais destaque para seu perfil.",
        destaque:
          "VERIFICADO",
        fotos: 5,
        videos: 3,
        recursos: [
          "Selo verificado",
          "Até 5 fotos",
          "Até 3 vídeos",
          "Mais visibilidade"
        ]
      },

      {
        codigo: "ELITE",
        nome: "LUX-ELITE",
        preco: "R$ 59,90 / mês",
        descricao:
          "Experiência avançada.",
        destaque:
          "ELITE",
        fotos: 5,
        videos: 3,
        recursos: [
          "Inclui DESFIRE",
          "WhatsApp secretário",
          "Suporte avançado",
          "Selo ELITE"
        ]
      },

      {
        codigo: "ROYAL",
        nome: "LUX-ROYAL",
        preco: "R$ 99,90 / mês",
        descricao:
          "Exclusividade e destaque.",
        destaque:
          "ROYAL",
        fotos: 5,
        videos: 3,
        recursos: [
          "Inclui ELITE",
          "Segurança",
          "Exclusividade",
          "Destaque",
          "Atendimento prioritário"
        ]
      },

      {
        codigo: "DIAMOND",
        nome: "LUX-DIAMOND",
        preco: "R$ 149,90 / mês",
        descricao:
          "O nível máximo de exclusividade da LUX ADVANCE.",
        destaque:
          "DIAMOND",
        fotos: 10,
        videos: 5,
        recursos: [
          "Inclui tudo do LUX-ROYAL",
          "10 fotos",
          "Até 5 vídeos",
          "Acompanhamento presencial nos atendimentos",
          "Segurança presencial",
          "Logística de deslocamento",
          "Prioridade máxima",
          "Suporte prioritário",
          "Benefícios exclusivos",
          "Destaque máximo"
        ]
      }

    ];


    const html = `

      <div class="lux-plan-header">

        <div>

          <div class="lux-plan-eyebrow">
            LUX ADVANCE
          </div>

          <h3>
            ESTRUTURA DE PLANOS
          </h3>

          <p>
            Recursos e níveis de presença disponíveis
            para modelos cadastradas na plataforma.
          </p>

        </div>

      </div>


      <div class="lux-plans-grid">

        ${planos.map(
          function (item) {

            return planoProfissional(
              item
            );

          }
        ).join("")}

      </div>

    `;


    mostrarModalGenerico(
      "PLANOS LUX",
      html,
      true
    );

  }


  /* =========================================================
     CARD PROFISSIONAL DE PLANO
     ========================================================= */

  function planoProfissional(
    item
  ) {

    const diamond =
      item.codigo === "DIAMOND";


    return `

      <article
        class="
          lux-plan-card
          ${diamond ? "diamond" : ""}
        "
      >

        ${
          diamond
            ? `
              <div class="lux-diamond-ribbon">
                LUX DIAMOND
              </div>
            `
            : ""
        }


        <div class="lux-plan-top">

          <div class="lux-plan-symbol">
            ${
              diamond
                ? "◆"
                : "◇"
            }
          </div>


          <div>

            <div class="lux-plan-level">
              ${escaparHTML(
                item.destaque
              )}
            </div>

            <h3>
              ${escaparHTML(
                item.nome
              )}
            </h3>

          </div>

        </div>


        <div class="lux-plan-price">
          ${escaparHTML(
            item.preco
          )}
        </div>


        <p class="lux-plan-description">
          ${escaparHTML(
            item.descricao
          )}
        </p>


        <div class="lux-plan-media">

          <div>

            <span>
              FOTOS
            </span>

            <strong>
              ${item.fotos}
            </strong>

          </div>


          <div>

            <span>
              VÍDEOS
            </span>

            <strong>
              ${item.videos}
            </strong>

          </div>

        </div>


        <div class="lux-plan-line"></div>


        <div class="lux-plan-features">

          ${item.recursos.map(
            function (recurso) {

              return `

                <div class="lux-feature">

                  <span>
                    ✓
                  </span>

                  <p>
                    ${escaparHTML(
                      recurso
                    )}
                  </p>

                </div>

              `;

            }
          ).join("")}

        </div>


        ${
          diamond
            ? `
              <div class="lux-diamond-note">

                <strong>
                  NÍVEL MÁXIMO
                </strong>

                <span>
                  Estrutura premium com prioridade,
                  segurança presencial e logística.
                </span>

              </div>
            `
            : ""
        }

      </article>

    `;

  }


  /* =========================================================
     DOAÇÕES
     ========================================================= */

  function abrirModuloDoacoes() {

    mostrarModalGenerico(
      "DOAÇÕES",
      `
        <div class="lux-module-intro">

          <div class="lux-module-icon">
            PIX
          </div>

          <div>

            <strong>
              DOAÇÕES LUX
            </strong>

            <p>
              Área administrativa destinada
              ao acompanhamento das doações.
            </p>

          </div>

        </div>

        <div class="lux-module-card">

          <div class="lux-module-title">
            REGISTROS DE DOAÇÃO
          </div>

          <div class="lux-module-text">
            O módulo permanece preparado para
            integração com os registros de doações
            armazenados no Supabase.
          </div>

        </div>
      `,
      true
    );

  }


  /* =========================================================
     PAGAMENTOS
     ========================================================= */

  function abrirModuloPagamentos() {

    mostrarModalGenerico(
      "PAGAMENTOS",
      `
        <div class="lux-module-card">

          <div class="lux-module-title">
            PAGAMENTOS
          </div>

          <div class="lux-module-text">
            Área administrativa destinada ao
            acompanhamento dos pagamentos.
          </div>

        </div>
      `,
      true
    );

  }


  /* =========================================================
     USUÁRIOS
     ========================================================= */

  function abrirModuloUsuarios() {

    mostrarModalGenerico(
      "USUÁRIOS",
      `
        <div class="lux-module-card">

          <div class="lux-module-title">
            USUÁRIOS
          </div>

          <div class="lux-module-text">
            Área administrativa destinada ao
            gerenciamento das contas de usuários.
          </div>

        </div>
      `,
      true
    );

  }


  /* =========================================================
     MODAL GENÉRICO
     ========================================================= */

  function mostrarModalGenerico(
    titulo,
    conteudo,
    html
  ) {

    html =
      html === true;


    const modal =
      document.getElementById(
        "modal-admin-generico"
      );


    if (modal) {

      const tituloElemento =
        modal.querySelector(
          "[data-modal-titulo]"
        );


      const corpoElemento =
        modal.querySelector(
          "[data-modal-corpo]"
        );


      if (tituloElemento) {

        tituloElemento.textContent =
          titulo;

      }


      if (corpoElemento) {

        if (html) {

          corpoElemento.innerHTML =
            conteudo;

        } else {

          corpoElemento.textContent =
            conteudo;

        }

      }


      modal.style.display =
        "flex";


      return;

    }


    const existente =
      document.getElementById(
        "lux-modal-generico-criado"
      );


    if (existente) {

      existente.remove();

    }


    const novoModal =
      document.createElement(
        "div"
      );


    novoModal.id =
      "lux-modal-generico-criado";


    novoModal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:14px;
      background:rgba(0,0,0,.88);
      backdrop-filter:blur(10px);
    `;


    const caixa =
      document.createElement(
        "div"
      );


    caixa.style.cssText = `
      width:min(820px,100%);
      max-height:92vh;
      overflow:auto;
      padding:0;
      border-radius:24px;
      border:1px solid rgba(248,213,138,.24);
      background:
        radial-gradient(
          circle at top right,
          rgba(255,77,166,.08),
          transparent 35%
        ),
        linear-gradient(
          145deg,
          #12090d,
          #080507
        );
      box-shadow:
        0 30px 100px rgba(0,0,0,.65);
      color:#fff;
    `;


    caixa.innerHTML = `

      <div class="lux-modal-header">

        <div>

          <span>
            LUX ADVANCE
          </span>

          <h2 data-modal-titulo>
            ${escaparHTML(titulo)}
          </h2>

        </div>


        <button
          type="button"
          id="fechar-lux-modal"
          aria-label="Fechar"
        >
          ×
        </button>

      </div>


      <div
        id="conteudo-lux-modal"
        class="lux-modal-content"
      ></div>

    `;


    novoModal.appendChild(
      caixa
    );


    document.body.appendChild(
      novoModal
    );


    const conteudoElemento =
      caixa.querySelector(
        "#conteudo-lux-modal"
      );


    if (html) {

      conteudoElemento.innerHTML =
        conteudo;

    } else {

      conteudoElemento.textContent =
        conteudo;

    }


    caixa.querySelector(
      "#fechar-lux-modal"
    ).onclick =
      function () {

        novoModal.remove();

      };


    novoModal.addEventListener(
      "click",
      function (evento) {

        if (
          evento.target ===
          novoModal
        ) {

          novoModal.remove();

        }

      }
    );

  }


  /* =========================================================
     FECHAR MODAIS
     ========================================================= */

  document.addEventListener(
    "click",
    function (evento) {

      if (
        evento.target.matches(
          "[data-fechar-modal-admin]"
        )
      ) {

        const modal =
          evento.target.closest(
            ".modal"
          );


        if (modal) {

          modal.style.display =
            "none";

        }

      }

    }
  );


  /* =========================================================
     NORMALIZAR TEXTO
     ========================================================= */

  function normalizarTexto(
    texto
  ) {

    return String(
      texto || ""
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  }


  /* =========================================================
     NORMALIZAR PLANO
     ========================================================= */

  function normalizarPlano(
    plano
  ) {

    const valor =
      normalizarTexto(
        plano
      )
      .replace(
        /lux[-_ ]?/g,
        ""
      )
      .toUpperCase();


    const planos = {

      ESSENCE: {
        codigo: "ESSENCE",
        nome: "LUX-ESSENCE"
      },

      DESFIRE: {
        codigo: "DESFIRE",
        nome: "LUX-DESFIRE"
      },

      ELITE: {
        codigo: "ELITE",
        nome: "LUX-ELITE"
      },

      ROYAL: {
        codigo: "ROYAL",
        nome: "LUX-ROYAL"
      },

      DIAMOND: {
        codigo: "DIAMOND",
        nome: "LUX-DIAMOND"
      }

    };


    return (
      planos[valor] ||
      planos.ESSENCE
    );

  }


  /* =========================================================
     PRIMEIRA LETRA
     ========================================================= */

  function primeiraLetra(
    texto
  ) {

    const valor =
      String(
        texto || "L"
      ).trim();


    return (
      valor.charAt(0) ||
      "L"
    ).toUpperCase();

  }


  /* =========================================================
     FORMATAR DATA
     ========================================================= */

  function formatarData(
    data
  ) {

    if (!data) {

      return "Não informado";

    }


    try {

      const dataObj =
        new Date(data);


      if (
        isNaN(
          dataObj.getTime()
        )
      ) {

        return String(data);

      }


      return dataObj.toLocaleString(
        "pt-BR",
        {
          dateStyle: "short",
          timeStyle: "short"
        }
      );

    } catch (erro) {

      return String(data);

    }

  }


  /* =========================================================
     ESCAPAR HTML
     ========================================================= */

  function escaparHTML(
    valor
  ) {

    if (
      valor === null ||
      valor === undefined
    ) {

      return "";

    }


    return String(valor)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =========================================================
     ESCAPAR ATRIBUTO
     ========================================================= */

  function escaparAtributo(
    valor
  ) {

    return String(
      valor || ""
    )
      .replace(
        /\\/g,
        "\\\\"
      )
      .replace(
        /'/g,
        "\\'"
      )
      .replace(
        /"/g,
        "&quot;"
      );

  }


  /* =========================================================
     ESTILOS REFINADOS DO PAINEL
     ========================================================= */

  function inserirEstilosAdmin() {

    if (
      document.getElementById(
        "lux-admin-v20-style"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "lux-admin-v20-style";


    style.textContent = `

      /* =========================================
         BASE
         ========================================= */

      #lista-precadastros {
        width:100%;
      }


      /* =========================================
         LOADING
         ========================================= */

      .lux-loading {
        min-height:180px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:9px;
        color:#f8d58a;
        font-size:15px;
        letter-spacing:.04em;
      }

      .lux-loading small {
        color:#777;
        font-size:10px;
        letter-spacing:.18em;
      }

      .lux-loading-ring {
        width:38px;
        height:38px;
        border-radius:50%;
        border:2px solid rgba(248,213,138,.15);
        border-top-color:#f8d58a;
        animation:
          luxSpin
          .8s linear infinite;
      }

      @keyframes luxSpin {
        to {
          transform:rotate(360deg);
        }
      }


      /* =========================================
         ERRO
         ========================================= */

      .lux-admin-error {
        padding:28px;
        text-align:center;
        border:1px solid rgba(255,77,166,.25);
        border-radius:20px;
        background:
          linear-gradient(
            145deg,
            rgba(255,77,166,.08),
            rgba(255,255,255,.02)
          );
      }

      .lux-admin-error-icon {
        width:44px;
        height:44px;
        margin:0 auto 12px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        border:1px solid rgba(255,77,166,.35);
        color:#ff4da6;
        font-size:22px;
        font-weight:bold;
      }

      .lux-admin-error strong {
        color:#ff4da6;
        font-size:17px;
      }

      .lux-admin-error p {
        color:#aaa;
        line-height:1.6;
      }


      /* =========================================
         EMPTY
         ========================================= */

      .lux-empty {
        padding:45px 20px;
        text-align:center;
        border:1px solid rgba(248,213,138,.10);
        border-radius:20px;
        background:rgba(255,255,255,.018);
      }

      .lux-empty-icon {
        color:#f8d58a;
        font-size:40px;
        margin-bottom:10px;
      }

      .lux-empty strong {
        color:#f8d58a;
        font-size:18px;
      }

      .lux-empty p {
        color:#777;
      }


      /* =========================================
         CARD MODELO
         ========================================= */

      .lux-model-card {
        position:relative;
        overflow:hidden;
        padding:20px;
        margin-bottom:15px;
        border:1px solid rgba(248,213,138,.14);
        border-radius:22px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(248,213,138,.055),
            transparent 34%
          ),
          linear-gradient(
            145deg,
            rgba(255,255,255,.055),
            rgba(255,255,255,.018)
          );
        box-shadow:
          0 12px 38px rgba(0,0,0,.18);
        transition:
          transform .2s ease,
          border-color .2s ease,
          box-shadow .2s ease;
      }

      .lux-model-card:hover {
        transform:translateY(-2px);
        border-color:rgba(248,213,138,.30);
        box-shadow:
          0 18px 45px rgba(0,0,0,.28);
      }

      .lux-model-top {
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:16px;
        flex-wrap:wrap;
      }

      .lux-model-identity {
        display:flex;
        align-items:center;
        gap:13px;
        min-width:0;
      }

      .lux-model-avatar {
        width:54px;
        height:54px;
        flex:0 0 54px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        border:1px solid rgba(248,213,138,.35);
        background:
          linear-gradient(
            145deg,
            rgba(248,213,138,.14),
            rgba(255,77,166,.08)
          );
        color:#f8d58a;
        font-size:20px;
        font-weight:bold;
      }

      .lux-model-avatar img {
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .lux-model-name {
        color:#fff;
        font-size:19px;
        font-weight:700;
        line-height:1.2;
      }

      .lux-model-nickname {
        margin-top:4px;
        color:#ff4da6;
        font-size:13px;
      }

      .lux-model-id {
        margin-top:5px;
        color:#666;
        font-size:9px;
        letter-spacing:.13em;
      }

      .lux-model-status {
        flex-shrink:0;
      }

      .lux-status {
        display:inline-flex;
        align-items:center;
        gap:6px;
        padding:7px 11px;
        border-radius:999px;
        font-size:10px;
        font-weight:800;
        letter-spacing:.06em;
        white-space:nowrap;
      }

      .lux-status b {
        font-size:13px;
      }

      .lux-status.aprovado {
        color:#7be0a5;
        border:1px solid rgba(90,210,135,.25);
        background:rgba(60,190,120,.08);
      }

      .lux-status.reprovado {
        color:#ff9292;
        border:1px solid rgba(255,80,80,.25);
        background:rgba(255,80,80,.07);
      }

      .lux-status.pendente {
        color:#f8d58a;
        border:1px solid rgba(248,213,138,.25);
        background:rgba(248,213,138,.06);
      }

      .lux-model-divider {
        height:1px;
        margin:17px 0;
        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(248,213,138,.15),
            transparent
          );
      }

      .lux-model-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );
        gap:12px;
      }

      .lux-info-item {
        min-width:0;
        padding:10px 11px;
        border-radius:12px;
        background:rgba(255,255,255,.025);
        border:1px solid rgba(255,255,255,.045);
      }

      .lux-info-item span {
        display:block;
        margin-bottom:4px;
        color:#666;
        font-size:8px;
        letter-spacing:.13em;
      }

      .lux-info-item strong {
        display:block;
        overflow:hidden;
        color:#ddd;
        font-size:12px;
        font-weight:500;
        text-overflow:ellipsis;
        white-space:nowrap;
      }

      .lux-model-bottom {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:16px;
      }

      .lux-plan-mini span {
        display:block;
        color:#666;
        font-size:8px;
        letter-spacing:.14em;
      }

      .lux-plan-mini strong {
        display:block;
        margin-top:3px;
        color:#f8d58a;
        font-size:12px;
      }

      .lux-btn-ficha {
        display:flex;
        align-items:center;
        gap:10px;
        padding:10px 14px;
        border-radius:11px;
        border:1px solid rgba(248,213,138,.27);
        background:rgba(248,213,138,.055);
        color:#f8d58a;
        cursor:pointer;
        font-size:10px;
        font-weight:800;
        letter-spacing:.06em;
        transition:.2s ease;
      }

      .lux-btn-ficha:hover {
        background:rgba(248,213,138,.12);
        border-color:rgba(248,213,138,.5);
      }

      .lux-btn-ficha b {
        font-size:16px;
        font-weight:400;
      }


      /* =========================================
         FICHA
         ========================================= */

      .lux-ficha-header {
        display:flex;
        align-items:center;
        gap:15px;
        padding:16px;
        border-radius:18px;
        border:1px solid rgba(248,213,138,.13);
        background:rgba(255,255,255,.025);
      }

      .lux-ficha-avatar {
        width:68px;
        height:68px;
        flex:0 0 68px;
        overflow:hidden;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        border:1px solid rgba(248,213,138,.35);
        background:rgba(248,213,138,.07);
        color:#f8d58a;
        font-size:25px;
        font-weight:bold;
      }

      .lux-ficha-avatar img {
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .lux-ficha-title h2 {
        margin:0;
        color:#fff;
        font-size:21px;
      }

      .lux-ficha-title span {
        display:block;
        margin-top:4px;
        color:#ff4da6;
        font-size:13px;
      }

      .lux-ficha-plan {
        display:inline-block;
        margin-top:8px;
        padding:4px 8px;
        border-radius:7px;
        background:rgba(248,213,138,.07);
        color:#f8d58a;
        font-size:9px;
        font-weight:bold;
        letter-spacing:.08em;
      }

      .lux-ficha-status {
        margin:12px 0;
      }

      .lux-ficha-section {
        margin-top:18px;
      }

      .lux-section-title {
        margin-bottom:9px;
        color:#f8d58a;
        font-size:10px;
        font-weight:800;
        letter-spacing:.15em;
      }

      .lux-ficha-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );
        gap:9px;
      }

      .lux-ficha-field {
        padding:11px;
        border-radius:11px;
        border:1px solid rgba(255,255,255,.055);
        background:rgba(255,255,255,.025);
      }

      .lux-ficha-field span {
        display:block;
        margin-bottom:4px;
        color:#666;
        font-size:8px;
        text-transform:uppercase;
        letter-spacing:.10em;
      }

      .lux-ficha-field strong {
        display:block;
        color:#eee;
        font-size:12px;
        font-weight:500;
        line-height:1.5;
        word-break:break-word;
      }


      /* =========================================
         MODAL
         ========================================= */

      .lux-modal-header {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:15px;
        padding:20px 22px;
        border-bottom:1px solid rgba(248,213,138,.10);
        background:
          linear-gradient(
            90deg,
            rgba(248,213,138,.045),
            transparent
          );
      }

      .lux-modal-header span {
        color:#777;
        font-size:8px;
        letter-spacing:.2em;
      }

      .lux-modal-header h2 {
        margin:5px 0 0;
        color:#f8d58a;
        font-size:20px;
      }

      .lux-modal-header button {
        width:38px;
        height:38px;
        border-radius:50%;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.04);
        color:#fff;
        font-size:21px;
        cursor:pointer;
      }

      .lux-modal-content {
        padding:20px;
      }


      /* =========================================
         PLANOS
         ========================================= */

      .lux-plan-header {
        margin-bottom:18px;
        padding:18px;
        border-radius:18px;
        border:1px solid rgba(248,213,138,.12);
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(255,77,166,.08),
            transparent 35%
          ),
          rgba(255,255,255,.025);
      }

      .lux-plan-eyebrow {
        color:#ff4da6;
        font-size:8px;
        font-weight:800;
        letter-spacing:.2em;
      }

      .lux-plan-header h3 {
        margin:6px 0;
        color:#f8d58a;
        font-size:20px;
      }

      .lux-plan-header p {
        margin:0;
        color:#888;
        line-height:1.6;
        font-size:12px;
      }

      .lux-plans-grid {
        display:grid;
        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );
        gap:14px;
      }

      .lux-plan-card {
        position:relative;
        overflow:hidden;
        padding:18px;
        border:1px solid rgba(248,213,138,.13);
        border-radius:19px;
        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,.045),
            rgba(255,255,255,.018)
          );
        box-shadow:
          0 12px 30px rgba(0,0,0,.16);
      }

      .lux-plan-card.diamond {
        border-color:rgba(248,213,138,.45);
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(248,213,138,.13),
            transparent 38%
          ),
          radial-gradient(
            circle at 0% 100%,
            rgba(255,77,166,.07),
            transparent 38%
          ),
          linear-gradient(
            145deg,
            rgba(255,255,255,.06),
            rgba(255,255,255,.018)
          );
        box-shadow:
          0 15px 45px rgba(248,213,138,.08);
      }

      .lux-diamond-ribbon {
        position:absolute;
        top:12px;
        right:-32px;
        transform:rotate(35deg);
        padding:5px 38px;
        background:#f8d58a;
        color:#0b0608;
        font-size:7px;
        font-weight:900;
        letter-spacing:.1em;
      }

      .lux-plan-top {
        display:flex;
        align-items:center;
        gap:11px;
      }

      .lux-plan-symbol {
        width:42px;
        height:42px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:12px;
        border:1px solid rgba(248,213,138,.20);
        color:#f8d58a;
        background:rgba(248,213,138,.06);
        font-size:20px;
      }

      .lux-plan-level {
        color:#777;
        font-size:8px;
        font-weight:800;
        letter-spacing:.16em;
      }

      .lux-plan-card h3 {
        margin:3px 0 0;
        color:#fff;
        font-size:17px;
      }

      .lux-plan-price {
        margin-top:18px;
        color:#f8d58a;
        font-size:20px;
        font-weight:800;
      }

      .lux-plan-description {
        min-height:38px;
        margin:7px 0 0;
        color:#999;
        font-size:11px;
        line-height:1.5;
      }

      .lux-plan-media {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-top:14px;
      }

      .lux-plan-media div {
        padding:9px;
        border-radius:10px;
        background:rgba(255,255,255,.025);
        border:1px solid rgba(255,255,255,.05);
      }

      .lux-plan-media span {
        display:block;
        color:#666;
        font-size:7px;
        letter-spacing:.14em;
      }

      .lux-plan-media strong {
        display:block;
        margin-top:3px;
        color:#eee;
        font-size:14px;
      }

      .lux-plan-line {
        height:1px;
        margin:15px 0;
        background:
          linear-gradient(
            90deg,
            rgba(248,213,138,.2),
            transparent
          );
      }

      .lux-plan-features {
        display:grid;
        gap:7px;
      }

      .lux-feature {
        display:flex;
        align-items:flex-start;
        gap:8px;
      }

      .lux-feature span {
        color:#f8d58a;
        font-weight:bold;
      }

      .lux-feature p {
        margin:0;
        color:#aaa;
        font-size:11px;
        line-height:1.4;
      }

      .lux-diamond-note {
        margin-top:15px;
        padding:10px;
        border-radius:10px;
        border:1px solid rgba(248,213,138,.18);
        background:rgba(248,213,138,.045);
      }

      .lux-diamond-note strong {
        display:block;
        color:#f8d58a;
        font-size:8px;
        letter-spacing:.12em;
      }

      .lux-diamond-note span {
        display:block;
        margin-top:4px;
        color:#999;
        font-size:10px;
        line-height:1.4;
      }


      /* =========================================
         MÓDULOS
         ========================================= */

      .lux-module-card {
        padding:16px;
        margin-bottom:11px;
        border:1px solid rgba(248,213,138,.10);
        border-radius:15px;
        background:rgba(255,255,255,.025);
      }

      .lux-module-title {
        color:#f8d58a;
        font-weight:700;
        font-size:14px;
      }

      .lux-module-text {
        margin-top:7px;
        color:#bbb;
        line-height:1.6;
        font-size:12px;
      }

      .lux-module-status {
        margin-top:9px;
        color:#f8d58a;
        font-size:11px;
      }

      .lux-module-date {
        margin-top:8px;
        color:#666;
        font-size:10px;
      }

      .lux-module-intro {
        display:flex;
        align-items:center;
        gap:12px;
        margin-bottom:14px;
        padding:14px;
        border-radius:14px;
        background:rgba(255,255,255,.025);
      }

      .lux-module-icon {
        width:45px;
        height:45px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:12px;
        border:1px solid rgba(248,213,138,.2);
        color:#f8d58a;
        font-size:10px;
        font-weight:bold;
      }

      .lux-module-intro strong {
        color:#fff;
        font-size:14px;
      }

      .lux-module-intro p {
        margin:4px 0 0;
        color:#777;
        font-size:11px;
      }

      .lux-stars {
        color:#f8d58a;
        letter-spacing:3px;
        font-size:19px;
      }


      /* =========================================
         RESPONSIVO
         ========================================= */

      @media (max-width:680px) {

        .lux-model-card {
          padding:16px;
        }

        .lux-model-grid {
          grid-template-columns:1fr;
        }

        .lux-ficha-grid {
          grid-template-columns:1fr;
        }

        .lux-plans-grid {
          grid-template-columns:1fr;
        }

        .lux-plan-card.diamond {
          order:-1;
        }

      }


      @media (max-width:430px) {

        .lux-model-top {
          display:block;
        }

        .lux-model-status {
          margin-top:12px;
        }

        .lux-model-bottom {
          align-items:stretch;
          flex-direction:column;
        }

        .lux-btn-ficha {
          justify-content:center;
        }

        .lux-ficha-header {
          align-items:flex-start;
        }

        .lux-modal-content {
          padding:14px;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =========================================================
     VERSÃO
     ========================================================= */

  window.LUX_ADMIN_VERSION =
    VERSAO;


  console.log(
    "[LUX ADMIN V2.0] JavaScript carregado com sucesso."
  );


})();
