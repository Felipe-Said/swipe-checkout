"use client"

import * as React from "react"

import {
  loadGatewayPageForSession,
  saveGatewayAdminConfig,
  saveGatewayUserConfig,
  validateGatewayAdminConfig,
  type GatewayPayoutMethod,
} from "@/app/actions/gateway"
import { getCurrentAppSession, writeAppSession } from "@/lib/app-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SessionRole = "admin" | "user"

export default function GatewayPage() {
  const [sessionUserId, setSessionUserId] = React.useState("")
  const [accountId, setAccountId] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<SessionRole>("user")
  const [enabled, setEnabled] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [warnings, setWarnings] = React.useState<string[]>([])
  const [payoutMethods, setPayoutMethods] = React.useState<GatewayPayoutMethod[]>([])

  const [adminApiKey, setAdminApiKey] = React.useState("")
  const [adminCompanyId, setAdminCompanyId] = React.useState("")
  const [adminFeeRate, setAdminFeeRate] = React.useState("0")
  const [platformCoversFees, setPlatformCoversFees] = React.useState(false)
  const [adminSaving, setAdminSaving] = React.useState(false)
  const [adminValidating, setAdminValidating] = React.useState(false)

  const [userPayoutMethodId, setUserPayoutMethodId] = React.useState("")
  const [userPayoutMethodLabel, setUserPayoutMethodLabel] = React.useState("")
  const [userAutoPayoutEnabled, setUserAutoPayoutEnabled] = React.useState(false)
  const [userWhopConnected, setUserWhopConnected] = React.useState(false)
  const [userSaving, setUserSaving] = React.useState(false)

  const loadData = React.useCallback(async (userId: string, nextAccountId?: string | null) => {
    const result = await loadGatewayPageForSession({
      userId,
      accountId: nextAccountId,
    })

    if ("error" in result) {
      setWarnings([result.error])
      setLoaded(true)
      return
    }

    setRole(result.role)
    setEnabled(result.enabled)
    setWarnings(result.warnings)
    setPayoutMethods(result.payoutMethods)

    if (result.adminSettings) {
      setAdminApiKey(result.adminSettings.whopApiKey)
      setAdminCompanyId(result.adminSettings.whopCompanyId)
      setAdminFeeRate(result.adminSettings.feeRate.toString())
      setPlatformCoversFees(result.adminSettings.platformCoversFees)
    }

    if (result.userSettings) {
      setUserPayoutMethodId(result.userSettings.payoutMethodId)
      setUserPayoutMethodLabel(result.userSettings.payoutMethodLabel)
      setUserAutoPayoutEnabled(result.userSettings.autoPayoutEnabled)
      setUserWhopConnected(result.userSettings.whopConnected)
    }

    setLoaded(true)
  }, [])

  React.useEffect(() => {
    async function load() {
      const session = await getCurrentAppSession()
      if (!session?.userId) {
        setLoaded(true)
        return
      }

      setSessionUserId(session.userId)
      setAccountId(session.accountId)
      setRole(session.role)
      setEnabled(session.gatewayModeEnabled === true)
      await loadData(session.userId, session.accountId)
    }

    void load()
  }, [loadData])

  const handleSaveAdmin = async () => {
    if (!sessionUserId || adminSaving) {
      return
    }

    setAdminSaving(true)
    const result = await saveGatewayAdminConfig({
      userId: sessionUserId,
      whopApiKey: adminApiKey,
      whopCompanyId: adminCompanyId,
      feeRate: Number(adminFeeRate || 0),
      platformCoversFees,
    })

    if (result.error) {
      setWarnings([result.error])
      setAdminSaving(false)
      return
    }

    await loadData(sessionUserId, accountId)
    setAdminSaving(false)
  }

  const handleValidateAdmin = async () => {
    if (!sessionUserId || adminValidating) {
      return
    }

    setAdminValidating(true)
    const result = await validateGatewayAdminConfig({ userId: sessionUserId })
    if (result.error) {
      setWarnings([result.error])
      setAdminValidating(false)
      return
    }

    setPayoutMethods(result.payoutMethods ?? [])
    setWarnings([])
    setAdminValidating(false)
  }

  const handleSaveUser = async () => {
    if (!sessionUserId || userSaving) {
      return
    }

    const selected = payoutMethods.find((item) => item.id === userPayoutMethodId)
    setUserSaving(true)
    const result = await saveGatewayUserConfig({
      userId: sessionUserId,
      accountId,
      payoutMethodId: userPayoutMethodId,
      payoutMethodLabel: selected?.label || userPayoutMethodLabel,
      autoPayoutEnabled: userAutoPayoutEnabled,
    })

    if (result.error) {
      setWarnings([result.error])
      setUserSaving(false)
      return
    }

    const currentSession = await getCurrentAppSession()
    if (currentSession) {
      writeAppSession({
        ...currentSession,
        gatewayModeEnabled: true,
      })
    }

    await loadData(sessionUserId, accountId)
    setUserSaving(false)
  }

  if (!loaded) {
    return <div className="min-h-[320px]" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {role === "admin" ? "Modo Gateway" : "Gateway"}
        </h1>
        <p className="text-muted-foreground">
          {role === "admin"
            ? "Configure a conta Whop que vai operar o modo gateway da Swipe e receber as taxas dos saques automaticos."
            : "Escolha o destino de payout da sua conta e habilite o saque automatico quando o modo gateway estiver ativo."}
        </p>
      </div>

      {!enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Modo gateway desativado</CardTitle>
            <CardDescription>
              O toggle global desta funcionalidade fica em Configuracoes do painel admin.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {warnings.length > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle>Avisos</CardTitle>
            <CardDescription>Revise os pontos abaixo antes de operar o Gateway.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {role === "admin" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Conta Gateway da Whop</CardTitle>
              <CardDescription>
                Esta conta passa a operar as taxas e as transferencias do modo gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateway-api-key">API Key da conta gateway</Label>
                <Input
                  id="gateway-api-key"
                  value={adminApiKey}
                  onChange={(event) => setAdminApiKey(event.target.value)}
                  placeholder="sk_live_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gateway-company-id">Company ID da conta gateway</Label>
                <Input
                  id="gateway-company-id"
                  value={adminCompanyId}
                  onChange={(event) => setAdminCompanyId(event.target.value)}
                  placeholder="biz_xxxxxxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gateway-fee-rate">Taxa do gateway (%)</Label>
                <Input
                  id="gateway-fee-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={adminFeeRate}
                  onChange={(event) => setAdminFeeRate(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <div className="font-medium">Plataforma cobre as fees da Whop</div>
                  <div className="text-sm text-muted-foreground">
                    Ative se a conta gateway assumir a fee operacional do payout no lugar da conta do usuario.
                  </div>
                </div>
                <Switch checked={platformCoversFees} onCheckedChange={setPlatformCoversFees} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSaveAdmin} disabled={adminSaving}>
                  {adminSaving ? "Salvando..." : "Salvar configuracao"}
                </Button>
                <Button variant="outline" onClick={handleValidateAdmin} disabled={adminValidating}>
                  {adminValidating ? "Validando..." : "Validar conexao"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destino e operacao</CardTitle>
              <CardDescription>
                A taxa de cada saque automatico e transferida para a conta gateway configurada acima.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>Saques do usuario respeitam a janela de 2 dias ja existente.</div>
              <div>Quando o usuario solicitar saque, o valor liquido vai para o payout method salvo por ele no Gateway.</div>
              <div>Se houver taxa, a tentativa de transferencia vai primeiro para a conta gateway da Whop configurada neste painel.</div>
              <div>Se o Gateway estiver desligado ou incompleto, a plataforma continua no fluxo manual atual.</div>
              <div className="rounded-xl border p-3">
                <div className="font-medium text-foreground">Payout methods encontrados nesta conta</div>
                <div className="mt-2 space-y-2">
                  {payoutMethods.length > 0 ? (
                    payoutMethods.map((method) => (
                      <div key={method.id} className="rounded-lg border p-3">
                        <div className="font-medium text-foreground">{method.label}</div>
                        <div>{method.currency} • {method.reference}</div>
                      </div>
                    ))
                  ) : (
                    <div>Nenhum payout method foi carregado ainda nesta conta gateway.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Destino do saque automatico</CardTitle>
              <CardDescription>
                Selecione o payout method da sua conta Whop que recebera o valor liquido do saque.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateway-payout-method">Payout method</Label>
                <Select
                  value={userPayoutMethodId}
                  onValueChange={(value) => {
                    setUserPayoutMethodId(value)
                    const method = payoutMethods.find((item) => item.id === value)
                    setUserPayoutMethodLabel(method?.label ?? "")
                  }}
                >
                  <SelectTrigger id="gateway-payout-method">
                    <SelectValue placeholder="Selecione o destino de payout" />
                  </SelectTrigger>
                  <SelectContent>
                    {payoutMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.label} • {method.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <div className="font-medium">Saque automatico pelo gateway</div>
                  <div className="text-sm text-muted-foreground">
                    Quando ativo, a solicitacao de saque tenta disparar o payout real na Whop.
                  </div>
                </div>
                <Switch
                  checked={userAutoPayoutEnabled}
                  onCheckedChange={setUserAutoPayoutEnabled}
                  disabled={!userWhopConnected}
                />
              </div>

              <Button
                onClick={handleSaveUser}
                disabled={!userWhopConnected || !userPayoutMethodId || userSaving}
              >
                {userSaving ? "Salvando..." : "Salvar configuracao do gateway"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como esse modo funciona</CardTitle>
              <CardDescription>
                Esta pagina usa a documentacao de payout da Whop ligada a sua conta real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                {userWhopConnected
                  ? "Sua conta Whop esta conectada. Agora basta definir o payout method que deve receber seus saques."
                  : "Conecte sua conta Whop principal na pagina Whop antes de usar o Gateway."}
              </div>
              <div>O saque continua respeitando a janela de liberacao de 2 dias da plataforma.</div>
              <div>O valor liquido vai para o payout method salvo aqui.</div>
              <div>A taxa configurada pelo admin e aplicada no mesmo fluxo do saque automatico.</div>
              <div className="rounded-xl border p-3">
                <div className="font-medium text-foreground">Destinos encontrados</div>
                <div className="mt-2 space-y-2">
                  {payoutMethods.length > 0 ? (
                    payoutMethods.map((method) => (
                      <div key={method.id} className="rounded-lg border p-3">
                        <div className="font-medium text-foreground">{method.label}</div>
                        <div>{method.currency} • {method.reference}</div>
                      </div>
                    ))
                  ) : (
                    <div>Nenhum payout method disponivel foi encontrado nesta conta.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
