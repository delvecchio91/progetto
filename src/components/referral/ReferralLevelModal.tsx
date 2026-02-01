import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Zap, Award, TrendingUp, Gift, Star } from "lucide-react";

import { 
  level1Avatar, 
  level2Avatar, 
  level3Avatar, 
  level4Avatar, 
  level5Avatar, 
  level6Avatar 
} from "@/lib/avatars";

interface ReferralLevel {
  id: string;
  name: string;
  position_title: string | null;
  min_computing_power: number;
  min_members: number;
  monthly_salary: number;
  sort_order: number;
}

interface ReferralLevelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levels: ReferralLevel[];
  currentLevelName: string;
}

const LEVEL_DETAILS: Record<string, {
  avatar: string;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}> = {
  apprendista: {
    avatar: level1Avatar,
    title: "Apprendista",
    description: "Il punto di partenza del tuo percorso nel programma referral. Come Apprendista, stai muovendo i primi passi nel mondo del mining collaborativo. È il momento perfetto per imparare e iniziare a costruire la tua rete.",
    benefits: [
      "Accesso al programma referral",
      "Bonus del 5% sugli acquisti dei referral diretti",
      "Bonus del 3% sui guadagni dei compiti completati dai referral",
      "Possibilità di invitare nuovi membri"
    ],
    color: "from-amber-700 to-amber-500",
    icon: <Users className="w-5 h-5" />
  },
  tecnico_base: {
    avatar: level2Avatar,
    title: "Tecnico Base",
    description: "Hai dimostrato impegno e hai iniziato a costruire un piccolo team. Come Tecnico Base, hai acquisito le competenze fondamentali e stai contribuendo attivamente alla crescita della community.",
    benefits: [
      "Tutti i vantaggi del livello precedente",
      "Stipendio mensile garantito",
      "Riconoscimento come membro attivo",
      "Priorità nel supporto"
    ],
    color: "from-gray-400 to-gray-300",
    icon: <Zap className="w-5 h-5" />
  },
  tecnico_esperto: {
    avatar: level3Avatar,
    title: "Tecnico Esperto",
    description: "La tua esperienza sta crescendo rapidamente. Come Tecnico Esperto, sei diventato un punto di riferimento per i nuovi membri e il tuo team sta generando risultati significativi.",
    benefits: [
      "Stipendio mensile aumentato",
      "Accesso a promozioni esclusive",
      "Badge esclusivo sul profilo",
      "Supporto prioritario dedicato"
    ],
    color: "from-yellow-500 to-yellow-300",
    icon: <Award className="w-5 h-5" />
  },
  specialista: {
    avatar: level4Avatar,
    title: "Specialista",
    description: "Hai raggiunto un livello di eccellenza. Come Specialista, gestisci un team solido e contribuisci in modo significativo all'ecosistema. La tua dedizione viene ricompensata con benefici premium.",
    benefits: [
      "Stipendio mensile premium",
      "Accesso anticipato a nuove funzionalità",
      "Bonus esclusivi sulle promozioni",
      "Menzione nella community"
    ],
    color: "from-cyan-400 to-blue-400",
    icon: <TrendingUp className="w-5 h-5" />
  },
  responsabile: {
    avatar: level5Avatar,
    title: "Responsabile",
    description: "Sei un leader riconosciuto nella community. Come Responsabile, guidi un team numeroso e influente. Il tuo contributo è fondamentale per la crescita dell'intero ecosistema.",
    benefits: [
      "Stipendio mensile elevato",
      "Partecipazione alle decisioni della community",
      "Accesso a eventi esclusivi",
      "Riconoscimento pubblico come leader"
    ],
    color: "from-purple-500 to-pink-400",
    icon: <Gift className="w-5 h-5" />
  },
  direttore: {
    avatar: level6Avatar,
    title: "Direttore",
    description: "Hai raggiunto il vertice del programma referral. Come Direttore, sei tra i membri più influenti della community. La tua leadership e il tuo impegno hanno creato un impatto straordinario.",
    benefits: [
      "Stipendio mensile massimo",
      "Status VIP permanente",
      "Accesso diretto al team di sviluppo",
      "Bonus speciali e ricompense esclusive",
      "Influenza sulle strategie future"
    ],
    color: "from-yellow-400 to-orange-400",
    icon: <Star className="w-5 h-5" />
  }
};

export const ReferralLevelModal = ({ open, onOpenChange, levels, currentLevelName }: ReferralLevelModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-display">Sistema Referral</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {/* Intro Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="font-bold text-lg text-primary">Come Funziona?</h3>
              
              {/* Livello 1 - Referral Diretti */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Livello 1 — Referral Diretti</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ogni volta che un tuo referral diretto acquista un dispositivo, ricevi un <span className="text-primary font-semibold">bonus del 5%</span> sul valore dell'acquisto.
                  Inoltre, ricevi un <span className="text-green-400 font-semibold">bonus del 3%</span> sui guadagni generati dai compiti completati.
                </p>
              </div>

              {/* Livello 2 - Referral Indiretti */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Livello 2 — Referral Indiretti</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Guadagni anche dai referral dei tuoi referral! Se inviti "Luca" e lui invita "Mario", 
                  ricevi un <span className="text-primary font-semibold">bonus del 3%</span> sugli acquisti di Mario 
                  e un <span className="text-green-400 font-semibold">bonus dell'1%</span> sui suoi compiti completati.
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Man mano che il tuo team cresce e aumenta la potenza di calcolo complessiva, 
                avanzi di livello sbloccando <span className="text-green-400 font-semibold">stipendi mensili</span> sempre più alti e vantaggi esclusivi.
              </p>
            </motion.div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Levels Section */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-primary">I 6 Livelli</h3>
              
              {levels.map((level, index) => {
                const details = LEVEL_DETAILS[level.name];
                const isCurrentLevel = level.name === currentLevelName;
                
                if (!details) return null;

                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-xl border p-4 space-y-4 ${
                      isCurrentLevel 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30' 
                        : 'border-border/50 bg-card/50'
                    }`}
                  >
                    {isCurrentLevel && (
                      <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                        IL TUO LIVELLO
                      </Badge>
                    )}

                    {/* Avatar and Title */}
                    <div className="flex items-center gap-4">
                      <div className={`relative p-1 rounded-full bg-gradient-to-br ${details.color}`}>
                        <img 
                          src={details.avatar} 
                          alt={details.title}
                          className="w-20 h-20 rounded-full object-cover border-2 border-background"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{details.icon}</span>
                          <span className="text-sm text-muted-foreground">Livello {level.sort_order}</span>
                        </div>
                        <h4 className="text-xl font-display font-bold">{details.title}</h4>
                        
                        {level.monthly_salary > 0 && (
                          <p className="text-sm font-semibold text-green-400">
                            💰 {level.monthly_salary} USDC/mese
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {details.description}
                    </p>

                    {/* Requirements */}
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{level.min_members}+ membri</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span>{level.min_computing_power}+ TH/s</span>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Vantaggi
                      </p>
                      <ul className="space-y-1.5">
                        {details.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">✓</span>
                            <span className="text-foreground/80">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center py-4 space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                🚀 Continua a invitare amici per salire di livello!
              </p>
            </motion.div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
