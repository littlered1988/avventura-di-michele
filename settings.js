// =====================================================================
//  SETTINGS.JS - LE MANOPOLE DEL GIOCO
// =====================================================================
//  Qui ci sono i numeri che decidono come si comporta il gioco.
//  Prova a cambiarne uno, salva il file e ricarica la pagina:
//  il gioco cambia! Sei tu che comandi.
// =====================================================================

// Quanto forte il mondo tira giù il personaggio. Più è grande, più cade in fretta.
let gravita = 0.5;

// Quanta spinta ha il salto. Più è grande, più si salta in alto.
let forzaSalto = 11;

// Quanto corre veloce il personaggio (in puntini dello schermo a ogni passo).
let velocita = 4;

// Quanto è grande il personaggio. 48 è grande come un blocco di terreno.
let dimensionePersonaggio = 40;

// Il colore del cielo. Puoi scrivere anche un nome inglese, come "pink" o "orange".
let coloreCielo = "hsl(200, 80%, 75%)";

// Quanto camminano veloci i nemici. Con 0 stanno fermi!
let velocitaNemici = 1;

// Quanti punti si guadagnano saltando in testa a un mostro.
let puntiMostro = 200;


// =====================================================================
//  IL PANNELLO SEGRETO
// =====================================================================
//  Si apre tenendo premuto per 3 secondi sul titolo, oppure col tasto P.
//  Ogni slider (la levetta che scorre) è collegato a una manopola qui sopra.
// =====================================================================

// L'elenco degli slider. Per ognuno diciamo:
//   nome     = come si chiama la variabile nel codice
//   minimo   = il valore più piccolo dello slider
//   massimo  = il valore più grande dello slider
//   passo    = di quanto cambia a ogni scatto
//   leggi    = come si legge il valore di adesso
//   scrivi   = come si cambia il valore
const manopole = [
  {
    nome: "gravita", minimo: 0.1, massimo: 1.5, passo: 0.05,
    leggi: () => gravita,
    scrivi: (valore) => { gravita = valore; },
  },
  {
    nome: "forzaSalto", minimo: 4, massimo: 20, passo: 0.5,
    leggi: () => forzaSalto,
    scrivi: (valore) => { forzaSalto = valore; },
  },
  {
    nome: "velocita", minimo: 1, massimo: 10, passo: 0.5,
    leggi: () => velocita,
    scrivi: (valore) => { velocita = valore; },
  },
  {
    nome: "dimensionePersonaggio", minimo: 20, massimo: 90, passo: 2,
    leggi: () => dimensionePersonaggio,
    scrivi: (valore) => { dimensionePersonaggio = valore; },
  },
  {
    // Per il colore lo slider sceglie la "tinta": un numero da 0 a 360
    // che fa il giro di tutti i colori dell'arcobaleno. 200 è l'azzurro.
    nome: "coloreCielo", minimo: 0, massimo: 360, passo: 1, partenza: 200,
    leggi: () => '"' + coloreCielo + '"',
    scrivi: (tinta) => { coloreCielo = "hsl(" + tinta + ", 80%, 75%)"; },
  },
  {
    nome: "velocitaNemici", minimo: 0, massimo: 5, passo: 0.25,
    leggi: () => velocitaNemici,
    scrivi: (valore) => { velocitaNemici = valore; },
  },
  {
    nome: "puntiMostro", minimo: 0, massimo: 1000, passo: 50,
    leggi: () => puntiMostro,
    scrivi: (valore) => { puntiMostro = valore; },
  },
];

const pannello = document.getElementById("pannello");

// Costruisce uno slider con sopra la scritta "nome = valore".
function creaManopola(manopola) {
  const riga = document.createElement("label");
  const scritta = document.createElement("code");
  const slider = document.createElement("input");

  slider.type = "range";
  slider.min = manopola.minimo;
  slider.max = manopola.massimo;
  slider.step = manopola.passo;
  slider.value = manopola.partenza ?? manopola.leggi();
  scritta.textContent = manopola.nome + " = " + manopola.leggi();

  // Ogni volta che lo slider si muove, cambiamo la variabile vera
  // e riscriviamo la scritta. Il gioco se ne accorge subito!
  slider.addEventListener("input", () => {
    manopola.scrivi(Number(slider.value));
    scritta.textContent = manopola.nome + " = " + manopola.leggi();
  });

  riga.append(scritta, slider);
  document.getElementById("manopole").append(riga);
}

function apriPannello() {
  pannello.classList.remove("nascosto");
}

function chiudiPannello() {
  pannello.classList.add("nascosto");
}

// --- Costruiamo tutti gli slider ---
for (const manopola of manopole) {
  creaManopola(manopola);
}

// --- Apertura segreta numero 1: tenere premuto 3 secondi sul titolo ---
const titoloSegreto = document.getElementById("titolo");
let timerTitolo = null;

titoloSegreto.addEventListener("pointerdown", () => {
  timerTitolo = setTimeout(apriPannello, 3000);
});
for (const fine of ["pointerup", "pointerleave", "pointercancel"]) {
  titoloSegreto.addEventListener(fine, () => clearTimeout(timerTitolo));
}

// Qualcuno sta scrivendo in un campo di testo? Allora i tasti servono
// per scrivere (il nome di un personaggio, la password...) e non per giocare.
function staScrivendo(evento) {
  return evento.target.matches && evento.target.matches('input[type="text"], input[type="password"]');
}

// --- Apertura segreta numero 2: il tasto P apre e chiude ---
window.addEventListener("keydown", (evento) => {
  if (evento.code === "KeyP" && !staScrivendo(evento)) pannello.classList.toggle("nascosto");
});

document.getElementById("chiudiPannello").addEventListener("click", (evento) => {
  chiudiPannello();
  evento.target.blur();
});


// =====================================================================
//  LA PASSWORD DEL GENITORE
// =====================================================================
//  Serve solo a una cosa: se c'è, viene chiesta prima di eliminare un
//  personaggio dalla galleria, così nessuno cancella per sbaglio il
//  mostro di un amico. Se è vuota ("") non viene chiesto niente.
//
//  La password resta scritta nella memoria del browser di questo
//  dispositivo. È un lucchetto per bambini, non una cassaforte!

function leggiPasswordSalvata() {
  try {
    return localStorage.getItem("passwordGenitore") || "";
  } catch (errore) {
    return "";
  }
}

function scriviPasswordSalvata(password) {
  try {
    localStorage.setItem("passwordGenitore", password);
  } catch (errore) {
    // Se il browser non lascia salvare, la password vale solo finché la pagina resta aperta.
  }
}

let passwordGenitore = leggiPasswordSalvata();
const pulsantePassword = document.getElementById("pulsantePassword");

function aggiornaPulsantePassword() {
  pulsantePassword.textContent = passwordGenitore === ""
    ? "🔓 Metti una password genitore"
    : "🔑 Cambia la password genitore";
}

// Per cambiare una password che c'è già bisogna prima sapere quella vecchia.
async function cambiaPasswordGenitore() {
  if (passwordGenitore !== "") {
    const vecchia = await faiDomanda("Scrivi la password di adesso:", "password");
    if (vecchia === null) return;
    if (vecchia !== passwordGenitore) {
      avvisa("La password non è giusta.");
      return;
    }
  }
  const nuova = await faiDomanda("Nuova password del genitore (lascia vuoto per toglierla):", "password");
  if (nuova === null) return;
  passwordGenitore = nuova;
  scriviPasswordSalvata(nuova);
  aggiornaPulsantePassword();
}

pulsantePassword.addEventListener("click", cambiaPasswordGenitore);
aggiornaPulsantePassword();
