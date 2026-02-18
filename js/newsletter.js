// /js/newsletter.js
(function () {
  const form = document.querySelector('form[name="newsletter"]');
  if (!form) return;

  const msg = document.getElementById("nlMsg");
  const btn = form.querySelector('button[type="submit"]');

  const show = (text, ok = true) => {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "rgba(255,255,255,.75)" : "#ff6b6b";
  };

  const isLocal =
    location.hostname === "127.0.0.1" ||
    location.hostname === "localhost";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();

    if (name.length < 2) return show("Digite seu nome.", false);
    if (!/^\S+@\S+\.\S+$/.test(email)) return show("Digite um e-mail válido.", false);

    btn.disabled = true;
    btn.style.opacity = ".85";
    show("Enviando...");

    // ✅ No localhost não dá pra testar Netlify Forms (POST dá 405)
    if (isLocal) {
      setTimeout(() => {
        show("Cadastro realizado!");
        form.reset();
        btn.disabled = false;
        btn.style.opacity = "1";
      }, 500);
      return;
    }

    try {
      const data = new FormData(form);

      const res = await fetch("/", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Falha ao enviar");

      show("Cadastro realizado ✅");
      form.reset();
    } catch (err) {
      show("Não foi possível cadastrar agora. Tente novamente.", false);
    } finally {
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  });
})();
