// =====================================================================
//  SCAMBIO.JS - ESPORTARE, CONDIVIDERE E IMPORTARE
// =====================================================================
//  Personaggi, suoni e livelli vivono nell'armadio di UN dispositivo.
//  Per darli a un amico li mettiamo in un "pacchetto": un unico file
//  di testo (finisce con .json) che si può mandare con un messaggio.
//  L'amico lo apre con "Importa" e si ritrova tutto nel suo armadio.
//
//  In un file di testo immagini e suoni non ci stanno, quindi li
//  trasformiamo in una lunghissima fila di lettere (si chiama "base64")
//  e all'arrivo li ritrasformiamo in immagini e suoni.
//
//  Importare AGGIUNGE sempre e non cancella mai: se un nome è già usato,
//  quello nuovo prende un numero ("Drago", "Drago 2"...).
// =====================================================================

const SIMBOLI_LIVELLO = "#*EFP-";   // gli unici simboli permessi in un livello


// =====================================================================
//  FARE IL PACCHETTO
// =====================================================================

// Mette nel pacchetto i personaggi, i suoni e i livelli che gli diamo
// e risponde con il testo del file.
async function creaPacchetto(elencoPersonaggi, elencoSuoni, elencoLivelli) {
  const pacchetto = { gioco: "L'avventura di Michele", personaggi: [], suoni: [], livelli: [] };

  for (const personaggio of elencoPersonaggi) {
    if (personaggio.id === ID_PREDEFINITO) continue;   // quello c'è già dappertutto
    pacchetto.personaggi.push({
      nome: personaggio.nome,
      autore: personaggio.autore,
      tipo: personaggio.tipo,
      creatoIl: personaggio.creatoIl,
      recordStelle: personaggio.recordStelle,
      livelloMassimo: personaggio.livelloMassimo,
      immagine: await fileInTesto(personaggio.immagine),
    });
  }
  for (const suono of elencoSuoni) {
    pacchetto.suoni.push({
      nome: suono.nome,
      effetto: suono.effetto,
      creatoIl: suono.creatoIl,
      audio: await fileInTesto(suono.audio),
    });
  }
  for (const livello of elencoLivelli) {
    pacchetto.livelli.push({
      nome: livello.nome,
      autore: livello.autore,
      creatoIl: livello.creatoIl,
      righe: livello.righe,
    });
  }
  return JSON.stringify(pacchetto);
}

// Immagine o suono -> fila di lettere
function fileInTesto(file) {
  return new Promise((fatto, errore) => {
    const lettore = new FileReader();
    lettore.onload = () => fatto(lettore.result);
    lettore.onerror = () => errore(lettore.error);
    lettore.readAsDataURL(file);
  });
}

// Fila di lettere -> immagine o suono
async function testoInFile(testo) {
  const risposta = await fetch(testo);
  return risposta.blob();
}


// =====================================================================
//  CONDIVIDERE
// =====================================================================

// Prepara il pacchetto e lo condivide. Se non c'è niente da mettere dentro, avvisa.
async function condividiCose(elencoPersonaggi, elencoSuoni, elencoLivelli, nomeFile) {
  const daMandare = elencoPersonaggi.filter((personaggio) => personaggio.id !== ID_PREDEFINITO);
  if (daMandare.length + elencoSuoni.length + elencoLivelli.length === 0) {
    avvisa("Qui non c'è ancora niente da condividere. Prima crea qualcosa! 🎨");
    return;
  }
  const testo = await creaPacchetto(daMandare, elencoSuoni, elencoLivelli);
  await condividiFile(new File([testo], nomeFile, { type: "application/json" }));
}

// SE il dispositivo sa "condividere" (come tablet e telefoni) apre il suo menu
// per mandare il file con un messaggio; ALTRIMENTI il file viene scaricato.
async function condividiFile(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "L'avventura di Michele" });
      return;
    } catch (errore) {
      if (errore.name === "AbortError") return;   // ci ha ripensato: non facciamo niente
    }
  }
  scaricaFile(file);
}

function scaricaFile(file) {
  const collegamento = document.createElement("a");
  collegamento.href = URL.createObjectURL(file);
  collegamento.download = file.name;
  collegamento.click();
}


// =====================================================================
//  APRIRE UN PACCHETTO (IMPORTARE)
// =====================================================================

// Legge il testo di un pacchetto e aggiunge tutto all'armadio.
// Risponde con quante cose ha aggiunto: { personaggi, suoni, livelli }.
async function apriPacchetto(testo) {
  const pacchetto = JSON.parse(testo);
  const elenchi = [pacchetto.personaggi, pacchetto.suoni, pacchetto.livelli];
  if (!elenchi.some(Array.isArray)) throw new Error("Questo non è un pacchetto del gioco");

  return {
    personaggi: await aggiungiPersonaggi(pacchetto.personaggi || []),
    suoni: await aggiungiSuoni(pacchetto.suoni || []),
    livelli: await aggiungiLivelli(pacchetto.livelli || []),
  };
}

// Un file potrebbe arrivare da chissà dove: prima di mettere una scheda
// nell'armadio controlliamo sempre che sia fatta bene.

async function aggiungiPersonaggi(arrivati) {
  const nomiUsati = (await caricaPersonaggi()).map((personaggio) => personaggio.nome);
  let quanti = 0;
  for (const nuovo of arrivati) {
    const valido = haUnNome(nuovo) &&
                   (nuovo.tipo === "eroe" || nuovo.tipo === "mostro") &&
                   cominciaCon(nuovo.immagine, "data:image/png;base64,");
    if (!valido) continue;
    await salvaPersonaggio({
      nome: nomeNuovo(nuovo.nome, nomiUsati),
      autore: String(nuovo.autore || "").slice(0, 16),
      tipo: nuovo.tipo,
      immagine: await testoInFile(nuovo.immagine),
      creatoIl: String(nuovo.creatoIl || ""),
      recordStelle: Number(nuovo.recordStelle) || 0,
      livelloMassimo: Number(nuovo.livelloMassimo) || 0,
    });
    quanti++;
  }
  return quanti;
}

async function aggiungiSuoni(arrivati) {
  const nomiUsati = (await caricaSuoni()).map((suono) => suono.nome);
  let quanti = 0;
  for (const nuovo of arrivati) {
    const valido = haUnNome(nuovo) &&
                   EFFETTI.some((effetto) => effetto.id === nuovo.effetto) &&
                   cominciaCon(nuovo.audio, "data:audio/");
    if (!valido) continue;
    await salvaSuono({
      nome: nomeNuovo(nuovo.nome, nomiUsati),
      effetto: nuovo.effetto,
      audio: await testoInFile(nuovo.audio),
      creatoIl: String(nuovo.creatoIl || ""),
    });
    quanti++;
  }
  return quanti;
}

async function aggiungiLivelli(arrivati) {
  const nomiUsati = (await caricaLivelli()).map((livello) => livello.nome);
  let quanti = 0;
  for (const nuovo of arrivati) {
    const valido = haUnNome(nuovo) && sonoRigheDiLivello(nuovo.righe);
    if (!valido) continue;
    await salvaLivello({
      nome: nomeNuovo(nuovo.nome, nomiUsati),
      autore: String(nuovo.autore || "").slice(0, 16),
      righe: nuovo.righe.map(pulisciRiga),
      creatoIl: String(nuovo.creatoIl || ""),
    });
    quanti++;
  }
  return quanti;
}

function haUnNome(scheda) {
  return scheda && typeof scheda.nome === "string" && scheda.nome.trim() !== "";
}

function cominciaCon(testo, inizio) {
  return typeof testo === "string" && testo.startsWith(inizio);
}

// Le righe di un livello devono essere poche righe di testo, non troppo lunghe.
function sonoRigheDiLivello(righe) {
  return Array.isArray(righe) && righe.length >= 3 && righe.length <= 20 &&
         righe.every((riga) => typeof riga === "string" && riga.length >= 1 && riga.length <= 120);
}

// Ogni simbolo che non conosciamo diventa aria.
function pulisciRiga(riga) {
  return riga.split("").map((simbolo) => SIMBOLI_LIVELLO.includes(simbolo) ? simbolo : "-").join("");
}

// Accorcia il nome e, se è già usato, gli aggiunge un numero.
// Poi lo segna tra i nomi usati, così vale anche per le schede dopo.
function nomeNuovo(nome, nomiUsati) {
  const libero = nomeLibero(nome.trim().slice(0, 24), nomiUsati);
  nomiUsati.push(libero);
  return libero;
}

// ---------- Leggere il file scelto ----------

// Apre il pacchetto scelto, rilegge tutto dall'armadio e racconta cosa è arrivato.
async function importaDaFile(file, alTermine) {
  if (!file) return;
  let arrivati;
  try {
    arrivati = await apriPacchetto(await file.text());
  } catch (errore) {
    avvisa("Questo non sembra un file del gioco. Provane un altro!");
    return;
  }
  await aggiornaElenco();
  await aggiornaSuoni();
  await aggiornaLivelli();
  alTermine();
  avvisa(fraseDiArrivoPacchetto(arrivati));
}

function fraseDiArrivoPacchetto(arrivati) {
  const totale = arrivati.personaggi + arrivati.suoni + arrivati.livelli;
  if (totale === 0) return "In questo file non c'era niente da aggiungere.";
  return "Sono arrivati " + arrivati.personaggi + " personaggi, " +
         arrivati.suoni + " suoni e " + arrivati.livelli + " livelli! 🎉";
}


// =====================================================================
//  COLLEGHIAMO I PULSANTI
// =====================================================================

// Collega un campo "scegli file" all'importazione. Alla fine riapre la pagina giusta.
function collegaImporta(idCampo, alTermine) {
  const campo = document.getElementById(idCampo);
  campo.addEventListener("change", () => {
    importaDaFile(campo.files[0], alTermine);
    campo.value = "";
  });
}

collegaImporta("importaInGalleria", () => apriGalleria());
collegaImporta("importaInSuoni", () => apriSuoni());
collegaImporta("importaInLivelli", () => apriLivelli());

document.getElementById("condividiPersonaggi").addEventListener("click", () =>
  condividiCose(personaggi, [], [], "personaggi-avventura.json"));
document.getElementById("condividiSuoni").addEventListener("click", () =>
  condividiCose([], suoniSalvati, [], "suoni-avventura.json"));
document.getElementById("condividiLivelli").addEventListener("click", () =>
  condividiCose([], [], livelliSalvati, "livelli-avventura.json"));
document.getElementById("esportaTutto").addEventListener("click", () =>
  condividiCose(personaggi, suoniSalvati, livelliSalvati, "avventura-di-michele-tutto.json"));

// Dalla finestra di una figurina si condivide solo quel personaggio.
document.getElementById("azioneCondividi").addEventListener("click", () =>
  condividiCose([figurinaAperta], [], [], "personaggio-avventura.json"));
