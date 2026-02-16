import { requireAuth } from "./auth.js";
import { loadSidebar } from "./sidebar-loader.js";
requireAuth();
await loadSidebar("configs");

import { db } from "../js/firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const storeName = document.getElementById("storeName");
const storeWhats = document.getElementById("storeWhats");
const storePix = document.getElementById("storePix");
const shipBase = document.getElementById("shipBase");
const freeOver = document.getElementById("freeOver");
const defaultCoupon = document.getElementById("defaultCoupon");

const btnSave = document.getElementById("btnSaveCfg");
const btnReset = document.getElementById("btnResetCfg");
const btnReload = document.getElementById("btnReloadCfg");
const msg = document.getElementById("cfgMsg");

const REF = doc(db, "configs", "store");
let LAST = null;

function n(v){ return Number(v || 0) || 0; }

function fill(data){
  storeName.value = data?.storeName || "";
  storeWhats.value = data?.whatsapp || "";
  storePix.value = data?.pixKey || "";
  shipBase.value = data?.shippingBase ?? "";
  freeOver.value = data?.freeShippingOver ?? "";
  defaultCoupon.value = data?.defaultCoupon || "";
}

async function load(){
  msg.textContent = "Carregando...";
  try{
    const snap = await getDoc(REF);
    const data = snap.exists() ? snap.data() : {};
    LAST = data;
    fill(data);
    msg.textContent = snap.exists() ? "OK ✅" : "Nenhuma config ainda (salve para criar).";
  }catch(err){
    console.error(err);
    msg.textContent = "Sem permissão (rules) ou erro ao ler.";
  }finally{
    setTimeout(()=> msg.textContent = "", 1600);
  }
}

async function save(){
  btnSave.disabled = true;
  msg.textContent = "Salvando...";

  const payload = {
    storeName: storeName.value.trim(),
    whatsapp: storeWhats.value.trim(),
    pixKey: storePix.value.trim(),
    shippingBase: n(shipBase.value),
    freeShippingOver: n(freeOver.value),
    defaultCoupon: defaultCoupon.value.trim().toUpperCase(),
    updatedAt: new Date(),
  };

  try{
    await setDoc(REF, payload, { merge: true });
    LAST = { ...(LAST||{}), ...payload };
    msg.textContent = "Salvo ✅";
  }catch(err){
    console.error(err);
    msg.textContent = "Sem permissão (rules) ou erro ao salvar.";
  }finally{
    btnSave.disabled = false;
    setTimeout(()=> msg.textContent = "", 1600);
  }
}

btnSave?.addEventListener("click", save);
btnReload?.addEventListener("click", load);
btnReset?.addEventListener("click", ()=> fill(LAST || {}));

load();
