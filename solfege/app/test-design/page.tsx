import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestDesignPage() {
  return (
    <div className="p-10 bg-bg min-h-screen space-y-8 font-sans">
      <h1 className="font-serif text-4xl text-orange">Solfège Design System Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Pulsanti e Colori</CardTitle>
          </CardHeader>
          <CardContent className="space-x-4">
            <Button className="bg-orange hover:bg-orange-dark text-white">
              Pulsante Arancio
            </Button>
            <Button variant="outline" className="border-border text-muted-foreground">
              Pulsante Secondario
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Badge e Stati</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-wrap gap-2">
            <Badge className="bg-green-light text-green border-0">Pagato</Badge>
            <Badge className="bg-red-light text-red border-0">Scaduto</Badge>
            <Badge className="bg-amber-light text-amber border-0">In Recupero</Badge>
            <Badge className="bg-orange-light text-orange border-0">Nuovo</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 bg-sidebar-bg rounded-lg">
        <p className="text-sidebar-text">Test Sidebar: Testo in Sidebar Text su Sfondo Sidebar BG</p>
        <p className="text-sidebar-active font-bold">Voce Attiva Sidebar (Arancio)</p>
      </div>
    </div>
  );
}
