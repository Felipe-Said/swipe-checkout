"use client"

import * as React from "react"
import { Settings2, Code, Terminal, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WhopAdvancedSettings() {
  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden mt-6">
       <Accordion type="single" collapsible>
          <AccordionItem value="advanced" className="border-b-0">
             <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                   <Settings2 className="h-5 w-5 text-muted-foreground" />
                   <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Modo Avançado</span>
                </div>
             </AccordionTrigger>
             <AccordionContent className="px-6 pb-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Company ID</Label>
                         <Input 
                           value="comp_823904823" 
                           readOnly 
                           className="h-10 bg-muted/20 border-primary/5 rounded-lg font-mono text-xs" 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Webhook Endpoint</Label>
                         <div className="relative">
                            <Input 
                              value="https://api.swipe.com/hooks/whop/84920" 
                              readOnly 
                              className="h-10 bg-muted/20 border-primary/5 rounded-lg font-mono text-[10px] pr-10" 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                               <Terminal className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Success URL</Label>
                         <Input 
                           value="https://checkout.swipe.com/success" 
                           readOnly 
                           className="h-10 bg-muted/20 border-primary/5 rounded-lg text-xs" 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cancel URL</Label>
                         <Input 
                           value="https://checkout.swipe.com/cancel" 
                           readOnly 
                           className="h-10 bg-muted/20 border-primary/5 rounded-lg text-xs" 
                         />
                      </div>
                   </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-black/40 border border-primary/5 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                   <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                      <Code className="h-3 w-3" />
                      LAST RAW VALIDATION PAYLOAD
                   </div>
                   <pre>
{`{
  "company": {
    "id": "comp_823904823",
    "name": "Swipe Enterprise",
    "plan": "Whop Business"
  },
  "readiness": {
    "checkout_configs": true,
    "webhooks": "active",
    "scopes": ["read_checkouts", "write_configs"]
  }
}`}
                   </pre>
                </div>
             </AccordionContent>
          </AccordionItem>
       </Accordion>
    </Card>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
