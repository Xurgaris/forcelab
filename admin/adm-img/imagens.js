// admin/adm-img/imagens.js
const CLOUD_NAME = "dhpjlsgch";
const UPLOAD_PRESET = "produtos_unsigned";

const btnPick = document.getElementById("btnPick");
const btnUpload = document.getElementById("btnUpload");
const btnCopy = document.getElementById("btnCopy");
const btnClearAll = document.getElementById("btnClearAll");

const fileInput = document.getElementById("fileInput"); // fica hidden (só pra UX)
const urlOut = document.getElementById("urlOut");
const statusMsg = document.getElementById("statusMsg");
const previewBox = document.getElementById("previewBox");
const fileInfo = document.getElementById("fileInfo");
const optHint = document.getElementById("optHint");

// -------- helpers --------
function setMsg(t, ok = true) {
  if (!statusMsg) return;
  statusMsg.textContent = t || "";
  statusMsg.style.color = ok
    ? "rgba(170,255,200,.95)"
    : "rgba(255,170,170,.95)";
}

function setPreview(url) {
  if (!previewBox) return;
  if (!url) {
    previewBox.innerHTML = `<span class="muted">🖼️</span>`;
    return;
  }
  previewBox.innerHTML = `<img src="${url}" alt="preview" />`;
}

function setFileInfo(text) {
  if (!fileInfo) return;
  fileInfo.textContent = text || "Nenhuma imagem selecionada";
}

function setButtonsState(hasUrl) {
  if (btnCopy) btnCopy.disabled = !hasUrl;
}

function clearAll() {
  if (urlOut) urlOut.value = "";
  setPreview("");
  setMsg("");
  setFileInfo("Nenhuma imagem selecionada");
  setButtonsState(false);
  if (btnUpload) btnUpload.disabled = true;
  if (fileInput) fileInput.value = "";
}

// URL otimizada (só dica)
function buildOptimizedUrl(url) {
  // Cloudinary padrão: .../upload/v123/... ou .../upload/...
  // Inserimos f_auto,q_auto,w_900/ logo após "/upload/"
  return String(url || "").replace("/upload/", "/upload/f_auto,q_auto,w_900/");
}

// -------- Cloudinary widget --------
const widget = cloudinary.createUploadWidget(
  {
    cloudName: CLOUD_NAME,
    uploadPreset: UPLOAD_PRESET,
    sources: ["local", "camera", "url"],
    multiple: false,
    folder: "produtos",
    clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
    maxFileSize: 4 * 1024 * 1024,
  },
  (error, result) => {
    if (error) {
      console.error(error);
      setMsg("Erro ao enviar. Verifique preset/permissões.", false);
      return;
    }

    if (result?.event === "success") {
      const url = result.info.secure_url;

      if (urlOut) urlOut.value = url;
      setPreview(url);
      setButtonsState(true);
      setMsg("Upload concluído ✅");

      const opt = buildOptimizedUrl(url);
      if (optHint) optHint.textContent = opt;

      // deixa o botão "Enviar" desabilitado porque o upload já aconteceu no widget
      if (btnUpload) btnUpload.disabled = true;

      // info do arquivo
      const name = result?.info?.original_filename
        ? `${result.info.original_filename}.${result.info.format || ""}`.replace(/\.$/, "")
        : "Imagem enviada";
      setFileInfo(name);
    }
  }
);

// -------- events --------

// UX: botão “Escolher imagem” abre o widget (melhor, porque já faz tudo)
btnPick?.addEventListener("click", () => {
  setMsg("");
  widget.open();
});

// Mantive o botão “Enviar imagem” também abrindo o widget (pra não quebrar o layout)
btnUpload?.addEventListener("click", () => {
  setMsg("");
  widget.open();
});

// Se você quiser realmente usar fileInput (sem widget), teria que usar API upload.
// Aqui o fileInput serve só como fallback de UX (opcional).
fileInput?.addEventListener("change", () => {
  const f = fileInput.files?.[0];
  if (!f) return;

  if (!f.type.startsWith("image/")) {
    setMsg("Selecione um arquivo de imagem.", false);
    fileInput.value = "";
    return;
  }

  setFileInfo(`${f.name} (${Math.round(f.size / 1024)} KB)`);
  setMsg("Agora clique em “Enviar imagem”.", true);

  // habilita “Enviar” (mesmo que ele abra o widget)
  if (btnUpload) btnUpload.disabled = false;

  // preview local
  const local = URL.createObjectURL(f);
  setPreview(local);
});

btnCopy?.addEventListener("click", async () => {
  const url = String(urlOut?.value || "").trim();
  if (!url) return setMsg("Nenhuma URL para copiar.", false);

  try {
    await navigator.clipboard.writeText(url);
    setMsg("Copiado ✅");
  } catch {
    // fallback
    urlOut?.select?.();
    document.execCommand?.("copy");
    setMsg("Copiado ✅");
  }
});

btnClearAll?.addEventListener("click", clearAll);

// init
clearAll();
