"use client"

import { LegalPageShell } from "@/components/legal/legal-page-shell"

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Termos"
      title="Termos de Servico"
      updatedAt="29 de marco de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">1. Aceitacao</h2>
        <p>
          Ao acessar, criar conta ou utilizar a Swipe, voce concorda com estes
          Termos de Servico e com a Politica de Privacidade aplicavel ao uso da
          plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">2. Objeto do servico</h2>
        <p>
          A Swipe oferece recursos para criacao, gestao e operacao de
          checkouts, integracoes, fluxos operacionais, administracao de contas e
          funcoes relacionadas a vendas digitais e ecommerce.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">3. Conta e acesso</h2>
        <p>
          O usuario e responsavel pela veracidade das informacoes fornecidas, pela
          seguranca de suas credenciais e por toda atividade realizada em sua
          conta. A Swipe pode restringir, suspender ou encerrar acessos em caso
          de uso indevido, fraude, violacao destes termos ou necessidade
          operacional.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">4. Uso permitido</h2>
        <p>Voce concorda em nao utilizar a plataforma para:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>atividades ilegais, fraudulentas ou enganosas;</li>
          <li>violacao de direitos de terceiros;</li>
          <li>distribuicao de malware, spam ou abuso tecnico;</li>
          <li>burlar mecanismos de seguranca, cobranca ou autorizacao;</li>
          <li>usar a plataforma de maneira que prejudique sua estabilidade.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">5. Integracoes e servicos de terceiros</h2>
        <p>
          A Swipe pode depender de integracoes e servicos de terceiros para
          executar determinadas funcionalidades. O uso desses servicos pode estar
          sujeito aos termos, politicas, disponibilidade e limitacoes dos
          respectivos provedores.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">6. Pagamentos, saques e operacao</h2>
        <p>
          Recursos financeiros, de saque, aprovacao, gateway, pedidos ou
          integracoes podem depender de configuracoes especificas, validacoes
          internas, aprovacoes administrativas e disponibilidade de provedores
          externos. A Swipe pode recusar, revisar ou limitar operacoes quando
          necessario para seguranca, compliance ou integridade da plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">7. Disponibilidade e alteracoes</h2>
        <p>
          A plataforma pode ser atualizada, modificada, suspensa ou descontinuada
          total ou parcialmente, com ou sem aviso previo, por razoes tecnicas,
          comerciais, legais ou operacionais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">8. Limitacao de responsabilidade</h2>
        <p>
          Na extensao maxima permitida pela legislacao aplicavel, a Swipe nao se
          responsabiliza por danos indiretos, lucros cessantes, perda de dados,
          indisponibilidade causada por terceiros, falhas de integracao externas
          ou eventos fora de seu controle razoavel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">9. Propriedade intelectual</h2>
        <p>
          O software, interfaces, estrutura, marcas, identidade visual e demais
          elementos da plataforma permanecem protegidos por direitos de
          propriedade intelectual e nao podem ser copiados, revendidos,
          licenciados ou explorados sem autorizacao.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">10. Alteracoes destes termos</h2>
        <p>
          Estes Termos de Servico podem ser atualizados a qualquer momento. A
          continuacao do uso da plataforma apos a publicacao de nova versao sera
          considerada como aceite da versao vigente.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">11. Contato</h2>
        <p>
          Para duvidas sobre estes termos, uso da plataforma ou operacao da sua
          conta, utilize os canais oficiais da Swipe disponibilizados no produto.
        </p>
      </section>
    </LegalPageShell>
  )
}
