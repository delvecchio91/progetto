import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Megaphone, Plus, Pencil, RefreshCw, Trash2, Upload, ImageIcon, X 
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  created_by: string | null;
}

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    is_active: true,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
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
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      image_url: "",
      is_active: true,
    });
    setEditingAnnouncement(null);
    setImagePreview(null);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      image_url: announcement.image_url ?? "",
      is_active: announcement.is_active ?? true,
    });
    setImagePreview(announcement.image_url || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive",
      });
      return;
    }

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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("announcement-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("announcement-images")
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
    
    const announcementData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      image_url: formData.image_url.trim() || null,
      is_active: formData.is_active,
      created_by: user?.id,
    };

    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update({
            title: announcementData.title,
            content: announcementData.content,
            image_url: announcementData.image_url,
            is_active: announcementData.is_active,
          })
          .eq("id", editingAnnouncement.id);
        
        if (error) throw error;
        toast({ title: "Annuncio aggiornato!" });
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert(announcementData);
        
        if (error) throw error;
        toast({ title: "Annuncio creato!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo annuncio?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Annuncio eliminato!" });
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentState: boolean | null) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;
      fetchAnnouncements();
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
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Annunci</h2>
              <p className="text-sm text-muted-foreground">{announcements.length} annunci totali</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAnnouncements}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAnnouncement ? "Modifica Annuncio" : "Nuovo Annuncio"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <Label>Immagine Annuncio</Label>
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
                    <Label>Titolo *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titolo dell'annuncio"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenuto *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Scrivi il contenuto dell'annuncio..."
                      rows={4}
                      maxLength={1000}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Attivo</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-accent">
                    {editingAnnouncement ? "Salva Modifiche" : "Pubblica Annuncio"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {loading ? (
          <GlassCard className="p-8 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassCard>
        ) : announcements.length === 0 ? (
          <GlassCard className="p-8 text-center text-muted-foreground">
            Nessun annuncio. Creane uno nuovo!
          </GlassCard>
        ) : (
          announcements.map((announcement) => (
            <GlassCard 
              key={announcement.id} 
              className={`p-4 ${!announcement.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  {announcement.image_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-background/50 shrink-0">
                      <img 
                        src={announcement.image_url} 
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg truncate">
                        {announcement.title}
                      </h3>
                      {!announcement.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Bozza</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {announcement.created_at
                        ? format(new Date(announcement.created_at), "dd MMM yyyy, HH:mm", { locale: it })
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={announcement.is_active ?? false}
                    onCheckedChange={() => toggleActive(announcement.id, announcement.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(announcement)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
