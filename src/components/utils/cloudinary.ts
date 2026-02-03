// src/components/utils/cloudinary.ts

export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  
  // Reemplaza con tus credenciales reales de Cloudinary
  const cloudName = "dteucmell"; 
  const uploadPreset = "ml_default"; 

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Cloudinary Error:", errorData);
      throw new Error("Fallo al subir la imagen a Cloudinary");
    }

    const data = await res.json();
    return data.secure_url; // Retorna el link final https://...
  } catch (error) {
    console.error("Error en uploadToCloudinary:", error);
    return null;
  }
};