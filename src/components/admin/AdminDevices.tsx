import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Cpu, Plus, Pencil, RefreshCw, Trash2, Upload, ImageIcon, X 
} from "lucide-react";

interface MiningDevice {
  id: string;
  name: string;
  price: number;
  computing_power: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_promo: boolean | null;
}

export const AdminDevices = () => {
  const [devices, setDevices] = useState<MiningDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<MiningDevice | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    computing_power: "",
    description: "",
    image_url: "",
    is_active: true,
    is_promo: false,
  });
  const { toast } = useToast();

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mining_devices")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setDevices(data || []);
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

  useEffect(() => {
    fetchDevices();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      computing_power: "",
      description: "",
      image_url: "",
      is_active: true,
      is_promo: false,
    });
    setEditingDevice(null);
    setImagePreview(null);
  };

  const openEditDialog = (device: MiningDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      price: device.price.toString(),
      computing_power: device.computing_power.toString(),
      description: device.description || "",
      image_url: device.image_url || "",
      is_active: device.is_active ?? true,
      is_promo: device.is_promo ?? false,
    });
    setImagePreview(device.image_url || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "L'immagine deve essere inferiore a 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("device-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("device-images")
        .getPublicUrl(data.path);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      setImagePreview(urlData.publicUrl);
      toast({ title: "Immagine caricata!" });
    } catch (error: any) {
      toast({
        title: "Errore upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image_url: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const deviceData = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      computing_power: parseFloat(formData.computing_power),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || null,
      is_active: formData.is_active,
      is_promo: formData.is_promo,
    };

    try {
      if (editingDevice) {
        const { error } = await supabase
          .from("mining_devices")
          .update(deviceData)
          .eq("id", editingDevice.id);
        
        if (error) throw error;
        toast({ title: "Dispositivo aggiornato!" });
      } else {
        const { error } = await supabase
          .from("mining_devices")
          .insert(deviceData);
        
        if (error) throw error;
        toast({ title: "Dispositivo creato!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchDevices();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if any users own this device
      const { data: userDevices, error: checkError } = await supabase
        .from("user_devices")
        .select("id")
        .eq("device_id", id);

      if (checkError) throw checkError;

      if (userDevices && userDevices.length > 0) {
        toast({
          title: "Impossibile eliminare",
          description: `Questo dispositivo è posseduto da ${userDevices.length} utent${userDevices.length === 1 ? 'e' : 'i'}. Disattivalo invece di eliminarlo.`,
          variant: "destructive",
        });
        return;
      }

      if (!confirm("Sei sicuro di voler eliminare questo dispositivo?")) return;

      const { error } = await supabase
        .from("mining_devices")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Dispositivo eliminato!" });
      fetchDevices();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Dispositivi Mining</h2>
              <p className="text-sm text-muted-foreground">{devices.length} dispositivi</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDevices}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDevice ? "Modifica Dispositivo" : "Nuovo Dispositivo"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    {/* Image Upload Section */}
                    <div className="space-y-2">
                      <Label>Immagine Dispositivo</Label>
                      <div className="flex flex-col gap-3">
                        {imagePreview ? (
                          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-background/50">
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="w-full h-full object-contain"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={removeImage}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="w-full h-40 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="w-10 h-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Clicca per caricare un'immagine
                            </p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        {!imagePreview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full"
                          >
                            {uploading ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploading ? "Caricamento..." : "Carica Immagine"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Es: Antminer S19"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prezzo ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="100.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Potenza (TH/s) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.computing_power}
                          onChange={(e) => setFormData({ ...formData, computing_power: e.target.value })}
                          placeholder="50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrizione</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrizione opzionale"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Attivo</Label>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>In Promo (mostra in alto)</Label>
                      <Switch
                        checked={formData.is_promo}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_promo: checked })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary">
                    {editingDevice ? "Salva Modifiche" : "Crea Dispositivo"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <GlassCard className="p-8 col-span-full flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : devices.length === 0 ? (
          <GlassCard className="p-8 col-span-full text-center text-muted-foreground">
            Nessun dispositivo. Creane uno nuovo!
          </GlassCard>
        ) : (
          devices.map((device) => (
            <GlassCard key={device.id} className={`p-4 ${!device.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                {device.image_url ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-background/50">
                    <img 
                      src={device.image_url} 
                      alt={device.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-primary-foreground" />
                  </div>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(device)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(device.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-display font-bold text-lg">{device.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${device.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {device.is_active ? "Attivo" : "Non Attivo"}
                </span>
                {device.is_promo && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-bold">
                    PROMO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {device.description || "Nessuna descrizione"}
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Prezzo</p>
                  <p className="font-mono font-bold">${device.price}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Potenza</p>
                  <p className="font-mono font-bold">{device.computing_power} TH/s</p>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
