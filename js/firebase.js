import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7nEeM0RAJ77HS-bvq84rpAbvV4IGosEw",
  authDomain: "forcelabnutrition-afaa7.firebaseapp.com",
  projectId: "forcelabnutrition-afaa7",

  // ✅ CORRETO
  storageBucket: "forcelabnutrition-afaa7.appspot.com",

  messagingSenderId: "355893469293",
  appId: "1:355893469293:web:020fbced4dd761dc9d9f64"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
