/* Revolve demo. Vanilla JS, no framework. */
(function () {
  "use strict";

  var raw = document.getElementById("site-data");
  var DATA = raw ? JSON.parse(raw.textContent) : { sessions: [], trainers: [] };

  /* ---------------- theme ---------------- */

  var THEMES = ["noir", "bone", "volt", "chalk"];

  function setTheme(name) {
    if (THEMES.indexOf(name) === -1) name = "noir";
    document.documentElement.setAttribute("data-theme", name);
    try { localStorage.setItem("revolve-look", name); } catch (e) {}
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-checked", String(b.getAttribute("data-theme-set") === name));
      b.classList.toggle("is-on", b.getAttribute("data-theme-set") === name);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", name === "bone" || name === "chalk" ? "#efe9dd" : "#0a0a0b");
  }

  var saved = null;
  try { saved = localStorage.getItem("revolve-look"); } catch (e) {}
  setTheme(saved || "noir");

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-theme-set]");
    if (!b) return;
    setTheme(b.getAttribute("data-theme-set"));
    closeLook();
    document.body.classList.remove("menu-open");
  });

  /* ---------------- the look menu ---------------- */

  var lookBtn = document.getElementById("look-btn");
  var lookMenu = document.getElementById("look-menu");

  function closeLook() {
    if (!lookMenu) return;
    lookMenu.classList.remove("is-open");
    if (lookBtn) lookBtn.setAttribute("aria-expanded", "false");
  }

  if (lookBtn && lookMenu) {
    lookBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = lookMenu.classList.toggle("is-open");
      lookBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-look]")) closeLook();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLook();
    });
  }

  /* ---------------- nav + mobile menu ---------------- */

  var nav = document.getElementById("nav");
  function onScroll() {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById("burger");
  var mobmenu = document.getElementById("mobmenu");
  if (burger && mobmenu) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      mobmenu.setAttribute("aria-hidden", String(!open));
    });
    mobmenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
        mobmenu.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ---------------- the trainer deck ---------------- */

  document.querySelectorAll("[data-deck]").forEach(function (deck) {
    var track = deck.querySelector("[data-deck-track]");
    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    var dotsWrap = deck.querySelector("[data-deck-dots]");
    var indexEl = deck.querySelector("[data-deck-index]");
    var prev = deck.querySelector("[data-deck-prev]");
    var next = deck.querySelector("[data-deck-next]");
    var total = slides.length;
    if (!total) return;

    slides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", "Trainer " + (i + 1) + " of " + total);
      d.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(d);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function width() { return track.clientWidth; }
    function current() { return Math.round(track.scrollLeft / Math.max(1, width())); }

    function go(i) {
      i = Math.max(0, Math.min(total - 1, i));
      track.scrollTo({ left: i * width(), behavior: "smooth" });
      mark(i);
    }

    function mark(i) {
      if (indexEl) indexEl.textContent = String(i + 1).padStart(2, "0");
      dots.forEach(function (d, k) {
        d.classList.toggle("is-on", k === i);
        d.setAttribute("aria-selected", String(k === i));
      });
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    }

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        mark(current());
        ticking = false;
      });
    }, { passive: true });

    if (prev) prev.addEventListener("click", function () { go(current() - 1); });
    if (next) next.addEventListener("click", function () { go(current() + 1); });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
    });

    window.addEventListener("resize", function () {
      track.scrollLeft = current() * width();
    });

    mark(0);
  });

  /* ---------------- booking ---------------- */

  var dialog = document.createElement("dialog");
  dialog.className = "bk";
  dialog.id = "bk";
  dialog.innerHTML =
    '<div class="bk-shell">' +
      '<div class="bk-body"><div class="bk-progress" id="bk-pips"></div><div id="bk-body" style="margin-top:20px"></div></div>' +
      '<div class="bk-foot"><span class="bk-hint" id="bk-hint"></span>' +
      '<button type="button" class="btn btn--ghost bk-back" id="bk-back">Back</button>' +
      '<button type="button" class="btn btn--accent" id="bk-next">Continue</button>' +
      '<button type="button" class="icon-btn bk-x" id="bk-close" aria-label="Close booking"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
    "</div></div>";
  document.body.appendChild(dialog);

  var body = dialog.querySelector("#bk-body");
  var pips = dialog.querySelector("#bk-pips");
  var hint = dialog.querySelector("#bk-hint");
  var backBtn = dialog.querySelector("#bk-back");
  var nextBtn = dialog.querySelector("#bk-next");
  dialog.querySelector("#bk-close").addEventListener("click", function () { dialog.close(); });

  var state = {
    step: 1, sessionId: null, trainer: null, day: null, time: null,
    name: "", email: "", phone: "", card: "", exp: "", cvc: ""
  };

  var STEPS = ["Session", "Trainer", "Time", "Details"];

  function session() {
    return DATA.sessions.filter(function (s) { return s.id === state.sessionId; })[0] || null;
  }
  function trainerName(slug) {
    if (!slug) return "Any trainer";
    var t = DATA.trainers.filter(function (x) { return x.slug === slug; })[0];
    return t ? t.name : slug;
  }
  function days() {
    var out = [], d = new Date();
    d.setHours(0, 0, 0, 0);
    for (var i = 0; i < 14; i++) out.push(new Date(d.getTime() + i * 86400000));
    return out;
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }
  function slots(day, slug) {
    var key = (slug || "any") + "|" + day.toISOString().slice(0, 10);
    var out = [];
    for (var m = 6 * 60 + 30; m <= 19 * 60; m += 30) {
      var label = Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
      if (hash(key + label) % 5 > 1) out.push(label);
    }
    return out.slice(0, 12);
  }
  function escapeAttr(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function canAdvance() {
    if (state.step === 1) return !!state.sessionId;
    if (state.step === 2) return true;
    if (state.step === 3) return !!(state.day && state.time);
    return true;
  }

  function render() {
    if (!pips) return;
    pips.innerHTML = STEPS.map(function (_, i) {
      return '<span class="bk-pip' + (i + 1 <= state.step - 1 ? " is-done" : "") + '"></span>';
    }).join("");
    backBtn.style.visibility = state.step > 1 && state.step < 5 ? "visible" : "hidden";
    nextBtn.hidden = state.step > 3;
    nextBtn.disabled = !canAdvance();
    nextBtn.style.opacity = canAdvance() ? "1" : "0.45";
    hint.textContent = state.step < 5 ? "Step " + Math.min(state.step, 4) + " of 4 · " + STEPS[Math.min(state.step, 4) - 1] : "";

    if (state.step === 1) {
      body.innerHTML =
        '<p class="bk-kicker">Step one</p><h2 class="bk-h">What are we booking?</h2>' +
        '<div class="bk-grid">' +
        DATA.sessions.map(function (s) {
          return '<button type="button" class="bk-opt' + (state.sessionId === s.id ? " is-on" : "") + '" data-session="' + s.id + '">' +
            '<span class="bk-opt-t">' + s.name + '</span>' +
            '<span class="bk-opt-s">' + s.length + (s.price ? " · $" + s.price : " · price on the day") + '</span>' +
          '</button>';
        }).join("") + '</div>';
    }

    if (state.step === 2) {
      var trainers = [{ slug: "", name: "Any trainer", role: "We will match you" }].concat(
        DATA.trainers.map(function (t) { return { slug: t.slug, name: t.name, role: t.role }; })
      );
      body.innerHTML =
        '<p class="bk-kicker">Step two · ' + (session() ? session().name + ", " + session().length : "") + '</p><h2 class="bk-h">Who do you want to train with?</h2>' +
        '<div class="bk-grid">' +
        trainers.map(function (t) {
          return '<button type="button" class="bk-opt' + (state.trainer === (t.slug || null) ? " is-on" : "") + '" data-trainer-opt="' + t.slug + '">' +
            '<span class="bk-opt-t">' + t.name + '</span><span class="bk-opt-s">' + t.role + '</span></button>';
        }).join("") + '</div>';
    }

    if (state.step === 3) {
      var ds = days();
      if (!state.day) state.day = ds[0];
      var chosen = state.day;
      var open = slots(chosen, state.trainer);
      body.innerHTML =
        '<p class="bk-kicker">Step three · ' + trainerName(state.trainer) + '</p><h2 class="bk-h">Pick a day and a time.</h2>' +
        '<p class="bk-month">' + chosen.toLocaleDateString("en-NZ", { month: "long", year: "numeric" }) + '</p>' +
        '<div class="bk-days">' +
        ds.map(function (d, i) {
          var on = d.toDateString() === chosen.toDateString();
          return '<button type="button" class="bk-day' + (on ? " is-on" : "") + '" data-day="' + i + '">' +
            '<span class="bk-day-d">' + d.toLocaleDateString("en-NZ", { weekday: "short" }) + '</span>' +
            '<span class="bk-day-n">' + d.getDate() + '</span></button>';
        }).join("") + '</div>' +
        (open.length
          ? '<div class="bk-times">' + open.map(function (t) {
              return '<button type="button" class="bk-time' + (state.time === t ? " is-on" : "") + '" data-time="' + t + '">' + t + '</button>';
            }).join("") + '</div>'
          : '<p class="bk-note">Nothing open that day. Try another.</p>');
    }

    if (state.step === 4) {
      var s = session(), price = s && s.price ? s.price : 0;
      body.innerHTML =
        '<p class="bk-kicker">Step four</p><h2 class="bk-h">Last bit.</h2>' +
        '<div class="bk-summary"><dl>' +
          '<dt>Session</dt><dd>' + (s ? s.name + ", " + s.length : "") + '</dd>' +
          '<dt>Trainer</dt><dd>' + trainerName(state.trainer) + '</dd>' +
          '<dt>When</dt><dd>' + state.day.toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" }) + ', ' + state.time + '</dd>' +
        '</dl>' +
        (price ? '<div class="bk-total"><span>Total</span><span>$' + price.toFixed(2) + '</span></div>' : '<p class="bk-note">Pay at the studio on the day.</p>') +
        '</div>' +
        '<label class="bk-field"><span>Your name</span><input name="name" autocomplete="name" value="' + escapeAttr(state.name) + '" placeholder="First and last"></label>' +
        '<div class="bk-row">' +
          '<label class="bk-field"><span>Email</span><input name="email" type="email" autocomplete="email" value="' + escapeAttr(state.email) + '" placeholder="you@email.co.nz"></label>' +
          '<label class="bk-field"><span>Mobile</span><input name="phone" inputmode="tel" autocomplete="tel" value="' + escapeAttr(state.phone) + '" placeholder="021 000 0000"></label>' +
        '</div>' +
        (price
          ? '<label class="bk-field"><span>Card number</span><input name="card" inputmode="numeric" value="' + escapeAttr(state.card) + '" placeholder="4242 4242 4242 4242"></label>' +
            '<div class="bk-row">' +
              '<label class="bk-field"><span>Expiry</span><input name="exp" inputmode="numeric" value="' + escapeAttr(state.exp) + '" placeholder="MM / YY"></label>' +
              '<label class="bk-field"><span>CVC</span><input name="cvc" inputmode="numeric" value="' + escapeAttr(state.cvc) + '" placeholder="123"></label>' +
            '</div>' +
            '<p class="bk-note">Demo only. No card is charged and nothing is stored.</p>'
          : '') +
        '<button type="button" class="btn btn--accent btn--wide" id="bk-confirm">' +
          (price ? "Book and pay $" + price : "Confirm booking") + '</button>';
    }

    if (state.step === 5) {
      var ss = session();
      var ref = "RV-" + String(hash(state.email + state.time + state.day.toISOString())).slice(0, 5);
      body.innerHTML =
        '<div class="bk-done">' +
          '<div class="bk-done-mark" aria-hidden="true">✓</div>' +
          '<h2 class="bk-h">You are booked.</h2>' +
          '<p>' + (ss ? ss.name : "Session") + ' with ' + trainerName(state.trainer) + ', ' +
            state.day.toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" }) + ' at ' + state.time + '.</p>' +
          '<p class="bk-note">Reference <span class="bk-ref">' + ref + '</span></p>' +
          '<p class="bk-note">In the real build this lands in the studio diary and sends a text and an email confirmation.</p>' +
        '</div>';
    }
  }

  dialog.addEventListener("click", function (e) {
    var t = e.target.closest("[data-session],[data-trainer-opt],[data-day],[data-time],#bk-confirm");
    if (!t) return;

    if (t.hasAttribute("data-session")) { state.sessionId = t.getAttribute("data-session"); render(); return; }
    if (t.hasAttribute("data-trainer-opt")) {
      var v = t.getAttribute("data-trainer-opt");
      state.trainer = v ? v : null; state.time = null; render(); return;
    }
    if (t.hasAttribute("data-day")) {
      state.day = days()[Number(t.getAttribute("data-day"))]; state.time = null; render(); return;
    }
    if (t.hasAttribute("data-time")) { state.time = t.getAttribute("data-time"); render(); return; }
    if (t.id === "bk-confirm") {
      var name = body.querySelector('input[name="name"]');
      var email = body.querySelector('input[name="email"]');
      var phone = body.querySelector('input[name="phone"]');
      state.name = name ? name.value.trim() : "";
      state.email = email ? email.value.trim() : "";
      state.phone = phone ? phone.value.trim() : "";
      if (!state.name) { if (name) name.focus(); return; }
      if (!state.email) { if (email) email.focus(); return; }
      var card = body.querySelector('input[name="card"]');
      if (card && card.value.replace(/\s/g, "").length < 12) { card.focus(); return; }
      state.step = 5; render();
    }
  });

  backBtn.addEventListener("click", function () {
    if (state.step > 1) { state.step -= 1; render(); }
  });
  nextBtn.addEventListener("click", function () {
    if (!canAdvance()) return;
    state.step += 1;
    render();
  });

  function openBooking(trainerSlug) {
    state.step = 1;
    state.time = null;
    if (trainerSlug) state.trainer = trainerSlug;
    render();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-book]");
    if (!b) return;
    e.preventDefault();
    document.body.classList.remove("menu-open");
    var bgr = document.getElementById("burger");
    if (bgr) bgr.setAttribute("aria-expanded", "false");
    openBooking(b.getAttribute("data-trainer"));
  });

  dialog.addEventListener("input", function (e) {
    var i = e.target;
    if (i.name === "card") {
      var v = i.value.replace(/\D/g, "").slice(0, 16);
      i.value = v.replace(/(.{4})/g, "$1 ").trim();
    }
    if (i.name === "exp") {
      var x = i.value.replace(/\D/g, "").slice(0, 4);
      i.value = x.length > 2 ? x.slice(0, 2) + " / " + x.slice(2) : x;
    }
    if (i.name === "cvc") i.value = i.value.replace(/\D/g, "").slice(0, 4);
  });
})();
