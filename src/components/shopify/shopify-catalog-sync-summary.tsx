"use client"

import * as React from "react"
import { BarChart3, Package, Layers, Calendar, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ShopifyCatalogSyncSummaryProps {
  productCount: number
  variantCount: number
  lastSync: string
}

export function ShopifyCatalogSyncSummary({ 
  productCount, 
  variantCount, 
  lastSync 
}: ShopifyCatalogSyncSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
       <Card className="bg-card/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
          <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                   <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Produtos</p>
                  <p className="text-2xl font-black">{productCount}</p>
                </div>
             </div>
          </CardContent>
       </Card>

       <Card className="bg-card/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors">
          <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                   <Layers className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Variantes</p>
                  <p className="text-2xl font-black">{variantCount}</p>
                </div>
             </div>
          </CardContent>
       </Card>

       <Card className="bg-card/50 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-colors sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Última Sincronia</p>
                  <div className="flex items-center gap-2">
                     <p className="text-lg font-bold">{lastSync}</p>
                     <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
             </div>
          </CardContent>
       </Card>
    </div>
  )
}
