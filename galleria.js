// =====================================================================
//  GALLERIA.JS - LE PAGINE DEI PERSONAGGI
// =====================================================================
//  Qui ci sono le pagine con le "figurine":
//    - la Galleria (tutti gli eroi e tutti i mostri)
//    - "Chi gioca?" (la scelta dell'eroe prima di una partita)
//    - la Classifica degli eroi
//  e le piccole finestre per fare una domanda o dare un avviso.
// =====================================================================

// L'elenco di tutti i personaggi, copiato dalla memoria (vedi personaggi.js).
let personaggi = [];

// Se dalla galleria si sceglie "Gioca con lui" su un mostro,
// in quella partita tutti i mostri saranno lui.
let mostroForzato = null;

// Rilegge l'elenco dalla memoria. Va chiamata dopo ogni cambiamento.
async function aggiornaElenco() {
  let nuovi;
  try {
    nuovi = await caricaPersonaggi();
  } catch (errore) {
    nuovi = [eroePredefinito()];   // se la memoria non funziona, resta almeno lui
  }
  // I disegni già caricati li teniamo, così non li ricarichiamo ogni volta.
  for (const nuovo of nuovi) {
    const vecchio = personaggi.find((personaggio) => personaggio.id === nuovo.id);
    if (vecchio) nuovo.figura = vecchio.figura;
  }
  personaggi = nuovi;
}

function elencoEroi() {
  return personaggi.filter((personaggio) => personaggio.tipo === "eroe");
}

function elencoMostri() {
  return personaggi.filter((personaggio) => personaggio.tipo === "mostro");
}

// Pesca un mostro a caso tra quelli salvati.
// Se non ce ne sono risponde null, e il gioco userà il mostro predefinito.
function mostroACaso() {
  if (mostroForzato) return mostroForzato;
  const mostri = elencoMostri();
  if (mostri.length === 0) return null;
  return mostri[Math.floor(Math.random() * mostri.length)];
}

// Il disegno di un personaggio, pronto per essere usato nel gioco.
// Risponde null se il personaggio non ha un disegno suo.
function figuraDi(personaggio) {
  if (!personaggio || !personaggio.immagine) return null;
  if (!personaggio.figura) {
    personaggio.figura = caricaImmagine(URL.createObjectURL(personaggio.immagine));
  }
  return personaggio.figura;
}


// =====================================================================
//  LE PAGINE
// =====================================================================

function nascondiPagine() {
  for (const pagina of document.querySelectorAll(".pagina")) {
    pagina.classList.add("nascosto");
  }
}

function mostraPagina(idPagina) {
  nascondiPagine();
  document.getElementById("schermata").classList.add("nascosto");
  document.getElementById(idPagina).classList.remove("nascosto");
}

function tornaAlTitolo() {
  nascondiPagine();
  mostraTitolo();
}

// ---------- Le figurine ----------

// Costruisce una figurina: disegno, nome, "creato da" e qualche riga in più.
// Se c'è "alTocco", la figurina diventa un pulsante.
function creaFigurina(personaggio, righeInPiu, alTocco) {
  const figurina = document.createElement(alTocco ? "button" : "div");
  figurina.className = "figurina";
  figurina.append(creaDisegno(personaggio));
  figurina.append(creaRiga("nomeFigurina", personaggio.nome));
  if (personaggio.autore) {
    figurina.append(creaRiga("rigaFigurina", "Creato da: " + personaggio.autore));
  }
  for (const riga of righeInPiu) {
    figurina.append(creaRiga("rigaFigurina", riga));
  }
  if (alTocco) figurina.addEventListener("click", () => alTocco(personaggio));
  return figurina;
}

function creaRiga(classe, testo) {
  const riga = document.createElement("div");
  riga.className = classe;
  riga.textContent = testo;
  return riga;
}

// Il disegno della figurina. L'eroe predefinito usa assets/player.png;
// se non c'è nemmeno quello, mettiamo una faccina.
function creaDisegno(personaggio) {
  const figura = figuraDi(personaggio) || (immagini.player.pronta ? immagini.player : null);
  if (!figura) return creaRiga("faccina", "🦸");
  const disegno = document.createElement("img");
  disegno.src = figura.src;
  disegno.alt = "";
  return disegno;
}

// Riempie un contenitore con una figurina per ogni personaggio dell'elenco.
function mostraFigurine(idContenitore, elenco, righeInPiu, alTocco, messaggioSeVuoto) {
  const contenitore = document.getElementById(idContenitore);
  contenitore.replaceChildren();
  if (elenco.length === 0) {
    contenitore.append(creaRiga("vuoto", messaggioSeVuoto));
  }
  for (const personaggio of elenco) {
    contenitore.append(creaFigurina(personaggio, righeInPiu(personaggio), alTocco));
  }
}

function nessunaRiga() {
  return [];
}

// ---------- La Galleria ----------

function apriGalleria() {
  mostraFigurine("figurineEroi", elencoEroi(), nessunaRiga, apriFigurina, "");
  mostraFigurine("figurineMostri", elencoMostri(), nessunaRiga, apriFigurina,
    "Ancora nessun mostro. Disegnane uno tu! 👾");
  mostraPagina("paginaGalleria");
}

// ---------- "Chi gioca?" ----------

function apriSceltaEroe(mostro) {
  mostroForzato = mostro || null;
  mostraFigurine("figurineScelta", elencoEroi(), nessunaRiga, giocaConEroe, "");
  mostraPagina("paginaScelta");
}

function giocaConEroe(eroe) {
  nascondiPagine();
  iniziaPartita(eroe);
}

// ---------- La Classifica ----------

function apriClassifica() {
  const eroi = elencoEroi();
  eroi.sort((a, b) => b.recordStelle - a.recordStelle || b.livelloMassimo - a.livelloMassimo);
  mostraFigurine("figurineClassifica", eroi, (eroe) => righeRecord(eroe, eroi.indexOf(eroe)), null, "");
  mostraPagina("paginaClassifica");
}

// Le righe sotto la figurina in classifica. Ognuno ha un premio:
// una medaglia per i primi tre, una stella per tutti gli altri.
function righeRecord(eroe, posizione) {
  if (eroe.livelloMassimo === 0) return ["🚀 Pronto per la prima avventura!"];
  const premi = ["🥇", "🥈", "🥉"];
  const premio = premi[posizione] || "🌟";
  return [premio + " " + eroe.recordStelle + " stelle", "Arrivato al livello " + eroe.livelloMassimo];
}


// =====================================================================
//  LA FINESTRA DI UNA FIGURINA: Gioca, Rinomina, Elimina
// =====================================================================

const finestraFigurina = document.getElementById("finestraFigurina");
let figurinaAperta = null;

function apriFigurina(personaggio) {
  figurinaAperta = personaggio;
  document.getElementById("figurinaGrande").replaceChildren(creaFigurina(personaggio, [], null));
  // L'eroe predefinito non si può né rinominare né eliminare.
  const ePredefinito = personaggio.id === ID_PREDEFINITO;
  document.getElementById("azioneRinomina").classList.toggle("nascosto", ePredefinito);
  document.getElementById("azioneElimina").classList.toggle("nascosto", ePredefinito);
  document.getElementById("azioneCondividi").classList.toggle("nascosto", ePredefinito);
  finestraFigurina.classList.remove("nascosto");
}

function chiudiFigurina() {
  finestraFigurina.classList.add("nascosto");
}

// Con un eroe si gioca subito. Con un mostro bisogna prima scegliere l'eroe.
function giocaConFigurina() {
  chiudiFigurina();
  if (figurinaAperta.tipo === "eroe") {
    giocaConEroe(figurinaAperta);
  } else {
    apriSceltaEroe(figurinaAperta);
  }
}

async function rinominaFigurina() {
  const risposta = await faiDomanda("Come si chiama adesso?", "text", figurinaAperta.nome);
  if (risposta === null || risposta.trim() === "") return;
  await rinominaPersonaggio(figurinaAperta.id, risposta.trim().slice(0, 24));
  chiudiFigurina();
  await aggiornaElenco();
  apriGalleria();
}

async function eliminaFigurina() {
  const sicuro = await faiDomanda("Sei sicuro? Il personaggio sparirà per sempre");
  if (!sicuro) return;

  if (!(await passwordGenitoreGiusta())) return;

  await eliminaPersonaggio(figurinaAperta.id);
  chiudiFigurina();
  await aggiornaElenco();
  apriGalleria();
}


// SE un genitore ha messo una password, la chiediamo prima di cancellare qualcosa.
// Risponde true se si può andare avanti (password giusta, oppure nessuna password).
async function passwordGenitoreGiusta() {
  if (passwordGenitore === "") return true;
  const parola = await faiDomanda("Chiedi a un grande di scrivere la password:", "password");
  if (parola === null) return false;
  if (parola !== passwordGenitore) {
    avvisa("La password non è giusta: resta tutto al suo posto. 🙂");
    return false;
  }
  return true;
}


// =====================================================================
//  DOMANDE E AVVISI
// =====================================================================

const finestraDomanda = document.getElementById("finestraDomanda");
const campoDomanda = document.getElementById("campoDomanda");
const rispostaSi = document.getElementById("rispostaSi");
const rispostaNo = document.getElementById("rispostaNo");

// Mostra una domanda e aspetta la risposta.
//   - senza campo: risponde true (Sì) oppure null (No)
//   - con un campo ("text" o "password"): risponde quello che è stato scritto, oppure null (Annulla)
function faiDomanda(testo, tipoCampo, scrittaIniziale) {
  document.getElementById("testoDomanda").textContent = testo;
  campoDomanda.classList.toggle("nascosto", !tipoCampo);
  campoDomanda.type = tipoCampo || "text";
  campoDomanda.value = scrittaIniziale || "";
  rispostaSi.textContent = tipoCampo ? "OK" : "Sì";
  rispostaNo.textContent = tipoCampo ? "Annulla" : "No";
  rispostaNo.classList.remove("nascosto");
  finestraDomanda.classList.remove("nascosto");

  return new Promise((rispondi) => {
    rispostaSi.onclick = () => {
      finestraDomanda.classList.add("nascosto");
      rispondi(tipoCampo ? campoDomanda.value : true);
    };
    rispostaNo.onclick = () => {
      finestraDomanda.classList.add("nascosto");
      rispondi(null);
    };
  });
}

// Un avviso è una domanda con un solo pulsante: "OK".
function avvisa(testo) {
  const risposta = faiDomanda(testo);
  rispostaSi.textContent = "OK";
  rispostaNo.classList.add("nascosto");
  return risposta;
}

// ---------- La festa ----------

// Fa piovere coriandoli per un paio di secondi.
function faiFesta() {
  const festa = document.getElementById("festa");
  const coriandoli = ["🎉", "⭐", "🎈", "✨", "🎊"];
  for (let numero = 0; numero < 30; numero++) {
    const coriandolo = document.createElement("span");
    coriandolo.textContent = coriandoli[numero % coriandoli.length];
    coriandolo.style.left = Math.random() * 100 + "%";
    coriandolo.style.animationDelay = Math.random() * 0.6 + "s";
    festa.append(coriandolo);
  }
  setTimeout(() => festa.replaceChildren(), 3000);
}


// =====================================================================
//  COLLEGHIAMO I PULSANTI
//  (quelli per esportare, condividere e importare sono in scambio.js)
// =====================================================================

document.getElementById("menuCrea").addEventListener("click", () => apriCreazione());
document.getElementById("menuGalleria").addEventListener("click", () => apriGalleria());
document.getElementById("menuClassifica").addEventListener("click", () => apriClassifica());

for (const pulsante of document.querySelectorAll(".indietro")) {
  pulsante.addEventListener("click", tornaAlTitolo);
}

document.getElementById("azioneGioca").addEventListener("click", giocaConFigurina);
document.getElementById("azioneRinomina").addEventListener("click", rinominaFigurina);
document.getElementById("azioneElimina").addEventListener("click", eliminaFigurina);
document.getElementById("azioneChiudi").addEventListener("click", chiudiFigurina);

// All'avvio leggiamo subito i personaggi dalla memoria.
aggiornaElenco();
