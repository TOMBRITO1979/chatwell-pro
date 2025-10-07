import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Users, Briefcase, CheckSquare, ShoppingCart, Wallet, TrendingUp, TrendingDown, Search } from "lucide-react";

const cores = {
  verde: "#10bb82",
  azul: "#1e90ff",
  lilas: "#9370db",
  vermelho: "#ff4d4f",
};

const mockAgenda = [
  { id: "A-001", data: "2025-10-07 10:00", titulo: "Reunião Onboarding", local: "Zoom", participantes: 2, quando: "hoje" },
  { id: "A-002", data: "2025-10-08 09:30", titulo: "Brief Cliente X", local: "Escritório", participantes: 3, quando: "amanhã" },
  { id: "A-003", data: "2025-10-09 14:00", titulo: "Entrega Proposta", local: "Google Meet", participantes: 1, quando: "depois" },
  ...Array.from({ length: 12 }).map((_, i) => ({ id: `A-EX-${i+1}`, data: "2025-10-10 08:00", titulo: `Evento ${i+1}`, local: "Remoto", participantes: 2, quando: "depois" }))
].flat().slice(0, 25);

const mockContas = [
  { id: "C-001", vencimento: "2025-10-07", nome: "Internet", valor: 89.9, quando: "hoje" },
  { id: "C-002", vencimento: "2025-10-08", nome: "Aluguel", valor: 1500, quando: "amanhã" },
  { id: "C-003", vencimento: "2025-10-09", nome: "Software", valor: 35.0, quando: "depois" },
  ...Array.from({ length: 20 }).map((_, i) => ({ id: `C-EX-${i+1}`, vencimento: "2025-10-15", nome: `Conta ${i+1}`, valor: 50 + i, quando: "depois" }))
].flat().slice(0, 30);

const mockTarefas = [
  { id: "T-001", titulo: "Ligar para fornecedor", vencimento: "2025-10-07", status: "pendente" },
  { id: "T-002", titulo: "Enviar orçamento", vencimento: "2025-10-07", status: "pendente" },
  { id: "T-003", titulo: "Revisar contrato", vencimento: "2025-10-08", status: "em_andamento" },
  ...Array.from({ length: 20 }).map((_, i) => ({ id: `T-EX-${i+1}`, titulo: `Tarefa ${i+1}`, vencimento: "2025-10-10", status: i % 2 ? "pendente" : "concluida" }))
].flat();

const mockCompras = Array.from({ length: 25 }).map((_, i) => ({
  id: `L-${i+1}`, item: `Item ${i+1}`, qtd: 1 + (i % 4), un: "un.", notas: i % 3 ? "" : "Prioridade"
}));

const mockProjetos = [
  { id: "P-010", nome: "Implantação CRM", status: "pendente", orcamento: 25000 },
  { id: "P-001", nome: "Website ACME", status: "iniciando", orcamento: 8000 },
  { id: "P-002", nome: "ERP Lite", status: "em_andamento", orcamento: 42000 },
  { id: "P-099", nome: "App Mobile", status: "concluido", orcamento: 15000 },
  ...Array.from({ length: 12 }).map((_, i) => ({ id: `P-EX-${i+1}`, nome: `Projeto ${i+1}`, status: ["pendente","iniciando","em_andamento","concluido"][i%4], orcamento: 5000 + i*700 }))
].flat();

export default function Dashboard() {
  const top10Agenda = useMemo(() => mockAgenda.slice(0,10), []);
  const top10Contas = useMemo(() => mockContas.slice(0,10), []);
  const top10Tarefas = useMemo(() => mockTarefas.slice(0,10), []);
  const top10Compras = useMemo(() => mockCompras.slice(0,10), []);

  const projetosOrdenados = useMemo(() => {
    const ordem = { pendente: 0, iniciando: 1, em_andamento: 2, concluido: 3 };
    return [...mockProjetos].sort((a,b)=> ordem[a.status]-ordem[b.status]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-red-100 text-red-800';
      case 'iniciando': return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Dashboard — Chatwell Pro</h1>
          <p className="text-sm text-muted-foreground">Visão geral: agenda, contas, tarefas, compras e projetos.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar... (nome, data, nº conf., etc.)" className="w-64 pl-10" />
          </div>
          <Button className="bg-gradient-to-r from-chatwell-green to-chatwell-blue text-white hover:opacity-90">
            Filtrar
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 rounded-2xl border-t-4 border-chatwell-blue shadow-sm card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-chatwell-blue">
              <CalendarIcon className="w-5 h-5"/>
              Agenda — hoje, amanhã, depois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hoje">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="hoje">Hoje</TabsTrigger>
                <TabsTrigger value="amanha">Amanhã</TabsTrigger>
                <TabsTrigger value="depois">Depois</TabsTrigger>
              </TabsList>
              {(["hoje","amanha","depois"]).map((tab)=> (
                <TabsContent key={tab} value={tab} className="mt-3">
                  <ScrollArea className="h-64 pr-3">
                    <ul className="space-y-2">
                      {top10Agenda.filter(a=> a.quando === (tab === "amanha"? "amanhã" : tab)).map((a)=> (
                        <li key={a.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-blue-50 transition-colors">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{a.titulo}</p>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                              <Clock className="w-4 h-4"/>
                              {a.data} • {a.local}
                            </p>
                          </div>
                          <Badge variant="blue" className="shrink-0 flex items-center gap-1">
                            <Users className="w-4 h-4"/>
                            {a.participantes}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-t-4 border-chatwell-red shadow-sm card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-chatwell-red">
              <Wallet className="w-5 h-5"/>
              Contas (hoje/amanhã/depois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-3">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left border-b">
                    <th className="py-2 pl-2 font-medium">Vencimento</th>
                    <th className="font-medium">Nome</th>
                    <th className="text-right font-medium">Valor</th>
                    <th className="text-right pr-2 font-medium">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Contas.map((c)=> (
                    <tr key={c.id} className="border-b hover:bg-red-50 transition-colors">
                      <td className="py-2 pl-2">{c.vencimento}</td>
                      <td>{c.nome}</td>
                      <td className="text-right">R$ {c.valor.toFixed(2)}</td>
                      <td className="text-right pr-2">
                        <Badge variant="outline" className="border-chatwell-red text-chatwell-red">
                          {c.quando}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-t-4 border-chatwell-green shadow-sm card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-chatwell-green">
              <CheckSquare className="w-5 h-5"/>
              Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-3">
              <ul className="space-y-2">
                {top10Tarefas.map((t)=> (
                  <li key={t.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-green-50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">Venc.: {t.vencimento}</p>
                    </div>
                    <Badge className={getStatusColor(t.status)}>
                      {t.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-t-4 border-chatwell-blue shadow-sm card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-chatwell-blue">
              <ShoppingCart className="w-5 h-5"/>
              Lista de compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-3">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="text-left border-b">
                    <th className="py-2 font-medium">Item</th>
                    <th className="font-medium">Qtd</th>
                    <th className="font-medium">Un.</th>
                    <th className="font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Compras.map((l)=> (
                    <tr key={l.id} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="py-2 truncate">{l.item}</td>
                      <td>{l.qtd}</td>
                      <td>{l.un}</td>
                      <td className="truncate">{l.notas || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-t-4 border-chatwell-purple shadow-sm card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-chatwell-purple">
              <Briefcase className="w-5 h-5"/>
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-3">
              <ul className="space-y-2">
                {projetosOrdenados.slice(0,10).map((p)=> (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-purple-50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Orçamento: R$ {p.orcamento.toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(p.status)}>
                      {p.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <footer className="text-xs text-muted-foreground pt-2 border-t">
        <p>Dashboard com dados de exemplo. Sistema completo de gestão empresarial com agenda, clientes, projetos e finanças.</p>
      </footer>
    </div>
  );
}