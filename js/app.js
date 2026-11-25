// Arte Munay — carga obra y agenda desde /data (editables desde el panel de administración)
const WHATSAPP = "5493813013809"; // 381-3013809, el WhatsApp que ella publica para ventas e informes

const $ = (s, el = document) => el.querySelector(s);
let obras = [], series = [], visibles = [], actual = 0;

function linkWhatsApp(texto) {
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}` : "#contacto";
}

// En "Todo" se intercalan las categorías para que la grilla no quede agrupada
function intercalar(lista) {
  const grupos = Object.values(lista.reduce((g, o) => ((g[o.serie] ??= []).push(o), g), {}));
  const out = []; const total = lista.length; let i = 0;
  while (out.length < total) { grupos.forEach(g => { const paso = g.length / Math.max(...grupos.map(x => x.length)); const k = Math.floor(i * paso); if (g[k] && !out.includes(g[k])) out.push(g[k]); }); i++; if (i > total) break; }
  lista.forEach(o => { if (!out.includes(o)) out.push(o); });
  return out;
}

function titulo(o) { return o.titulo || "Sin título"; }

function pintarGrilla(cat) {
  visibles = cat === "Todo" ? intercalar(obras.filter(o => o.serie !== "Objetos")) : obras.filter(o => o.serie === cat);
  const s = series.find(x => x.nombre === cat);
  $("#serie-texto").textContent = s ? s.texto : "";
  $("#grilla").innerHTML = visibles.map((o, i) => `
    <figure class="pieza" data-i="${i}" tabindex="0" role="button" aria-label="Ver ${titulo(o)}">
      <img src="${o.miniatura}" width="${o.ancho}" height="${o.alto}" loading="lazy" alt="${titulo(o)} — ${o.categoria}">
      <figcaption><span>${o.titulo || o.categoria}</span><span>${o.anio || ""}</span></figcaption>
    </figure>`).join("");
}

function pintarFiltros() {
  const cats = ["Todo", ...series.map(s => s.nombre)];
  $(".filtros").innerHTML = cats.map(c =>
    `<button role="tab" aria-selected="${c === "Todo"}">${c}</button>`).join("");
  $(".filtros").addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;
    $(".filtros").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b === e.target));
    pintarGrilla(e.target.textContent);
  });
}

function abrir(i) {
  actual = (i + visibles.length) % visibles.length;
  const o = visibles[actual];
  $("#visor-img").src = o.imagen;
  $("#visor-img").alt = `${titulo(o)} — ${o.categoria}`;
  $("#ficha-cat").textContent = o.serie + " · " + o.categoria;
  $("#ficha-titulo").textContent = titulo(o);
  $("#ficha-datos").innerHTML = ([o.tecnica, o.medidas, o.anio].filter(Boolean).join("<br>") || "Datos de la obra a completar")
    + (o.provisorio ? '<br><span class="aviso-prov">Datos provisorios, a confirmar por la artista</span>' : "");
  $("#ficha-consulta").href = linkWhatsApp(`Hola, me interesa la obra "${titulo(o)}" (${o.id}) que vi en la web.`);
  if (!$("#visor").open) $("#visor").showModal();
}

function pintarAgenda(d) {
  $("#agenda-lista").innerHTML = d.agenda.map(e => `
    <article class="evento">
      <img src="${e.imagen}" alt="" loading="lazy">
      <div>
        <p class="tipo">${e.tipo}</p>
        <h3>${e.titulo}</h3>
        <p class="cuando ${e.provisorio ? "provisorio" : ""}">${e.fecha} · ${e.lugar}</p>
        <p>${e.texto}</p>
        <a class="link" href="${linkWhatsApp(`Hola, quiero información sobre: ${e.titulo}`)}">Pedir información →</a>
      </div>
    </article>`).join("");
  $("#pasadas").innerHTML = d.muestras_pasadas.map(m => `
    <figure>${m.imagen ? `<img src="${m.imagen}" alt="${m.titulo}" loading="lazy">` : `<div class="sin-foto"></div>`}<figcaption>${m.titulo}${m.anio ? " · " + m.anio : ""}</figcaption></figure>`).join("");
}

async function iniciar() {
  const [o, n] = await Promise.all([
    fetch("data/obras.json").then(r => r.json()),
    fetch("data/novedades.json").then(r => r.json())
  ]);
  obras = o.obras; series = o.series || [];
  pintarFiltros(); pintarGrilla("Todo"); pintarAgenda(n);
}

document.addEventListener("click", e => {
  const p = e.target.closest(".pieza"); if (p) abrir(+p.dataset.i);
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.classList?.contains("pieza")) abrir(+e.target.dataset.i);
  if (!$("#visor").open) return;
  if (e.key === "ArrowRight") abrir(actual + 1);
  if (e.key === "ArrowLeft") abrir(actual - 1);
});
$(".prev").onclick = () => abrir(actual - 1);
$(".next").onclick = () => abrir(actual + 1);
$(".cerrar").onclick = () => $("#visor").close();
$("#visor").addEventListener("click", e => { if (e.target.id === "visor") $("#visor").close(); });
$(".menu-btn").onclick = e => {
  const n = $(".nav"); n.classList.toggle("abierto");
  e.currentTarget.setAttribute("aria-expanded", n.classList.contains("abierto"));
};
document.querySelectorAll(".nav a").forEach(a => a.onclick = () => $(".nav").classList.remove("abierto"));
document.querySelectorAll("[data-whatsapp]").forEach(a => a.href = linkWhatsApp("Hola, te escribo desde la web."));

iniciar();
