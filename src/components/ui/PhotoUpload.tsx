import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Check } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

interface PhotoUploadProps {
  label: string;
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  label,
  onUploadComplete,
  currentUrl,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // 1. Compression (< 300 Ko)
      const options = {
        maxSizeMB: 0.3, // 300 Ko
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Upload vers Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("interventions")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("interventions").getPublicUrl(filePath);

      setPreview(URL.createObjectURL(compressedFile));
      onUploadComplete(publicUrl);
    } catch (error: any) {
      console.error("Erreur d'upload:", error);
      toast.error(
        "Erreur lors de l'envoi de la photo : " +
        (error.message || "Erreur inconnue"),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-column gap-2">
      <label
        htmlFor={`photo-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
        className="text-xs font-black text-muted uppercase tracking-widest ml-1"
      >
        {label}
      </label>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
                    relative aspect-video w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer
                    ${preview ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"}
                `}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={24} />
            </div>
            <div className="absolute top-2 right-2 bg-status-green text-white p-1 rounded-full shadow-lg">
              <Check size={12} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-primary" />
            ) : (
              <>
                <ImageIcon size={28} className="opacity-40" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Tap pour ajouter
                </span>
              </>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-white" />
              <span className="text-xs text-white font-black uppercase">
                Compression...
              </span>
            </div>
          </div>
        )}
      </div>

      <input
        id={`photo-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        title={label}
      />
    </div>
  );
};

export default PhotoUpload;
