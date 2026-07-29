// src/components/utils/cloudinary.ts

const CLOUD_NAME = "dteucmell";
const UPLOAD_PRESET = "ml_default";

// Sube un archivo a Cloudinary. `resourceType` controla el endpoint:
//  - "image": solo imágenes
//  - "auto":  imágenes o videos (Cloudinary detecta el tipo)
async function subir(file: File, resourceType: "image" | "auto"): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Cloudinary Error:", errorData);
      throw new Error("Fallo al subir el archivo a Cloudinary");
    }

    const data = await res.json();
    return data.secure_url; // Retorna el link final https://...
  } catch (error) {
    console.error("Error en subir a Cloudinary:", error);
    return null;
  }
}

// Solo imágenes (comportamiento original, se mantiene la firma pública)
export const uploadToCloudinary = (file: File): Promise<string | null> =>
  subir(file, "image");

// Imagen o video (para fondos de hero que pueden ser un clip en bucle)
export const uploadMediaToCloudinary = (file: File): Promise<string | null> =>
  subir(file, "auto");