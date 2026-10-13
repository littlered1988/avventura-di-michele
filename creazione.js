// =====================================================================
//  CREAZIONE.JS - CREA IL TUO PERSONAGGIO
// =====================================================================
//  Qui una foto di un disegno su un foglio bianco diventa un personaggio:
//    1. leggiamo la foto e la rimpiccioliamo un po'
//    2. togliamo il foglio: i puntini chiari diventano trasparenti
//    3. ritagliamo tutto intorno al disegno
//    4. lo mettiamo in un quadrato della misura giusta per il gioco
// =====================================================================

const LATO_FOTO = 600;     // la foto viene rimpicciolita fino a questa misura, per lavorare in fretta
const LATO_FIGURA = 256;   // la misura (in puntini) del personaggio finito

const anteprima = document.getElementById("anteprima");
const pennaAnteprima = anteprima.getContext("2d");
const sliderPulizia = document.getElementById("sliderPulizia");
const campoNome = document.getElementById("campoNome");
const campoAutore = document.getElementById("campoAutore");

let tipoScelto = "eroe";
let fotoOriginale = null;      // i puntini della foto, così com'è
let chiaroDelFoglio = 255;     // quanto è chiaro il foglio in questa foto
let disegnoTrovato = false;    // nell'anteprima c'è qualcosa da salvare?

function apriCreazione() {
  scegliTipo("eroe");
  fotoOriginale = null;
  disegnoTrovato = false;
  campoNome.value = "";
  pennaAnteprima.clearRect(0, 0, LATO_FIGURA, LATO_FIGURA);
  mostraPagina("paginaCrea");
}

function scegliTipo(tipo) {
  tipoScelto = tipo;
  document.getElementById("tipoEroe").classList.toggle("scelto", tipo === "eroe");
  document.getElementById("tipoMostro").classList.toggle("scelto", tipo === "mostro");
}

// ---------- 1. Leggere la foto ----------

async function leggiFoto(file) {
  if (!file) return;
  let immagine;
  try {
    immagine = await fileInImmagine(file);
  } catch (errore) {
    avvisa("Non riesco ad aprire questa immagine. Provane un'altra!");
    return;
  }

  // La rimpiccioliamo: una foto del telefono ha milioni di puntini, a noi ne bastano molti meno.
  const scala = Math.min(1, LATO_FOTO / Math.max(immagine.width, immagine.height));
  const foglio = document.createElement("canvas");
  foglio.width = Math.round(immagine.width * scala);
  foglio.height = Math.round(immagine.height * scala);
  const pennaFoglio = foglio.getContext("2d");
  pennaFoglio.drawImage(immagine, 0, 0, foglio.width, foglio.height);

  fotoOriginale = pennaFoglio.getImageData(0, 0, foglio.width, foglio.height);
  chiaroDelFoglio = misuraFoglio(fotoOriginale);
  mostraAnteprima();
}

function fileInImmagine(file) {
  return new Promise((fatto, errore) => {
    const immagine = new Image();
    immagine.onload = () => fatto(immagine);
    immagine.onerror = errore;
    immagine.src = URL.createObjectURL(file);
  });
}

// ---------- 2. Togliere il foglio ----------
//  Ogni puntino di una foto è fatto di 4 numeri da 0 a 255:
//  quanto rosso, quanto verde, quanto blu e quanto è visibile.
//  Il bianco ha rosso, verde e blu tutti alti. Un colore vivace
//  (come il rosso) ne ha almeno uno basso. Quindi guardiamo il più
//  basso dei tre: se è alto anche quello, il puntino è "quasi bianco".

function quantoEChiaro(puntini, posizione) {
  return Math.min(puntini[posizione], puntini[posizione + 1], puntini[posizione + 2]);
}

// Una foto non è mai bianca perfetta: a volte il foglio viene grigino.
// Per capire quanto è chiaro il foglio guardiamo la prima e l'ultima riga
// della foto, dove di solito c'è solo foglio, e facciamo la media.
function misuraFoglio(foto) {
  const puntini = foto.data;
  const ultimaRiga = (foto.height - 1) * foto.width * 4;
  let somma = 0;
  for (let x = 0; x < foto.width; x++) {
    somma += quantoEChiaro(puntini, x * 4);
    somma += quantoEChiaro(puntini, ultimaRiga + x * 4);
  }
  return somma / (foto.width * 2);
}

// Lo slider "Pulisci sfondo" decide la soglia: più è a destra, più siamo severi
// e cancelliamo anche i puntini solo un po' più scuri del foglio (le ombre).
function sogliaScelta() {
  const pulizia = Number(sliderPulizia.value);
  return chiaroDelFoglio - (130 - pulizia * 1.2);
}

// Fa una copia della foto in cui i puntini più chiari della soglia sono trasparenti.
function togliSfondo(foto, soglia) {
  const pulita = new ImageData(new Uint8ClampedArray(foto.data), foto.width, foto.height);
  const puntini = pulita.data;
  for (let posizione = 0; posizione < puntini.length; posizione += 4) {
    if (quantoEChiaro(puntini, posizione) > soglia) {
      puntini[posizione + 3] = 0;   // il quarto numero è la visibilità: 0 = invisibile
    }
  }
  return pulita;
}

// ---------- 3. Ritagliare ----------

// Cerca il puntino visibile più a sinistra, più a destra, più in alto e più in basso:
// il disegno sta tutto lì dentro. Se non c'è nessun puntino visibile risponde null.
function trovaBordi(foto) {
  let sinistra = foto.width, destra = -1, alto = foto.height, basso = -1;
  for (let y = 0; y < foto.height; y++) {
    for (let x = 0; x < foto.width; x++) {
      const visibile = foto.data[(y * foto.width + x) * 4 + 3] > 0;
      if (!visibile) continue;
      if (x < sinistra) sinistra = x;
      if (x > destra) destra = x;
      if (y < alto) alto = y;
      if (y > basso) basso = y;
    }
  }
  if (destra < 0) return null;
  return { x: sinistra, y: alto, larghezza: destra - sinistra + 1, altezza: basso - alto + 1 };
}

// ---------- 4. Mettere nel quadrato ----------

// Disegna il ritaglio nell'anteprima: il più grande possibile, al centro,
// con i piedi appoggiati in basso (così nel gioco tocca terra).
function disegnaRitaglio(foto, bordi) {
  const foglio = document.createElement("canvas");
  foglio.width = foto.width;
  foglio.height = foto.height;
  foglio.getContext("2d").putImageData(foto, 0, 0);

  const scala = LATO_FIGURA / Math.max(bordi.larghezza, bordi.altezza);
  const larghezza = bordi.larghezza * scala;
  const altezza = bordi.altezza * scala;
  pennaAnteprima.drawImage(
    foglio,
    bordi.x, bordi.y, bordi.larghezza, bordi.altezza,
    (LATO_FIGURA - larghezza) / 2, LATO_FIGURA - altezza, larghezza, altezza
  );
}

// Rifà tutto il lavoro e lo mostra. Viene chiamata a ogni nuova foto
// e ogni volta che si muove lo slider.
function mostraAnteprima() {
  if (!fotoOriginale) return;
  const pulita = togliSfondo(fotoOriginale, sogliaScelta());
  const bordi = trovaBordi(pulita);

  pennaAnteprima.clearRect(0, 0, LATO_FIGURA, LATO_FIGURA);
  disegnoTrovato = bordi !== null;
  if (disegnoTrovato) disegnaRitaglio(pulita, bordi);
}

// ---------- Salvare ----------

function anteprimaInImmagine() {
  return new Promise((fatto) => anteprima.toBlob(fatto, "image/png"));
}

async function salvaNuovoPersonaggio() {
  const nome = campoNome.value.trim();
  if (!disegnoTrovato) {
    avvisa("Prima fai una foto al tuo disegno! 📷");
    return;
  }
  if (nome === "") {
    avvisa("Manca il nome! Come si chiama il tuo personaggio?");
    return;
  }

  try {
    await salvaPersonaggio({
      nome: nome,
      autore: campoAutore.value.trim(),
      tipo: tipoScelto,
      immagine: await anteprimaInImmagine(),
      creatoIl: new Date().toISOString(),
      recordStelle: 0,
      livelloMassimo: 0,
    });
  } catch (errore) {
    avvisa("Ops, su questo dispositivo non riesco a salvare i personaggi.");
    return;
  }

  faiFesta();
  suona("vittoria");
  await aggiornaElenco();
  apriGalleria();
}

// ---------- Colleghiamo i pulsanti ----------

document.getElementById("tipoEroe").addEventListener("click", () => scegliTipo("eroe"));
document.getElementById("tipoMostro").addEventListener("click", () => scegliTipo("mostro"));
document.getElementById("pulsanteSalva").addEventListener("click", salvaNuovoPersonaggio);
sliderPulizia.addEventListener("input", mostraAnteprima);

for (const idCampo of ["fotoCamera", "fotoGalleria"]) {
  const campo = document.getElementById(idCampo);
  campo.addEventListener("change", () => {
    leggiFoto(campo.files[0]);
    campo.value = "";   // così si può scegliere di nuovo la stessa foto
  });
}
