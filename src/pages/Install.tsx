import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, CheckCircle2, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-card max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Application installée !</CardTitle>
            <CardDescription>
              FleetManager est maintenant disponible sur votre écran d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/")} className="w-full">
              Ouvrir l'application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass-card max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Installer FleetManager</CardTitle>
          <CardDescription>
            Installez l'application sur votre téléphone pour un accès rapide et hors ligne
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Android/Chrome installation */}
          {isInstallable && !isIOS && (
            <div className="space-y-4">
              <Button onClick={handleInstallClick} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Installer l'application
              </Button>
            </div>
          )}

          {/* iOS installation instructions */}
          {isIOS && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Installation sur iPhone
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Appuyez sur le bouton <strong>Partager</strong> en bas de Safari</li>
                  <li>2. Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
                  <li>3. Appuyez sur <strong>Ajouter</strong></li>
                </ol>
              </div>
            </div>
          )}

          {/* Generic fallback */}
          {!isInstallable && !isIOS && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Pour installer l'application, ouvrez ce site dans votre navigateur mobile
                et suivez les instructions d'installation.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Avantages :</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Accès rapide depuis l'écran d'accueil</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Fonctionne hors ligne</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <span>Expérience comme une application native</span>
              </li>
            </ul>
          </div>

          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Continuer sur le navigateur
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
