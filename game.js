// =====================================================================
//  GAME.JS - IL CUORE DEL GIOCO
// =====================================================================
//  Un videogioco è come un cartone animato che si ridisegna 60 volte
//  al secondo. Ogni volta fa due cose:
//    1. AGGIORNA: sposta il personaggio, i nemici, controlla chi tocca chi
//    2. DISEGNA:  cancella tutto e ridisegna il mondo nella nuova posizione
//
//  Questo file è diviso in capitoli:
//    1. Le cose che ci servono
//    2. Immagini e suoni
//    3. Costruire il livello
//    4. Aggiornare il mondo (movimento e collisioni)
//    5. Vite, vittoria e cartelli
//    6. Disegnare il mondo
//    7. Tastiera e pulsanti
//    8. Si parte!
// =====================================================================


// =====================================================================
//  1. LE COSE CHE CI SERVONO
// =====================================================================

// Il foglio su cui disegniamo e la "penna" per disegnarci sopra.
const schermo = document.getElementById("schermo");
const penna = schermo.getContext("2d");

const CASELLA = 48;               // quanto è grande una casella del livello
const VITE_INIZIALI = 3;          // con quanti cuori si parte
const TEMPO_INVULNERABILE = 90;   // per quanti passi si lampeggia dopo un colpo (90 = un secondo e mezzo)
const PASSI_NEMICO = 3;           // di quante caselle si allontana un nemico prima di tornare indietro
const CADUTA_MASSIMA = 20;        // la velocità più alta a cui si può cadere
const TEMPO_SCHIACCIATO = 30;     // per quanti passi un mostro resta schiacciato prima di sparire (30 = mezzo secondo)
const DURATA_SCRITTA = 60;        // per quanti passi si vede una scritta come "+200" (60 = un secondo)
const PASSO_DI_TEMPO = 1000 / 60; // il mondo si aggiorna 60 volte al secondo

// In che momento del gioco siamo: "titolo", "gioco", "riprova" oppure "vittoria".
let stato = "titolo";

let numeroLivello = 0;      // 0 è il primo livello, 1 il secondo...
let mappa = [];             // le righe di testo del livello di adesso
let larghezzaLivello = 0;
let altezzaLivello = 0;

let giocatore = null;
let partenza = { colonna: 1, riga: 1 };
let nemici = [];
let stelle = [];
let bandiera = null;

let vite = VITE_INIZIALI;
let stelleRaccolte = 0;
let stelleAInizioLivello = 0;
let punti = 0;
let puntiAInizioLivello = 0;
let scritte = [];           // le scritte volanti, come "+200"

// Quando si gioca un livello fatto con l'editor (vedi editor.js) qui dentro ci sono
// le sue righe, il suo nome e cosa fare quando si esce. Altrimenti è null.
let livelloCreato = null;

let eroeScelto = null;              // il personaggio con cui si sta giocando (vedi galleria.js)
let mostriAnnunciati = new Set();     // i mostri di cui abbiamo già detto "Attento! Arriva..."
let larghezzaVista = 0;               // quanto mondo si vede sullo schermo, da sinistra a destra

let telecameraX = 0;        // quanto abbiamo "scorso" il mondo verso destra
let orologio = 0;           // conta i passi: serve per le piccole animazioni

// Quali comandi sono premuti in questo momento.
const tasti = { sinistra: false, destra: false, salta: false };


// =====================================================================
//  2. IMMAGINI E SUONI
// =====================================================================
//  Proviamo a caricare i file dalla cartella assets/.
//  Se un file non c'è, non succede niente di grave: usiamo un disegno
//  o un suono "finto" al suo posto.

function caricaImmagine(percorso) {
  const immagine = new Image();
  immagine.pronta = false;
  immagine.onload = () => { immagine.pronta = true; };
  immagine.src = percorso;
  return immagine;
}

const immagini = {
  player: caricaImmagine("assets/player.png"),
  nemico: caricaImmagine("assets/nemico.png"),
  stella: caricaImmagine("assets/stella.png"),
};

function caricaSuono(percorso) {
  const suono = new Audio();
  suono.pronto = false;
  suono.addEventListener("canplaythrough", () => { suono.pronto = true; });
  suono.src = percorso;
  return suono;
}

const suoni = {
  salto: caricaSuono("assets/salto.mp3"),
  stella: caricaSuono("assets/stella.mp3"),
  ahi: caricaSuono("assets/ahi.mp3"),
  vittoria: caricaSuono("assets/vittoria.mp3"),
  schiacciato: caricaSuono("assets/schiacciato.mp3"),
};

// I suoni finti: ognuno è una piccola melodia.
// Ogni nota è scritta così: [altezza della nota, durata in secondi]
const suoniFinti = {
  salto: [[300, 0.08], [500, 0.1]],
  stella: [[900, 0.07], [1300, 0.12]],
  ahi: [[250, 0.12], [150, 0.2]],
  vittoria: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]],
  schiacciato: [[400, 0.06], [200, 0.08], [100, 0.12]],
};

let audioSpento = false;
let sintetizzatore = null;   // lo strumento che crea i suoni finti

// I browser lasciano fare rumore solo dopo che qualcuno ha toccato la pagina.
// Per questo accendiamo il sintetizzatore al primo tocco o al primo tasto.
function preparaAudio() {
  if (!sintetizzatore) {
    const Sintetizzatore = window.AudioContext || window.webkitAudioContext;
    sintetizzatore = new Sintetizzatore();
    preparaSuoniRegistrati();   // ora si possono preparare anche le voci registrate (vedi suoni.js)
  }
  if (sintetizzatore.state === "suspended") sintetizzatore.resume();
}

function suona(nome) {
  if (audioSpento) return;
  // Prima scelta: la voce registrata e scelta nella pagina "Registra i suoni".
  if (suonaRegistrato(nome)) return;
  // Seconda scelta: il file nella cartella assets/. Terza: il suono finto.
  const registrazione = suoni[nome];
  if (registrazione.pronto) {
    registrazione.currentTime = 0;
    registrazione.play().catch(() => {});
  } else {
    suonaFinto(nome);
  }
}

function suonaFinto(nome) {
  if (!sintetizzatore) return;
  let quando = sintetizzatore.currentTime;
  for (const [altezza, durata] of suoniFinti[nome]) {
    suonaNota(altezza, quando, durata);
    quando += durata;
  }
}

function suonaNota(altezza, inizio, durata) {
  const oscillatore = sintetizzatore.createOscillator();
  const volume = sintetizzatore.createGain();
  oscillatore.type = "square";
  oscillatore.frequency.value = altezza;
  // La nota parte piano e si spegne dolcemente.
  volume.gain.setValueAtTime(0.15, inizio);
  volume.gain.exponentialRampToValueAtTime(0.001, inizio + durata);
  oscillatore.connect(volume);
  volume.connect(sintetizzatore.destination);
  oscillatore.start(inizio);
  oscillatore.stop(inizio + durata);
}

function cambiaAudio() {
  audioSpento = !audioSpento;
  pulsanteAudio.textContent = audioSpento ? "🔇" : "🔊";
}


// =====================================================================
//  3. COSTRUIRE IL LIVELLO
// =====================================================================
//  Leggiamo il disegno fatto di lettere in levels.js, una casella alla
//  volta, e per ogni lettera speciale creiamo la cosa giusta.

function caricaLivello(numero) {
  // SE stiamo giocando un livello dell'editor usiamo quello,
  // ALTRIMENTI il livello numero tot di levels.js.
  mappa = livelloCreato ? livelloCreato.righe : livelli[numero];
  nemici = [];
  stelle = [];
  scritte = [];
  bandiera = null;
  altezzaLivello = mappa.length * CASELLA;
  larghezzaLivello = 0;

  for (let riga = 0; riga < mappa.length; riga++) {
    larghezzaLivello = Math.max(larghezzaLivello, mappa[riga].length * CASELLA);
    for (let colonna = 0; colonna < mappa[riga].length; colonna++) {
      const lettera = mappa[riga][colonna];
      if (lettera === "P") partenza = { colonna: colonna, riga: riga };
      if (lettera === "E") nemici.push(creaNemico(colonna, riga));
      if (lettera === "*") stelle.push(creaStella(colonna, riga));
      if (lettera === "F") bandiera = creaBandiera(colonna, riga);
    }
  }
  giocatore = creaGiocatore();
}

// Ogni "cosa" del gioco è un rettangolo: ha una posizione (x, y)
// e una grandezza (larghezza, altezza). x cresce verso destra, y verso il basso.

function creaGiocatore() {
  return {
    x: partenza.colonna * CASELLA,
    y: (partenza.riga + 1) * CASELLA - dimensionePersonaggio,
    larghezza: dimensionePersonaggio,
    altezza: dimensionePersonaggio,
    velocitaX: 0,
    velocitaY: 0,
    aTerra: false,
    guardaADestra: true,
    invulnerabile: 0,
    piediPrima: (partenza.riga + 1) * CASELLA,   // dove erano i piedi un attimo fa
  };
}

function creaNemico(colonna, riga) {
  const grandezza = 40;
  const x = colonna * CASELLA + (CASELLA - grandezza) / 2;
  return {
    x: x,
    y: (riga + 1) * CASELLA - grandezza,
    larghezza: grandezza,
    altezza: grandezza,
    xPartenza: x,
    direzione: -1,   // -1 = va a sinistra, 1 = va a destra
    sconfitto: false,
    tempoSchiacciato: 0,
    personaggio: mostroACaso(),   // quale mostro della galleria è (null = quello predefinito)
  };
}

function creaStella(colonna, riga) {
  const grandezza = 30;
  return {
    x: colonna * CASELLA + (CASELLA - grandezza) / 2,
    y: riga * CASELLA + (CASELLA - grandezza) / 2,
    larghezza: grandezza,
    altezza: grandezza,
    presa: false,
  };
}

// La bandiera è alta due caselle, così si vede bene.
function creaBandiera(colonna, riga) {
  return {
    x: colonna * CASELLA,
    y: (riga - 1) * CASELLA,
    larghezza: CASELLA,
    altezza: CASELLA * 2,
  };
}


// =====================================================================
//  4. AGGIORNARE IL MONDO
// =====================================================================

function aggiorna() {
  orologio++;
  muoviNemici();
  muoviScritte();
  if (stato === "gioco") {
    aggiornaGiocatore();
    controllaCollisioni();
    annunciaMostroInArrivo();
  }
}

// ---------- L'annuncio dei mostri ----------

const annuncio = document.getElementById("annuncio");

// La prima volta che un mostro della galleria entra nello schermo, lo presentiamo.
// Un annuncio per volta: se ce n'è già uno, gli altri aspettano il loro turno.
function annunciaMostroInArrivo() {
  if (!annuncio.classList.contains("nascosto")) return;
  for (const nemico of nemici) {
    const mostro = nemico.personaggio;
    const siVede = nemico.x < telecameraX + larghezzaVista;
    if (mostro && siVede && !mostriAnnunciati.has(mostro.id)) {
      mostriAnnunciati.add(mostro.id);
      mostraAnnuncio(fraseDiArrivo(mostro));
      return;
    }
  }
}

function fraseDiArrivo(mostro) {
  if (mostro.autore) return "Attento! Arriva " + mostro.nome + " di " + mostro.autore + "!";
  return "Attento! Arriva " + mostro.nome + "!";
}

// Mostra la scritta e dopo 3 secondi (3000 millisecondi) la nasconde.
function mostraAnnuncio(testo) {
  annuncio.textContent = testo;
  annuncio.classList.remove("nascosto");
  setTimeout(() => annuncio.classList.add("nascosto"), 3000);
}

// ---------- Il terreno ----------

// In questa casella c'è un blocco di terreno?
function eUnBlocco(colonna, riga) {
  // Ai lati del livello ci sono due muri invisibili, così non si esce.
  if (colonna < 0 || colonna >= larghezzaLivello / CASELLA) return true;
  // Sopra e sotto il livello c'è solo aria.
  if (riga < 0 || riga >= mappa.length) return false;
  return mappa[riga][colonna] === "#";
}

// Questo rettangolo sta toccando almeno un blocco di terreno?
function toccaUnBlocco(cosa) {
  const primaColonna = Math.floor(cosa.x / CASELLA);
  const ultimaColonna = Math.floor((cosa.x + cosa.larghezza - 0.01) / CASELLA);
  const primaRiga = Math.floor(cosa.y / CASELLA);
  const ultimaRiga = Math.floor((cosa.y + cosa.altezza - 0.01) / CASELLA);

  for (let riga = primaRiga; riga <= ultimaRiga; riga++) {
    for (let colonna = primaColonna; colonna <= ultimaColonna; colonna++) {
      if (eUnBlocco(colonna, riga)) return true;
    }
  }
  return false;
}

// Questi due rettangoli si toccano?
function siToccano(a, b) {
  return a.x < b.x + b.larghezza &&
         a.x + a.larghezza > b.x &&
         a.y < b.y + b.altezza &&
         a.y + a.altezza > b.y;
}

// ---------- Il giocatore ----------

function aggiornaGiocatore() {
  // Prima di muoverci ci ricordiamo dov'erano i piedi: serve per capire
  // se poi atterriamo in testa a un mostro.
  giocatore.piediPrima = giocatore.y + giocatore.altezza;
  cambiaDimensione();
  leggiComandi();
  applicaGravita();
  muoviInOrizzontale();
  muoviInVerticale();
  if (giocatore.invulnerabile > 0) giocatore.invulnerabile--;
}

// Se nel pannello segreto è cambiata dimensionePersonaggio, il giocatore
// cresce o rimpicciolisce tenendo i piedi fermi. Se crescendo finirebbe
// dentro un muro, aspetta di avere spazio.
function cambiaDimensione() {
  if (giocatore.larghezza === dimensionePersonaggio) return;
  const vecchiaDimensione = giocatore.larghezza;
  const piedi = giocatore.y + giocatore.altezza;

  giocatore.larghezza = dimensionePersonaggio;
  giocatore.altezza = dimensionePersonaggio;
  giocatore.y = piedi - dimensionePersonaggio;

  if (toccaUnBlocco(giocatore)) {
    giocatore.larghezza = vecchiaDimensione;
    giocatore.altezza = vecchiaDimensione;
    giocatore.y = piedi - vecchiaDimensione;
  }
}

function leggiComandi() {
  giocatore.velocitaX = 0;
  if (tasti.sinistra) {
    giocatore.velocitaX = -velocita;
    giocatore.guardaADestra = false;
  }
  if (tasti.destra) {
    giocatore.velocitaX = velocita;
    giocatore.guardaADestra = true;
  }
  if (tasti.salta && giocatore.aTerra) faiSaltare();
}

function faiSaltare() {
  // Verso l'alto la y diminuisce: per questo la spinta ha il segno meno.
  giocatore.velocitaY = -forzaSalto;
  giocatore.aTerra = false;
  suona("salto");
}

function applicaGravita() {
  giocatore.velocitaY += gravita;
  if (giocatore.velocitaY > CADUTA_MASSIMA) giocatore.velocitaY = CADUTA_MASSIMA;
}

function muoviInOrizzontale() {
  giocatore.x += giocatore.velocitaX;
  // Se siamo finiti dentro un muro, torniamo dove eravamo.
  if (toccaUnBlocco(giocatore)) giocatore.x -= giocatore.velocitaX;
}

function muoviInVerticale() {
  giocatore.y += giocatore.velocitaY;
  giocatore.aTerra = false;
  if (!toccaUnBlocco(giocatore)) return;

  if (giocatore.velocitaY > 0) {
    // Stava cadendo: lo appoggiamo esattamente sopra il blocco.
    const piedi = giocatore.y + giocatore.altezza;
    giocatore.y = Math.floor(piedi / CASELLA) * CASELLA - giocatore.altezza;
    giocatore.aTerra = true;
  } else {
    // Stava salendo: ha battuto la testa, lo mettiamo subito sotto il blocco.
    giocatore.y = (Math.floor(giocatore.y / CASELLA) + 1) * CASELLA;
  }
  giocatore.velocitaY = 0;
}

// ---------- I nemici ----------

function muoviNemici() {
  for (const nemico of nemici) {
    if (nemico.sconfitto) {
      nemico.tempoSchiacciato--;   // sta fermo e aspetta di sparire
    } else {
      muoviNemico(nemico);
    }
  }
  // Teniamo solo i mostri ancora vivi e quelli che si stanno ancora schiacciando.
  nemici = nemici.filter((nemico) => !nemico.sconfitto || nemico.tempoSchiacciato > 0);
}

function muoviNemico(nemico) {
  const passo = nemico.direzione * velocitaNemici;
  nemico.x += passo;
  if (nemicoDeveGirarsi(nemico)) {
    nemico.x -= passo;
    nemico.direzione = -nemico.direzione;
  }
}

// Un nemico si gira se: si è allontanato troppo, ha un muro davanti,
// oppure davanti a lui finisce il terreno.
function nemicoDeveGirarsi(nemico) {
  const troppoLontano = Math.abs(nemico.x - nemico.xPartenza) > PASSI_NEMICO * CASELLA;

  const davanti = nemico.direzione > 0 ? nemico.x + nemico.larghezza : nemico.x;
  const colonna = Math.floor(davanti / CASELLA);
  const riga = Math.floor((nemico.y + nemico.altezza / 2) / CASELLA);
  const muroDavanti = eUnBlocco(colonna, riga);
  const vuotoDavanti = !eUnBlocco(colonna, riga + 1);

  return troppoLontano || muroDavanti || vuotoDavanti;
}

// ---------- Chi tocca chi ----------

function controllaCollisioni() {
  raccogliStelle();
  controllaNemici();
  controllaCaduta();
  if (stato === "gioco") controllaBandiera();
}

function raccogliStelle() {
  for (const stella of stelle) {
    if (!stella.presa && siToccano(giocatore, stella)) raccogliStella(stella);
  }
}

function raccogliStella(stella) {
  stella.presa = true;
  stelleRaccolte++;
  suona("stella");
  aggiornaBarra();
}

function controllaNemici() {
  for (const nemico of nemici) {
    if (nemico.sconfitto) continue;                 // un mostro schiacciato non fa più niente
    if (!siToccano(giocatore, nemico)) continue;    // questo mostro non lo stiamo toccando

    // ---------- LA REGOLA DEL SALTO IN TESTA ----------
    // Il gioco si fa due domande:
    //   1. L'eroe sta cadendo verso il basso?
    //   2. Un attimo fa i suoi piedi erano più in alto della testa del mostro?
    //
    // SE la risposta è "sì" a tutte e due, vuol dire che gli è saltato in testa:
    //    il mostro è sconfitto!
    // ALTRIMENTI vuol dire che l'ha toccato di fianco o da sotto:
    //    l'eroe perde una vita (ma non mentre lampeggia).
    const staCadendo = giocatore.velocitaY > 0;
    const piediEranoSopra = giocatore.piediPrima <= nemico.y;

    if (staCadendo && piediEranoSopra) {
      sconfiggiNemico(nemico);
    } else if (giocatore.invulnerabile === 0) {
      perdiVita();
      return;
    }
  }
}

function sconfiggiNemico(nemico) {
  nemico.sconfitto = true;
  nemico.tempoSchiacciato = TEMPO_SCHIACCIATO;
  punti += puntiMostro;
  scritte.push(creaScritta("+" + puntiMostro, nemico.x + nemico.larghezza / 2, nemico.y));
  // Un piccolo rimbalzo: come un salto, ma più basso.
  giocatore.velocitaY = -forzaSalto * 0.6;
  suona("schiacciato");
  aggiornaBarra();
}

// ---------- Le scritte volanti ----------

function creaScritta(testo, x, y) {
  return { testo: testo, x: x, y: y, tempo: DURATA_SCRITTA };
}

// Ogni scritta sale piano piano e, quando il suo tempo finisce, la togliamo.
function muoviScritte() {
  for (const scritta of scritte) {
    scritta.y -= 1;
    scritta.tempo--;
  }
  scritte = scritte.filter((scritta) => scritta.tempo > 0);
}

// Se il giocatore è caduto in un buco, perde una vita e riparte dall'inizio.
function controllaCaduta() {
  if (giocatore.y < altezzaLivello) return;
  perdiVita();
  rimettiAllaPartenza();
}

function controllaBandiera() {
  if (bandiera && siToccano(giocatore, bandiera)) vinciLivello();
}


// =====================================================================
//  5. VITE, VITTORIA E CARTELLI
// =====================================================================

const schermata = document.getElementById("schermata");
const titolo = document.getElementById("titolo");
const messaggio = document.getElementById("messaggio");
const pulsanteGrande = document.getElementById("pulsanteGrande");
const pulsanteAudio = document.getElementById("pulsanteAudio");
const pulsantiMenu = document.getElementById("pulsantiMenu");

// Cosa deve succedere quando si preme il pulsante grande del cartello.
let azionePulsante = null;

function mostraSchermata(testoTitolo, testoMessaggio, testoPulsante, azione) {
  titolo.textContent = testoTitolo;
  messaggio.textContent = testoMessaggio;
  pulsanteGrande.textContent = testoPulsante;
  azionePulsante = azione;
  pulsantiMenu.classList.add("nascosto");   // i pulsanti del menu si vedono solo nel titolo
  schermata.classList.remove("nascosto");
}

function premiPulsanteGrande() {
  schermata.classList.add("nascosto");
  azionePulsante();
}

function aggiornaBarra() {
  const cuoriPieni = Math.max(0, vite);
  document.getElementById("contaCuori").textContent =
    "❤️".repeat(cuoriPieni) + "🖤".repeat(VITE_INIZIALI - cuoriPieni);
  document.getElementById("contaStelle").textContent = "⭐ " + stelleRaccolte;
  document.getElementById("contaPunti").textContent = "🏆 " + punti;
  document.getElementById("nomeLivello").textContent =
    livelloCreato ? livelloCreato.nome : "Livello " + (numeroLivello + 1);
}

function mostraTitolo() {
  stato = "titolo";
  mostraSchermata(
    "L'avventura di Michele",
    "Raccogli le stelle e arriva alla bandiera!",
    "GIOCA",
    apriSceltaEroe   // prima di giocare si sceglie l'eroe: "Chi gioca?"
  );
  pulsantiMenu.classList.remove("nascosto");
}

// Comincia una partita nuova dal primo livello, con l'eroe scelto.
function iniziaPartita(eroe) {
  eroeScelto = eroe;
  livelloCreato = null;
  numeroLivello = 0;
  stelleAInizioLivello = 0;
  puntiAInizioLivello = 0;
  mostriAnnunciati.clear();
  iniziaLivello();
}

// Fa giocare un livello costruito con l'editor.
//   righe     = il livello scritto con i simboli
//   nome      = il nome da mostrare in alto
//   alRitorno = cosa fare quando si esce (per esempio riaprire l'editor)
function giocaLivelloCreato(righe, nome, alRitorno) {
  livelloCreato = { righe: righe, nome: nome, alRitorno: alRitorno };
  stelleAInizioLivello = 0;
  puntiAInizioLivello = 0;
  mostriAnnunciati.clear();
  schermata.classList.add("nascosto");
  iniziaLivello();
}

function esciDalLivelloCreato() {
  const alRitorno = livelloCreato.alRitorno;
  livelloCreato = null;
  stato = "titolo";
  alRitorno();
}

// Il pulsante con la casetta: dal livello dell'editor si torna all'editor,
// da una partita normale si torna al menu iniziale.
function tornaAlMenu() {
  schermata.classList.add("nascosto");
  if (livelloCreato) {
    esciDalLivelloCreato();
  } else {
    tornaAlTitolo();
  }
}

// Scrive nella memoria i risultati dell'eroe (vedi personaggi.js).
// Il record cambia solo se ha fatto meglio di prima.
function salvaRecordEroe() {
  if (!eroeScelto || livelloCreato) return;   // i livelli dell'editor non contano per i record
  salvaRecord(eroeScelto.id, stelleRaccolte, numeroLivello + 1)
    .then(aggiornaElenco)
    .catch(() => {});   // se la memoria non funziona, si gioca lo stesso
}

// Fa partire (o ripartire) il livello di adesso, con tutte le vite.
function iniziaLivello() {
  vite = VITE_INIZIALI;
  stelleRaccolte = stelleAInizioLivello;
  punti = puntiAInizioLivello;
  caricaLivello(numeroLivello);
  aggiornaBarra();
  stato = "gioco";
}

function perdiVita() {
  vite--;
  suona("ahi");
  giocatore.invulnerabile = TEMPO_INVULNERABILE;
  aggiornaBarra();
  if (vite <= 0) mostraRiprova();
}

function rimettiAllaPartenza() {
  giocatore = creaGiocatore();
  giocatore.invulnerabile = TEMPO_INVULNERABILE;
}

function mostraRiprova() {
  stato = "riprova";
  salvaRecordEroe();
  mostraSchermata(
    "Riprova!",
    "Ci eri quasi! Ogni volta che riprovi diventi più bravo. 💪",
    "RIPROVA",
    iniziaLivello
  );
}

function vinciLivello() {
  stato = "vittoria";
  suona("vittoria");
  stelleAInizioLivello = stelleRaccolte;
  puntiAInizioLivello = punti;
  salvaRecordEroe();

  if (livelloCreato) {
    mostraSchermata(
      "Bravo Michele!",
      "Hai finito \"" + livelloCreato.nome + "\" con " + stelleRaccolte + " stelle! ⭐",
      "CONTINUA",
      esciDalLivelloCreato
    );
    return;
  }

  const eraUltimoLivello = numeroLivello === livelli.length - 1;
  if (eraUltimoLivello) {
    mostraSchermata(
      "Bravo Michele!",
      "Hai finito tutti i livelli con " + stelleRaccolte + " stelle e " + punti + " punti! 🏆",
      "GIOCA ANCORA",
      apriSceltaEroe
    );
  } else {
    mostraSchermata(
      "Bravo Michele!",
      "Livello " + (numeroLivello + 1) + " completato! Hai " + stelleRaccolte + " stelle. ⭐",
      "AVANTI",
      passaAlLivelloSuccessivo
    );
  }
}

function passaAlLivelloSuccessivo() {
  numeroLivello++;
  iniziaLivello();
}


// =====================================================================
//  6. DISEGNARE IL MONDO
// =====================================================================
//  Si disegna come farebbe un pittore: prima le cose lontane (il cielo),
//  poi quelle vicine (il personaggio), che così finiscono sopra.

// Il foglio deve avere tanti puntini quanti ne ha la finestra.
function adattaSchermo() {
  const densita = window.devicePixelRatio || 1;
  schermo.width = window.innerWidth * densita;
  schermo.height = window.innerHeight * densita;
}

function disegna() {
  // Ingrandiamo o rimpiccioliamo tutto in modo che il livello
  // occupi sempre l'intera altezza dello schermo.
  const ingrandimento = schermo.height / altezzaLivello;
  larghezzaVista = schermo.width / ingrandimento;
  penna.setTransform(ingrandimento, 0, 0, ingrandimento, 0, 0);

  muoviTelecamera(larghezzaVista);
  disegnaCielo(larghezzaVista);

  // Da qui in poi tutto è spostato a sinistra di quanto ha scorso la telecamera.
  penna.translate(-telecameraX, 0);
  disegnaBlocchi();
  disegnaBandiera();
  disegnaStelle();
  disegnaNemici();
  disegnaGiocatore();
  disegnaScritte();
}

// La telecamera segue il giocatore tenendolo al centro,
// ma si ferma ai bordi del livello.
function muoviTelecamera(larghezzaVista) {
  telecameraX = giocatore.x + giocatore.larghezza / 2 - larghezzaVista / 2;
  const massimo = larghezzaLivello - larghezzaVista;
  if (telecameraX > massimo) telecameraX = massimo;
  if (telecameraX < 0) telecameraX = 0;
}

// ---------- Cielo, sole e nuvole ----------

const nuvole = [
  { x: 80, y: 70, grandezza: 26 },
  { x: 380, y: 130, grandezza: 20 },
  { x: 640, y: 50, grandezza: 30 },
  { x: 930, y: 110, grandezza: 22 },
];

function disegnaCielo(larghezzaVista) {
  penna.fillStyle = coloreCielo;
  penna.fillRect(0, 0, larghezzaVista, altezzaLivello);
  disegnaSole(larghezzaVista * 0.8, 90);
  for (const nuvola of nuvole) {
    disegnaNuvola(nuvola, larghezzaVista);
  }
}

function disegnaSole(x, y) {
  penna.fillStyle = "#fff3a0";
  disegnaCerchio(x, y, 46);
  penna.fillStyle = "#ffd93b";
  disegnaCerchio(x, y, 34);
}

// Le nuvole si muovono più piano del terreno: così sembrano lontane.
// Quando escono da un lato dello schermo rientrano dall'altro.
function disegnaNuvola(nuvola, larghezzaVista) {
  const giro = larghezzaVista + 300;
  let x = (nuvola.x + orologio * 0.1 - telecameraX * 0.3) % giro;
  if (x < 0) x += giro;
  x -= 150;

  const g = nuvola.grandezza;
  penna.fillStyle = "white";
  disegnaCerchio(x, nuvola.y, g);
  disegnaCerchio(x + g, nuvola.y - g * 0.5, g * 1.2);
  disegnaCerchio(x + g * 2.2, nuvola.y, g);
  penna.fillRect(x, nuvola.y, g * 2.2, g);
}

function disegnaCerchio(x, y, raggio) {
  penna.beginPath();
  penna.arc(x, y, raggio, 0, Math.PI * 2);
  penna.fill();
}

// ---------- Terreno ----------

function disegnaBlocchi() {
  for (let riga = 0; riga < mappa.length; riga++) {
    for (let colonna = 0; colonna < mappa[riga].length; colonna++) {
      if (mappa[riga][colonna] === "#") disegnaBlocco(colonna, riga);
    }
  }
}

function disegnaBlocco(colonna, riga) {
  const x = colonna * CASELLA;
  const y = riga * CASELLA;

  // La terra (un puntino più larga, così tra un blocco e l'altro non si vedono fessure).
  penna.fillStyle = "#b5713b";
  penna.fillRect(x, y, CASELLA + 1, CASELLA + 1);

  // Se sopra non c'è un altro blocco, ci cresce il prato.
  if (!eUnBlocco(colonna, riga - 1)) {
    penna.fillStyle = "#5cc23a";
    penna.fillRect(x, y, CASELLA + 1, 14);
    penna.fillStyle = "#7fe05a";
    penna.fillRect(x, y, CASELLA + 1, 5);
  }
}

// ---------- Bandiera ----------

function disegnaBandiera() {
  if (!bandiera) return;
  const xPalo = bandiera.x + CASELLA / 2;
  const sventola = Math.sin(orologio / 10) * 4;

  // Il palo
  penna.fillStyle = "#eeeeee";
  penna.fillRect(xPalo - 3, bandiera.y, 6, bandiera.altezza);

  // Il triangolo rosso che sventola
  penna.fillStyle = "#e6452f";
  penna.beginPath();
  penna.moveTo(xPalo + 3, bandiera.y);
  penna.lineTo(xPalo + 40, bandiera.y + 16 + sventola);
  penna.lineTo(xPalo + 3, bandiera.y + 32);
  penna.fill();
}

// ---------- Stelle ----------

function disegnaStelle() {
  for (const stella of stelle) {
    if (!stella.presa) disegnaStella(stella);
  }
}

function disegnaStella(stella) {
  // Le stelle vanno un po' su e un po' giù, per farsi notare.
  const dondolio = Math.sin(orologio / 15 + stella.x) * 4;
  if (immagini.stella.pronta) {
    penna.drawImage(immagini.stella, stella.x, stella.y + dondolio, stella.larghezza, stella.altezza);
  } else {
    disegnaStellaFinta(stella.x + stella.larghezza / 2, stella.y + stella.altezza / 2 + dondolio, stella.larghezza / 2);
  }
}

// Una stella a 5 punte: giriamo in tondo e mettiamo un punto lontano
// dal centro (la punta) e uno vicino (la rientranza), per 5 volte.
function disegnaStellaFinta(centroX, centroY, raggio) {
  penna.beginPath();
  for (let punto = 0; punto < 10; punto++) {
    const distanza = punto % 2 === 0 ? raggio : raggio * 0.45;
    const angolo = -Math.PI / 2 + punto * Math.PI / 5;
    penna.lineTo(centroX + Math.cos(angolo) * distanza, centroY + Math.sin(angolo) * distanza);
  }
  penna.closePath();
  penna.fillStyle = "#ffd93b";
  penna.fill();
  penna.strokeStyle = "#f29f05";
  penna.lineWidth = 2;
  penna.stroke();
}

// ---------- Personaggi ----------

// Disegna un personaggio usando la sua immagine, oppure il disegno finto
// se l'immagine non c'è. Se guarda a sinistra, lo disegna "allo specchio".
function disegnaPersonaggio(cosa, immagine, guardaADestra, disegnoFinto) {
  penna.save();
  penna.translate(cosa.x, cosa.y);
  if (!guardaADestra) {
    penna.translate(cosa.larghezza, 0);
    penna.scale(-1, 1);
  }
  if (immagine.pronta) {
    penna.drawImage(immagine, 0, 0, cosa.larghezza, cosa.altezza);
  } else {
    disegnoFinto(cosa.larghezza, cosa.altezza);
  }
  penna.restore();
}

function disegnaGiocatore() {
  // Dopo un colpo il giocatore lampeggia: un momento si vede e un momento no.
  const lampeggia = Math.floor(giocatore.invulnerabile / 6) % 2 === 1;
  if (lampeggia) return;
  // Usiamo il disegno dell'eroe scelto; se non ne ha uno suo, quello predefinito.
  const figura = figuraDi(eroeScelto) || immagini.player;
  disegnaPersonaggio(giocatore, figura, giocatore.guardaADestra, disegnaGiocatoreFinto);
}

function disegnaGiocatoreFinto(larghezza, altezza) {
  // Corpo
  penna.fillStyle = "#ff7a1a";
  penna.fillRect(0, 0, larghezza, altezza);
  // Cappellino
  penna.fillStyle = "#2f6fe6";
  penna.fillRect(0, 0, larghezza, altezza * 0.22);
  penna.fillRect(larghezza * 0.6, altezza * 0.12, larghezza * 0.55, altezza * 0.1);
  // Occhio
  penna.fillStyle = "white";
  disegnaCerchio(larghezza * 0.68, altezza * 0.45, larghezza * 0.16);
  penna.fillStyle = "#222222";
  disegnaCerchio(larghezza * 0.74, altezza * 0.45, larghezza * 0.07);
  // Sorriso
  penna.fillRect(larghezza * 0.5, altezza * 0.74, larghezza * 0.35, altezza * 0.07);
}

function disegnaNemici() {
  for (const nemico of nemici) {
    const forma = nemico.sconfitto ? formaSchiacciata(nemico) : nemico;
    const figura = figuraDi(nemico.personaggio) || immagini.nemico;
    disegnaPersonaggio(forma, figura, nemico.direzione > 0, disegnaNemicoFinto);
  }
}

// Un mostro schiacciato è largo uguale ma molto più basso, appoggiato per terra.
function formaSchiacciata(nemico) {
  const altezzaSchiacciata = nemico.altezza * 0.3;
  return {
    x: nemico.x,
    y: nemico.y + nemico.altezza - altezzaSchiacciata,
    larghezza: nemico.larghezza,
    altezza: altezzaSchiacciata,
  };
}

// ---------- Scritte volanti ----------

function disegnaScritte() {
  penna.font = "bold 22px 'Comic Sans MS', sans-serif";
  penna.textAlign = "center";
  for (const scritta of scritte) {
    // Più il tempo sta per finire, più la scritta diventa trasparente.
    penna.globalAlpha = scritta.tempo / DURATA_SCRITTA;
    penna.fillStyle = "white";
    penna.strokeStyle = "#444444";
    penna.lineWidth = 4;
    penna.strokeText(scritta.testo, scritta.x, scritta.y);
    penna.fillText(scritta.testo, scritta.x, scritta.y);
  }
  penna.globalAlpha = 1;
}

function disegnaNemicoFinto(larghezza, altezza) {
  // Corpo a forma di cupola
  penna.fillStyle = "#8e44ad";
  disegnaCerchio(larghezza / 2, altezza / 2, larghezza / 2);
  penna.fillRect(0, altezza / 2, larghezza, altezza / 2);
  // Occhi
  penna.fillStyle = "white";
  disegnaCerchio(larghezza * 0.38, altezza * 0.45, larghezza * 0.14);
  disegnaCerchio(larghezza * 0.76, altezza * 0.45, larghezza * 0.14);
  penna.fillStyle = "#222222";
  disegnaCerchio(larghezza * 0.43, altezza * 0.47, larghezza * 0.06);
  disegnaCerchio(larghezza * 0.81, altezza * 0.47, larghezza * 0.06);
  // Sopracciglia arrabbiate
  penna.fillRect(larghezza * 0.22, altezza * 0.22, larghezza * 0.7, altezza * 0.08);
}


// =====================================================================
//  7. TASTIERA E PULSANTI
// =====================================================================

// Quale tasto della tastiera fa cosa.
const tastiDellaTastiera = {
  ArrowLeft: "sinistra",
  ArrowRight: "destra",
  ArrowUp: "salta",
  Space: "salta",
};

window.addEventListener("keydown", (evento) => {
  preparaAudio();
  if (staScrivendo(evento)) return;   // i tasti servono per scrivere un nome
  const comando = tastiDellaTastiera[evento.code];
  if (comando) {
    tasti[comando] = true;
    evento.preventDefault();
  }
  // Quando c'è un cartello, il tasto Invio preme il pulsante grande.
  const cartelloVisibile = !schermata.classList.contains("nascosto");
  if (evento.code === "Enter" && stato !== "gioco" && cartelloVisibile) {
    premiPulsanteGrande();
    evento.preventDefault();
  }
});

window.addEventListener("keyup", (evento) => {
  const comando = tastiDellaTastiera[evento.code];
  if (comando) tasti[comando] = false;
});

// Collega un pulsante a schermo a un comando: finché il dito
// lo tiene premuto, il comando resta acceso.
function collegaPulsante(idPulsante, comando) {
  const pulsante = document.getElementById(idPulsante);
  pulsante.addEventListener("pointerdown", (evento) => {
    tasti[comando] = true;
    evento.preventDefault();
  });
  for (const fine of ["pointerup", "pointerleave", "pointercancel"]) {
    pulsante.addEventListener(fine, () => { tasti[comando] = false; });
  }
}

collegaPulsante("tastoSinistra", "sinistra");
collegaPulsante("tastoDestra", "destra");
collegaPulsante("tastoSalta", "salta");

pulsanteGrande.addEventListener("click", premiPulsanteGrande);
pulsanteAudio.addEventListener("click", () => {
  cambiaAudio();
  pulsanteAudio.blur();
});

document.getElementById("pulsanteCasa").addEventListener("click", (evento) => {
  tornaAlMenu();
  evento.target.blur();
});

window.addEventListener("pointerdown", preparaAudio);
window.addEventListener("resize", adattaSchermo);
// Tenendo premuto col dito non deve aprirsi il menu del browser.
window.addEventListener("contextmenu", (evento) => evento.preventDefault());


// =====================================================================
//  8. SI PARTE!
// =====================================================================

let ultimoTempo = performance.now();
let tempoDaRecuperare = 0;

// Questa funzione viene chiamata dal browser ogni volta che lo schermo
// è pronto per un nuovo disegno. Alcuni schermi sono più veloci di altri:
// per questo contiamo il tempo passato e aggiorniamo il mondo sempre
// 60 volte al secondo, su qualsiasi schermo.
function cicloDiGioco(adesso) {
  tempoDaRecuperare += adesso - ultimoTempo;
  ultimoTempo = adesso;
  // Se la pagina era rimasta in pausa, non cerchiamo di recuperare tutto.
  if (tempoDaRecuperare > 200) tempoDaRecuperare = 200;

  while (tempoDaRecuperare >= PASSO_DI_TEMPO) {
    aggiorna();
    tempoDaRecuperare -= PASSO_DI_TEMPO;
  }
  disegna();
  requestAnimationFrame(cicloDiGioco);
}

adattaSchermo();
caricaLivello(0);
aggiornaBarra();
mostraTitolo();
requestAnimationFrame(cicloDiGioco);

// Accendiamo l'aiutante che fa funzionare il gioco anche senza Internet (vedi sw.js).
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
