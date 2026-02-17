// ✅ TROQUE AQUI:
const CLOUD_NAME = "dhpjlsgch";
const UPLOAD_PRESET = "produtos_unsigned"; // preset do Cloudinary

const btnUpload = document.getElementById("btnUpload");
const imgUrl = document.getElementById("imgUrl");
const btnCopy = document.getElementById("btnCopy");
const msg = document.getElementById("msg");
const preview = document.getElementById("preview");

function setMsg(t, ok=true){
  msg.textContent = t || "";
  msg.style.color = ok ? "rgba(170,255,200,.95)" : "rgba(255,170,170,.95)";
}

function setPreview(url){
  if(!url){ preview.innerHTML = "🖼️"; return; }
  preview.innerHTML = `<img src="${url}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
}

const widget = cloudinary.createUploadWidget({
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  sources: ["local", "camera", "url"],
  multiple: false,
  folder: "produtos",
  clientAllowedFormats: ["png","jpg","jpeg","webp"],
  maxFileSize: 4 * 1024 * 1024
}, (error, result) => {
  if (error) {
    console.error(error);
    setMsg("Erro ao enviar. Verifique preset/permissões.", false);
    return;
  }
  if (result?.event === "success") {
    const url = result.info.secure_url;
    imgUrl.value = url;
    setPreview(url);
    setMsg("Upload concluído ✅");
  }
});

btnUpload?.addEventListener("click", () => {
  setMsg("");
  widget.open();
});

btnCopy?.addEventListener("click", async () => {
  if(!imgUrl.value) return setMsg("Nenhuma URL para copiar.", false);
  await navigator.clipboard.writeText(imgUrl.value);
  setMsg("Copiado ✅");
});
