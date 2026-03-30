"use client"

import { LegalPageShell } from "@/components/legal/legal-page-shell"

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacidade"
      title="Politica de Privacidade"
      updatedAt="29 de marco de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Informacoes coletadas</h2>
        <p>
          A Swipe pode coletar informacoes fornecidas diretamente por voce,
          como nome, e-mail, dados de acesso, dados de perfil, dados de conta,
          configuracoes operacionais e informacoes relacionadas ao uso da
          plataforma.
        </p>
        <p>
          Tambem podem ser tratados dados tecnicos e operacionais, como
          registros de login, eventos de checkout, configuracoes de integracao,
          endereco IP, navegador, dispositivo, fuso horario e logs de uso.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Finalidade do uso dos dados</h2>
        <p>Os dados podem ser utilizados para:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>criar, autenticar e administrar contas;</li>
          <li>operar checkouts, pedidos, saques e integracoes;</li>
          <li>prevenir fraude, abuso, falhas tecnicas e acessos indevidos;</li>
          <li>fornecer suporte, comunicacoes e melhorias de produto;</li>
          <li>cumprir obrigacoes legais, regulatorias e contratuais.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento de dados</h2>
        <p>
          A Swipe pode compartilhar dados estritamente quando necessario para a
          prestacao do servico, incluindo provedores de infraestrutura,
          autenticacao, hospedagem, analise, processamento de pagamentos,
          integracoes de ecommerce e autoridades competentes, quando exigido por
          lei.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Armazenamento e seguranca</h2>
        <p>
          A Swipe adota medidas tecnicas e organizacionais razoaveis para
          proteger dados pessoais e operacionais contra acesso nao autorizado,
          alteracao indevida, divulgacao, perda ou destruicao.
        </p>
        <p>
          Mesmo com boas praticas de seguranca, nenhum sistema pode garantir
          risco zero. Por isso, o usuario tambem deve manter suas credenciais em
          sigilo e usar a plataforma de forma responsavel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Retencao de dados</h2>
        <p>
          Os dados serao mantidos pelo periodo necessario para execucao da
          relacao contratual, cumprimento de obrigacoes legais, resolucao de
          disputas, auditoria, seguranca e preservacao da operacao da
          plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Direitos do usuario</h2>
        <p>
          Sempre que aplicavel pela legislacao, voce pode solicitar acesso,
          correcao, atualizacao ou exclusao de dados, bem como informacoes sobre
          tratamento e compartilhamento, respeitadas as limitacoes legais e
          operacionais da plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Cookies e tecnologias similares</h2>
        <p>
          A plataforma pode utilizar cookies, storage local e tecnologias
          semelhantes para autenticar sessoes, armazenar preferencias, melhorar
          experiencia de uso e apoiar funcoes analiticas e operacionais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Alteracoes desta politica</h2>
        <p>
          Esta Politica de Privacidade pode ser atualizada a qualquer momento.
          A versao mais recente publicada nesta pagina sera considerada a
          versao vigente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Contato</h2>
        <p>
          Para duvidas relacionadas a esta politica, ao uso da plataforma ou ao
          tratamento de dados, utilize os canais oficiais da Swipe informados na
          propria plataforma.
        </p>
      </section>
    </LegalPageShell>
  )
}
