import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as vendas realizadas através do Swipe.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">#1024</TableCell>
              <TableCell>João Silva</TableCell>
              <TableCell><Badge>Pago</Badge></TableCell>
              <TableCell>R$ 1.250,00</TableCell>
              <TableCell>24/03/2026</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">#1023</TableCell>
              <TableCell>Maria Oliveira</TableCell>
              <TableCell><Badge variant="outline">Pendente</Badge></TableCell>
              <TableCell>R$ 540,00</TableCell>
              <TableCell>23/03/2026</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
