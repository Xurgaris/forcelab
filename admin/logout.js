import { auth } from "../js/firebase.js";

import {
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};
