import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardList, RefreshCw, Plus, Pencil, Trash2, Zap, DollarSign, Upload, X, Award, Globe
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  name: string;
  description: string | null;
  min_computing_power: number;
  base_daily_reward: number;
  image_url: string | null;
  is_active: boolean | null;
  min_referral_level: string | null;
  target_region: string | null;
  created_at: string;
}

interface ReferralLevel {
  name: string;
  position_title: string | null;
  sort_order: number;
}

const emptyForm = {
  name: "",
  description: "",
  min_computing_power: "0",
  base_daily_reward: "0",
  image_url: "",
  is_active: true,
  min_referral_level: "",
  target_region: "africa",
};

const regionOptions = [
  { value: "africa", label: "Africa" },
  { value: "europe", label: "Europa" },
  { value: "asia", label: "Asia" },
  { value: "north_america", label: "Nord America" },
  { value: "south_america", label: "Sud America" },
  { value: "oceania", label: "Oceania" },
  { value: "global", label: "Globale" },
];

export const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralLevels = async () => {
    try {
      const { data, error } = await supabase
        .from("referral_levels")
        .select("name, position_title, sort_order")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setReferralLevels(data || []);
    } catch (error: any) {
      console.error("Error fetching referral levels:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchReferralLevels();
  }, []);

  const openCreateDialog = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setForm({
      name: task.name,
      description: task.description || "",
      min_computing_power: task.min_computing_power.toString(),
      base_daily_reward: task.base_daily_reward.toString(),
      image_url: task.image_url || "",
      is_active: task.is_active ?? true,
      min_referral_level: task.min_referral_level || "",
      target_region: task.target_region || "africa",
    });
    setImagePreview(task.image_url || null);
    setDialogOpen(true);
  };

  const getLevelDisplayName = (levelName: string | null) => {
    if (!levelName) return null;
    const level = referralLevels.find(l => l.name === levelName);
    return level?.position_title || levelName;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Seleziona un'immagine valida", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "L'immagine deve essere inferiore a 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("task-images")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: urlData.publicUrl });
      setImagePreview(urlData.publicUrl);
      toast({ title: "Immagine caricata!" });
    } catch (error: any) {
      toast({
        title: "Errore caricamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setForm({ ...form, image_url: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Inserisci un nome", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        min_computing_power: parseFloat(form.min_computing_power) || 0,
        base_daily_reward: parseFloat(form.base_daily_reward) || 0,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        min_referral_level: form.min_referral_level || null,
        target_region: form.target_region || "africa",
      };

      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", editingTask.id);
        if (error) throw error;
        toast({ title: "Compito aggiornato!" });
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
        toast({ title: "Compito creato!" });
      }

      setDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskToDelete.id);
      if (error) throw error;
      toast({ title: "Compito eliminato!" });
      setDeleteDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Gestione Compiti</h2>
              <p className="text-sm text-muted-foreground">
                {tasks.length} compiti configurati
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchTasks}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={openCreateDialog} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuovo
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Tasks List */}
      {loading ? (
        <GlassCard className="p-8 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : tasks.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nessun compito configurato</p>
          <Button onClick={openCreateDialog} className="mt-4 gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Crea il primo compito
          </Button>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <GlassCard 
              key={task.id} 
              className={`p-4 ${!task.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {task.image_url ? (
                    <img 
                      src={task.image_url} 
                      alt={task.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display font-bold">{task.name}</h3>
                    <span className={`text-xs ${task.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                      {task.is_active ? "Attivo" : "Disattivato"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(task)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-background/50 rounded-lg p-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-mono">{task.min_computing_power} TH/s</span>
                </div>
                <div className="bg-background/50 rounded-lg p-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="font-mono">{task.base_daily_reward} USDC/g</span>
                </div>
              </div>

              {task.min_referral_level && (
                <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    Min: {getLevelDisplayName(task.min_referral_level)}
                  </span>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border/50 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {editingTask ? "Modifica Compito" : "Nuovo Compito"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es: Mining Bitcoin Base"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrizione del compito..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Potenza Minima (TH/s)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_computing_power}
                  onChange={(e) => setForm({ ...form, min_computing_power: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Reward Giornaliero (USDC)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_daily_reward}
                  onChange={(e) => setForm({ ...form, base_daily_reward: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Immagine</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative w-full">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-32 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Caricamento...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span>Carica immagine</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Livello Minimo Richiesto
              </Label>
              <Select
                value={form.min_referral_level || "none"}
                onValueChange={(value) => setForm({ ...form, min_referral_level: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nessun requisito (tutti)" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  <SelectItem value="none">Nessun requisito (tutti)</SelectItem>
                  {referralLevels.map((level) => (
                    <SelectItem key={level.name} value={level.name}>
                      {level.position_title || level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Solo utenti con questo livello o superiore potranno partecipare
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Regione Target
              </Label>
              <Select
                value={form.target_region}
                onValueChange={(value) => setForm({ ...form, target_region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona regione" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {regionOptions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mostra all'utente quale parte del mondo sta aiutando
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Attivo</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>

            <Button 
              className="w-full gradient-primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvataggio..." : editingTask ? "Aggiorna" : "Crea Compito"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo compito?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare "{taskToDelete?.name}". Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
