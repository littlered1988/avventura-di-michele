// =====================================================================
//  EDITOR.JS - CREA I TUOI LIVELLI
// =====================================================================
//  Qui si costruisce un livello toccando le caselle di una griglia.
//  La griglia è la stessa cosa che c'è scritta in levels.js: ogni
//  casella è un simbolo, e sotto la griglia si vede il testo del
//  livello che cambia mentre lo costruisci.
//
//    #  terreno     *  stella     E  nemico
//    F  bandiera    P  partenza   -  aria
//
//  I livelli salvati stanno nell'armadio (vedi personaggi.js), sul
//  terzo scaffale, chiamato "livelli". Ogni scheda ha:
//
//    id        il suo numero (lo sceglie l'armadio)
//    nome      come si chiama il livello
//    autore    chi l'ha creato
//    righe     il livello scritto con i simboli, una riga per volta
//    creatoIl  quando è stato salvato
// =====================================================================

const RIGHE_EDITOR = 10;        // quante righe ha un livello nuovo
const COLONNE_INIZIALI = 30;    // quanto è lungo un livello nuovo
const COLONNE_MINIME = 15;
const COLONNE_MASSIME = 80;

// Gli attrezzi con cui si "dipinge" la griglia.
const ATTREZZI = [
  { simbolo: "#", nome: "Terreno", icona: "🟫" },
  { simbolo: "*", nome: "Stella", icona: "⭐" },
  { simbolo: "E", nome: "Nemico", icona: "👾" },
  { simbolo: "F", nome: "Bandiera", icona: "🚩" },
  { simbolo: "P", nome: "Partenza", icona: "🦸" },
  { simbolo: "-", nome: "Gomma", icona: "🧽" },
];

// Cosa si vede dentro una casella per ogni simbolo.
const DISEGNI_CASELLE = { "#": "", "*": "⭐", "E": "👾", "F": "🚩", "P": "🦸", "-": "" };

let griglia = [];             // il livello che si sta costruendo: righe fatte di simboli
let attrezzoScelto = "#";
let livelloAperto = null;     // il numero del livello salvato che stiamo modificando (null = nuovo)
let livelliSalvati = [];      // le schede di tutti i livelli salvati

const campoNomeLivello = document.getElementById("campoNomeLivello");
const campoAutoreLivello = document.getElementById("campoAutoreLivello");


// =====================================================================
//  LA MEMORIA DEI LIVELLI
// =====================================================================

function salvaLivello(livello) {
  return usaScaffale(SCAFFALE_LIVELLI, "readwrite", (scaffale) => scaffale.put(livello));
}

function caricaLivelli() {
  return usaScaffale(SCAFFALE_LIVELLI, "readonly", (scaffale) => scaffale.getAll());
}

function eliminaLivello(id) {
  return usaScaffale(SCAFFALE_LIVELLI, "readwrite", (scaffale) => scaffale.delete(id));
}

async function aggiornaLivelli() {
  try {
    livelliSalvati = await caricaLivelli();
  } catch (errore) {
    livelliSalvati = [];
  }
}


// =====================================================================
//  LA GRIGLIA
// =====================================================================

// Un livello nuovo: tutto aria, due righe di terreno in fondo,
// la partenza a sinistra e la bandiera a destra.
function creaGrigliaNuova(colonne) {
  const nuova = [];
  for (let riga = 0; riga < RIGHE_EDITOR; riga++) {
    const eTerreno = riga >= RIGHE_EDITOR - 2;
    nuova.push(new Array(colonne).fill(eTerreno ? "#" : "-"));
  }
  nuova[RIGHE_EDITOR - 3][1] = "P";
  nuova[RIGHE_EDITOR - 3][colonne - 2] = "F";
  return nuova;
}

// Dal testo alla griglia: ogni riga di testo viene spezzata nei suoi simboli.
// Se una riga è più corta delle altre la allunghiamo con dell'aria.
function grigliaDaRighe(righe) {
  const lunghezza = Math.max(...righe.map((riga) => riga.length));
  return righe.map((riga) => riga.padEnd(lunghezza, "-").split(""));
}

// Dalla griglia al testo: i simboli di ogni riga vengono riattaccati.
function righeDellaGriglia() {
  return griglia.map((riga) => riga.join(""));
}

// Quando si tocca una casella ci mettiamo il simbolo dell'attrezzo scelto.
function toccaCasella(riga, colonna) {
  // Di partenza e di bandiera ce ne può essere una sola:
  // prima di metterla nel posto nuovo, togliamo quella vecchia.
  if (attrezzoScelto === "P" || attrezzoScelto === "F") {
    togliSimbolo(attrezzoScelto);
  }
  griglia[riga][colonna] = attrezzoScelto;
  disegnaEditor();
}

function togliSimbolo(simbolo) {
  for (const riga of griglia) {
    for (let colonna = 0; colonna < riga.length; colonna++) {
      if (riga[colonna] === simbolo) riga[colonna] = "-";
    }
  }
}

// Allunga o accorcia il livello di 5 colonne dal lato destro.
function cambiaLunghezza(quanto) {
  const nuovaLunghezza = griglia[0].length + quanto;
  if (nuovaLunghezza < COLONNE_MINIME || nuovaLunghezza > COLONNE_MASSIME) return;
  for (let riga = 0; riga < griglia.length; riga++) {
    const eTerreno = riga >= griglia.length - 2;
    while (griglia[riga].length < nuovaLunghezza) griglia[riga].push(eTerreno ? "#" : "-");
    griglia[riga].length = nuovaLunghezza;
  }
  disegnaEditor();
}

function contaSimbolo(simbolo) {
  return righeDellaGriglia().join("").split(simbolo).length - 1;
}

// Per giocare un livello servono una partenza e una bandiera.
function livelloCompleto() {
  if (contaSimbolo("P") === 0) {
    avvisa("Manca la partenza! Scegli 🦸 e tocca la casella da dove vuoi cominciare.");
    return false;
  }
  if (contaSimbolo("F") === 0) {
    avvisa("Manca la bandiera! Scegli 🚩 e tocca la casella dove finisce il livello.");
    return false;
  }
  return true;
}


// =====================================================================
//  DISEGNARE LA PAGINA DELL'EDITOR
// =====================================================================

// Ridisegna tutta la griglia e, sotto, il testo del livello.
function disegnaEditor() {
  const contenitore = document.getElementById("grigliaEditor");
  contenitore.replaceChildren();
  contenitore.style.gridTemplateColumns = "repeat(" + griglia[0].length + ", 40px)";
  for (let riga = 0; riga < griglia.length; riga++) {
    for (let colonna = 0; colonna < griglia[riga].length; colonna++) {
      contenitore.append(creaCasella(riga, colonna));
    }
  }
  mostraTestoLivello();
  mostraAttrezzoScelto();
}

function creaCasella(riga, colonna) {
  const simbolo = griglia[riga][colonna];
  const casella = document.createElement("button");
  casella.className = "casella";
  casella.textContent = DISEGNI_CASELLE[simbolo];
  if (simbolo === "#") {
    casella.classList.add("terreno");
    // Se sopra non c'è altro terreno, ci cresce il prato (come nel gioco).
    const sopraETerreno = riga > 0 && griglia[riga - 1][colonna] === "#";
    if (!sopraETerreno) casella.classList.add("prato");
  }
  casella.addEventListener("click", () => toccaCasella(riga, colonna));
  return casella;
}

// Scrive il livello come lo si scriverebbe in levels.js: ogni riga tra virgolette.
function mostraTestoLivello() {
  const testo = righeDellaGriglia().map((riga) => '"' + riga + '",').join("\n");
  document.getElementById("testoLivello").textContent = testo;
}

function creaPulsanteAttrezzo(attrezzo) {
  const pulsante = document.createElement("button");
  pulsante.className = "attrezzo";
  pulsante.textContent = attrezzo.icona + " " + attrezzo.nome + "  " + attrezzo.simbolo;
  pulsante.addEventListener("click", () => {
    attrezzoScelto = attrezzo.simbolo;
    mostraAttrezzoScelto();
  });
  attrezzo.pulsante = pulsante;
  document.getElementById("attrezzi").append(pulsante);
}

function mostraAttrezzoScelto() {
  for (const attrezzo of ATTREZZI) {
    attrezzo.pulsante.classList.toggle("scelto", attrezzo.simbolo === attrezzoScelto);
  }
}

// Apre l'editor. Con un livello salvato lo si modifica, senza niente se ne comincia uno nuovo.
function apriEditor(livello) {
  if (livello) {
    griglia = grigliaDaRighe(livello.righe);
    livelloAperto = livello.id;
    campoNomeLivello.value = livello.nome;
    campoAutoreLivello.value = livello.autore;
  } else {
    griglia = creaGrigliaNuova(COLONNE_INIZIALI);
    livelloAperto = null;
    campoNomeLivello.value = "";
  }
  attrezzoScelto = "#";
  riapriEditor();
}

function riapriEditor() {
  disegnaEditor();
  mostraPagina("paginaEditor");
}


// =====================================================================
//  GIOCARE E SALVARE
// =====================================================================

function giocaIlMioLivello() {
  if (!livelloCompleto()) return;
  const nome = campoNomeLivello.value.trim() || "Il mio livello";
  nascondiPagine();
  // Quando la prova finisce si torna qui nell'editor (vedi game.js).
  giocaLivelloCreato(righeDellaGriglia(), nome, riapriEditor);
}

async function salvaIlMioLivello() {
  if (!livelloCompleto()) return;
  const nome = campoNomeLivello.value.trim();
  if (nome === "") {
    avvisa("Manca il nome! Come si chiama il tuo livello?");
    return;
  }

  const scheda = {
    nome: nome,
    autore: campoAutoreLivello.value.trim(),
    righe: righeDellaGriglia(),
    creatoIl: new Date().toISOString(),
  };
  // SE stiamo modificando un livello già salvato, teniamo il suo numero:
  // così la scheda nuova prende il posto di quella vecchia.
  if (livelloAperto !== null) scheda.id = livelloAperto;

  try {
    livelloAperto = await salvaLivello(scheda);
  } catch (errore) {
    avvisa("Ops, su questo dispositivo non riesco a salvare i livelli.");
    return;
  }
  faiFesta();
  await aggiornaLivelli();
  apriLivelli();
}


// =====================================================================
//  LA PAGINA "I MIEI LIVELLI"
// =====================================================================

function apriLivelli() {
  const contenitore = document.getElementById("elencoLivelli");
  contenitore.replaceChildren();
  if (livelliSalvati.length === 0) {
    contenitore.append(creaRiga("vuoto", "Ancora nessun livello. Creane uno tu! 🧱"));
  }
  for (const livello of livelliSalvati) {
    contenitore.append(creaCartaLivello(livello));
  }
  mostraPagina("paginaLivelli");
}

// La carta di un livello: nome, autore, il livello "scritto" in piccolo e i pulsanti.
function creaCartaLivello(livello) {
  const carta = document.createElement("div");
  carta.className = "cartaLivello";
  carta.append(creaRiga("nomeFigurina", livello.nome));
  if (livello.autore) carta.append(creaRiga("rigaFigurina", "Creato da: " + livello.autore));

  const miniatura = document.createElement("pre");
  miniatura.className = "miniLivello";
  miniatura.textContent = livello.righe.join("\n");
  carta.append(miniatura);

  const pulsanti = document.createElement("div");
  pulsanti.className = "riga";
  pulsanti.append(
    creaPulsanteLivello("▶ Gioca", "verde", () => giocaLivelloSalvato(livello)),
    creaPulsanteLivello("✏️ Modifica", "", () => apriEditor(livello)),
    creaPulsanteLivello("📤 Condividi", "", () => condividiCose([], [], [livello], "livello-avventura.json")),
    creaPulsanteLivello("🗑️", "", () => eliminaLivelloSalvato(livello))
  );
  carta.append(pulsanti);
  return carta;
}

function creaPulsanteLivello(testo, classe, alTocco) {
  const pulsante = document.createElement("button");
  pulsante.textContent = testo;
  pulsante.className = classe;
  pulsante.addEventListener("click", alTocco);
  return pulsante;
}

function giocaLivelloSalvato(livello) {
  nascondiPagine();
  giocaLivelloCreato(livello.righe, livello.nome, apriLivelli);
}

async function eliminaLivelloSalvato(livello) {
  const sicuro = await faiDomanda("Sei sicuro? Il livello sparirà per sempre");
  if (!sicuro) return;
  if (!(await passwordGenitoreGiusta())) return;
  await eliminaLivello(livello.id);
  await aggiornaLivelli();
  apriLivelli();
}


// =====================================================================
//  COLLEGHIAMO TUTTO
// =====================================================================

for (const attrezzo of ATTREZZI) {
  creaPulsanteAttrezzo(attrezzo);
}

document.getElementById("menuLivelli").addEventListener("click", () => apriLivelli());
document.getElementById("nuovoLivello").addEventListener("click", () => apriEditor(null));
document.getElementById("tornaAiLivelli").addEventListener("click", () => apriLivelli());
document.getElementById("piuLungo").addEventListener("click", () => cambiaLunghezza(5));
document.getElementById("piuCorto").addEventListener("click", () => cambiaLunghezza(-5));
document.getElementById("giocaMioLivello").addEventListener("click", giocaIlMioLivello);
document.getElementById("salvaMioLivello").addEventListener("click", salvaIlMioLivello);

// All'avvio leggiamo subito i livelli dalla memoria.
aggiornaLivelli();
