'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, User } from 'lucide-react'

export default function AdminApprovalsPage() {
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchPending = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar usuários pendentes')
    } else {
      setPendingUsers(data || [])
    }
    setIsLoading(false)
  }

  React.useEffect(() => {
    fetchPending()
  }, [])

  const handleAction = async (userId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId)

    if (error) {
      toast.error(`Erro ao ${newStatus === 'approved' ? 'aprovar' : 'rejeitar'} usuário`)
    } else {
      toast.success(`Usuário ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`)
      fetchPending()
    }
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Aprovações Pendentes</h1>
        <p className="text-muted-foreground">Gerencie as novas solicitações de acesso à plataforma.</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <User className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="font-bold text-muted-foreground">Nenhuma solicitação pendente no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {user.name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="font-bold">{user.name || 'Sem nome'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    Pendente
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => handleAction(user.id, 'approved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive/20 text-destructive hover:bg-destructive/10"
                      onClick={() => handleAction(user.id, 'rejected')}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
