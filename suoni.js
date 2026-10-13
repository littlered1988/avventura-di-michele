// =====================================================================
//  SUONI.JS - REGISTRA I SUONI
// =====================================================================
//  In questa pagina si registra la propria voce col microfono e si
//  sceglie, da un menu, quale suono usare per ogni cosa che succede
//  nel gioco (un salto, una stella presa...).
//
//  I suoni registrati stanno nello stesso armadio dei personaggi
//  (vedi personaggi.js), su un secondo scaffale chiamato "suoni".
//  Ogni suono ha una scheda con scritto:
//
//    id        il suo numero (lo sceglie l'armadio)
//    nome      come l'abbiamo chiamato, per esempio "Boing di Michele"
//    effetto   per cosa serve: "salto", "stella", "ahi", "vittoria" o "schiacciato"
//    audio     la registrazione
//    creatoIl  quando è stato registrato
// =====================================================================

// Gli effetti che si possono registrare.
//   secondi = dopo quanto tempo la registrazione si ferma da sola
const EFFETTI = [
  { id: "salto", nome: "Salto", icona: "🦘", secondi: 2 },
  { id: "stella", nome: "Stella presa", icona: "⭐", secondi: 2 },
  { id: "ahi", nome: "Colpo", icona: "💥", secondi: 2 },
  { id: "vittoria", nome: "Vittoria", icona: "🏁", secondi: 4 },
  { id: "schiacciato", nome: "Mostro schiacciato", icona: "👾", secondi: 2 },
];

let suoniSalvati = [];      // le schede di tutti i suoni registrati
let suoniScelti = leggiSuoniScelti();   // per ogni effetto, il numero del suono scelto dal menu
const suoniPronti = {};     // i suoni già "srotolati" e pronti da suonare in un lampo
let registratore = null;    // c'è una registrazione in corso?


// =====================================================================
//  LA MEMORIA DEI SUONI
// =====================================================================

function salvaSuono(suono) {
  return usaScaffale(SCAFFALE_SUONI, "readwrite", (scaffale) => scaffale.put(suono));
}

function caricaSuoni() {
  return usaScaffale(SCAFFALE_SUONI, "readonly", (scaffale) => scaffale.getAll());
}

function eliminaSuono(id) {
  return usaScaffale(SCAFFALE_SUONI, "readwrite", (scaffale) => scaffale.delete(id));
}

// Quale suono è stato scelto per ogni effetto lo scriviamo in un foglietto
// del browser (localStorage), così la scelta resta anche la volta dopo.
function leggiSuoniScelti() {
  try {
    return JSON.parse(localStorage.getItem("suoniScelti")) || {};
  } catch (errore) {
    return {};
  }
}

function scriviSuoniScelti() {
  try {
    localStorage.setItem("suoniScelti", JSON.stringify(suoniScelti));
  } catch (errore) {
    // Se il browser non lascia scrivere, la scelta vale solo per questa volta.
  }
}

// Rilegge i suoni dalla memoria e aggiorna i menu.
async function aggiornaSuoni() {
  try {
    suoniSalvati = await caricaSuoni();
  } catch (errore) {
    suoniSalvati = [];
  }
  aggiornaMenuSuoni();
  preparaSuoniRegistrati();
}


// =====================================================================
//  SUONARE UN SUONO REGISTRATO
// =====================================================================

// Una registrazione è "impacchettata" per occupare poco spazio. Per suonarla
// senza ritardi la srotoliamo una volta sola e la teniamo pronta.
// (Si può fare solo dopo il primo tocco, quando il sintetizzatore è acceso.)
function preparaSuoniRegistrati() {
  if (!sintetizzatore) return;
  for (const suono of suoniSalvati) {
    if (!suoniPronti[suono.id]) preparaSuono(suono);
  }
}

async function preparaSuono(suono) {
  try {
    const pacchetto = await suono.audio.arrayBuffer();
    const onda = await sintetizzatore.decodeAudioData(pacchetto);
    suoniPronti[suono.id] = { onda: onda, inizio: trovaInizio(onda) };
  } catch (errore) {
    // Registrazione rovinata: al suo posto si sentirà il suono del gioco.
  }
}

// Tra quando si preme il pulsante e quando si comincia a parlare passa sempre
// un attimo di silenzio. Qui cerchiamo il punto in cui la voce comincia davvero,
// così nel gioco il suono parte subito.
function trovaInizio(onda) {
  const campioni = onda.getChannelData(0);
  for (let posizione = 0; posizione < campioni.length; posizione++) {
    if (Math.abs(campioni[posizione]) > 0.04) {
      const secondi = posizione / onda.sampleRate;
      return Math.max(0, secondi - 0.02);   // partiamo un pelino prima
    }
  }
  return 0;
}

// Prova a suonare la registrazione scelta per questo effetto.
// Risponde true se ci è riuscita, false se bisogna usare il suono del gioco.
function suonaRegistrato(effetto) {
  const pronto = suoniPronti[suoniScelti[effetto]];
  if (!pronto || !sintetizzatore) return false;
  const sorgente = sintetizzatore.createBufferSource();
  sorgente.buffer = pronto.onda;
  sorgente.connect(sintetizzatore.destination);
  sorgente.start(0, pronto.inizio);
  return true;
}


// =====================================================================
//  REGISTRARE
// =====================================================================

// Chiede al browser il permesso di usare il microfono.
// Risponde null se non si può.
async function chiediMicrofono() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (errore) {
    avvisa("Non riesco a usare il microfono. Chiedi a un grande di dare il permesso! 🎤");
    return null;
  }
}

function spegniMicrofono(microfono) {
  for (const traccia of microfono.getTracks()) {
    traccia.stop();
  }
}

// Il pulsante fa due cose: la prima volta comincia a registrare,
// la seconda volta ferma la registrazione.
function premiRegistra(effetto) {
  if (registratore) {
    fermaRegistrazione();
  } else {
    iniziaRegistrazione(effetto);
  }
}

async function iniziaRegistrazione(effetto) {
  const microfono = await chiediMicrofono();
  if (!microfono) return;

  const pezzi = [];
  const nuovo = new MediaRecorder(microfono);
  registratore = nuovo;
  nuovo.ondataavailable = (evento) => pezzi.push(evento.data);
  nuovo.onstop = () => {
    spegniMicrofono(microfono);
    registratore = null;
    mostraStaRegistrando(effetto, false);
    chiediNomeESalva(effetto, new Blob(pezzi, { type: nuovo.mimeType }));
  };

  nuovo.start();
  mostraStaRegistrando(effetto, true);
  // Se nessuno la ferma prima, la registrazione si ferma da sola.
  setTimeout(() => { if (registratore === nuovo) nuovo.stop(); }, effetto.secondi * 1000);
}

function fermaRegistrazione() {
  if (registratore) registratore.stop();
}

function mostraStaRegistrando(effetto, staRegistrando) {
  effetto.pulsante.textContent = staRegistrando ? "⏹ Ti ascolto... premi per finire" : "🎤 Registra";
  effetto.pulsante.classList.toggle("staRegistrando", staRegistrando);
}

// Finita la registrazione chiediamo che nome darle, la salviamo
// e la scegliamo subito come suono per quell'effetto.
async function chiediNomeESalva(effetto, registrazione) {
  const quanti = suoniSalvati.filter((suono) => suono.effetto === effetto.id).length;
  const proposta = effetto.nome + " " + (quanti + 1);
  const nome = await faiDomanda("Fatto! Che nome diamo a questo suono?", "text", proposta);
  if (nome === null || nome.trim() === "") return;   // "Annulla": la registrazione si butta

  try {
    const id = await salvaSuono({
      nome: nome.trim().slice(0, 24),
      effetto: effetto.id,
      audio: registrazione,
      creatoIl: new Date().toISOString(),
    });
    scegliSuono(effetto.id, id);
  } catch (errore) {
    avvisa("Ops, su questo dispositivo non riesco a salvare i suoni.");
    return;
  }
  await aggiornaSuoni();
}


// =====================================================================
//  LA PAGINA E I MENU
// =====================================================================

function apriSuoni() {
  aggiornaMenuSuoni();
  mostraPagina("paginaSuoni");
}

// Costruisce la riga di un effetto: nome, pulsante per registrare,
// menu per scegliere, pulsante per ascoltare e pulsante per eliminare.
function creaRigaSuono(effetto) {
  const riga = document.createElement("div");
  riga.className = "rigaSuono";

  const titolo = document.createElement("strong");
  titolo.textContent = effetto.icona + " " + effetto.nome;

  effetto.pulsante = creaPulsanteSuono("🎤 Registra", () => premiRegistra(effetto));
  effetto.menu = document.createElement("select");
  effetto.menu.addEventListener("change", () => scegliSuono(effetto.id, effetto.menu.value));
  const prova = creaPulsanteSuono("▶ Prova", () => suona(effetto.id));
  const elimina = creaPulsanteSuono("🗑️", () => eliminaSuonoScelto(effetto));

  riga.append(titolo, effetto.pulsante, effetto.menu, prova, elimina);
  document.getElementById("righeSuoni").append(riga);
}

function creaPulsanteSuono(testo, alTocco) {
  const pulsante = document.createElement("button");
  pulsante.textContent = testo;
  pulsante.addEventListener("click", alTocco);
  return pulsante;
}

// Riempie ogni menu: prima "Suono del gioco", poi le registrazioni fatte per quell'effetto.
function aggiornaMenuSuoni() {
  for (const effetto of EFFETTI) {
    effetto.menu.replaceChildren(creaVoceMenu("", "Suono del gioco"));
    for (const suono of suoniSalvati) {
      if (suono.effetto === effetto.id) effetto.menu.append(creaVoceMenu(suono.id, "🎤 " + suono.nome));
    }
    effetto.menu.value = suoniScelti[effetto.id] || "";
    // Se il suono scelto non esiste più, il menu torna su "Suono del gioco".
    if (effetto.menu.selectedIndex < 0) effetto.menu.value = "";
  }
}

function creaVoceMenu(valore, testo) {
  const voce = document.createElement("option");
  voce.value = valore;
  voce.textContent = testo;
  return voce;
}

// Ricorda quale suono usare per un effetto. Senza numero si torna al suono del gioco.
function scegliSuono(idEffetto, idSuono) {
  if (idSuono === "") {
    delete suoniScelti[idEffetto];
  } else {
    suoniScelti[idEffetto] = Number(idSuono);
  }
  scriviSuoniScelti();
}

async function eliminaSuonoScelto(effetto) {
  const idSuono = suoniScelti[effetto.id];
  if (!suoniSalvati.some((suono) => suono.id === idSuono)) {
    avvisa("Il suono del gioco non si può eliminare. Scegli dal menu una registrazione!");
    return;
  }
  const sicuro = await faiDomanda("Sei sicuro? Il suono sparirà per sempre");
  if (!sicuro) return;
  if (!(await passwordGenitoreGiusta())) return;

  await eliminaSuono(idSuono);
  scegliSuono(effetto.id, "");
  await aggiornaSuoni();
}


// =====================================================================
//  COLLEGHIAMO TUTTO
// =====================================================================

for (const effetto of EFFETTI) {
  creaRigaSuono(effetto);
}
document.getElementById("menuSuoni").addEventListener("click", () => apriSuoni());

// All'avvio leggiamo subito i suoni dalla memoria.
aggiornaSuoni();
