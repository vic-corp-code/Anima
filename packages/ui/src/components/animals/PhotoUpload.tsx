"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface PhotoUploadProps {
  onPhotosChange: (urls: string[]) => void;
  // Uploads a single file to storage and resolves to its permanent,
  // servable URL. Injected so this component doesn't depend on Convex
  // directly (same pattern as AnimalChat's injected extractAnimalData/
  // createAnimal props) — the caller wires in the actual backend call.
  uploadFile: (file: File) => Promise<string>;
  initialPhotos?: string[];
  maxPhotos?: number;
  maxSizeMB?: number;
  locale?: "fr" | "es";
}

export function PhotoUpload({
  onPhotosChange,
  uploadFile,
  initialPhotos = [],
  maxPhotos = 10,
  maxSizeMB = 5,
  locale = "fr",
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (fr: string, es: string) => (locale === "fr" ? fr : es);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding photos would exceed max
    if (photos.length + files.length > maxPhotos) {
      setError(
        t(
          `Maximum ${maxPhotos} photos autorisées`,
          `Máximo ${maxPhotos} fotos permitidas`
        )
      );
      return;
    }

    // Check file sizes
    const oversizedFiles = files.filter(
      (file) => file.size > maxSizeMB * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setError(
        t(
          `Les fichiers doivent faire moins de ${maxSizeMB} MB`,
          `Los archivos deben pesar menos de ${maxSizeMB} MB`
        )
      );
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const newPhotos = await Promise.all(files.map((file) => uploadFile(file)));
      const updatedPhotos = [...photos, ...newPhotos];

      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        t(
          "Erreur lors du téléchargement des photos",
          "Error al subir las fotos"
        )
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || photos.length >= maxPhotos}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || photos.length >= maxPhotos}
              variant="outline"
              className="w-full"
            >
              {uploading
                ? t("Téléchargement...", "Subiendo...")
                : t(
                    `+ Ajouter des photos (${photos.length}/${maxPhotos})`,
                    `+ Añadir fotos (${photos.length}/${maxPhotos})`
                  )}
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading}
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {photos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {t(
                  "Aucune photo. Cliquez pour ajouter.",
                  "Sin fotos. Haz clic para añadir."
                )}
              </p>
            </div>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">{t("Conseils:", "Consejos:")}</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>
                {t(
                  "Utilisez des photos bien éclairées",
                  "Usa fotos bien iluminadas"
                )}
              </li>
              <li>
                {t(
                  "Montrez l'animal de face et de profil",
                  "Muestra al animal de frente y de perfil"
                )}
              </li>
              <li>
                {t(
                  `Maximum ${maxSizeMB} MB par photo`,
                  `Máximo ${maxSizeMB} MB por foto`
                )}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
