import React from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

async function clearSwAndCachesBestEffort() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
}

export class ChunkLoadErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Errore sconosciuto";

    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown) {
    // Keep minimal logging; helps debugging without leaking auth data.
    console.error("Runtime error caught by boundary:", error);
  }

  private reload = () => {
    window.location.reload();
  };

  private clearAndReload = async () => {
    await clearSwAndCachesBestEffort();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.errorMessage || "";
    const looksLikeChunkError =
      /Importing a module script failed|Failed to fetch dynamically imported module|dynamically imported module/i.test(
        msg,
      );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <GlassCard className="p-6">
            <h1 className="font-display text-xl font-semibold">
              {looksLikeChunkError
                ? "Aggiornamento necessario"
                : "Si è verificato un errore"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {looksLikeChunkError
                ? "Sembra che il browser stia usando file non aggiornati. Ricarica la pagina per ripristinare l’app."
                : "Ricarica la pagina per continuare."}
            </p>

            <div className="mt-5 space-y-3">
              <Button onClick={this.reload} className="w-full">
                Ricarica
              </Button>
              <Button
                variant="outline"
                onClick={this.clearAndReload}
                className="w-full"
              >
                Pulisci cache e ricarica
              </Button>
            </div>

            {msg && (
              <details className="mt-4">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Dettagli tecnici
                </summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap break-words text-muted-foreground">
                  {msg}
                </pre>
              </details>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }
}
