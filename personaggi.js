// =====================================================================
//  PERSONAGGI.JS - LA MEMORIA DEI PERSONAGGI
// =====================================================================
//  Il browser ha dentro di sé un armadio che si chiama IndexedDB.
//  Quello che ci mettiamo resta lì anche se chiudiamo il gioco
//  o spegniamo il tablet.
//
//  Nel nostro armadio ci sono tre scaffali:
//    "personaggi"  gli eroi e i mostri (questo file)
//    "suoni"       le voci registrate   (vedi suoni.js)
//    "livelli"     i livelli creati     (vedi editor.js)
//
//  Ogni personaggio è una scheda con scritto:
//
//    id              il suo numero (lo sceglie l'armadio: 1, 2, 3...)
//    nome            come si chiama, per esempio "Drago Fulmine"
//    autore          chi l'ha disegnato
//    tipo            "eroe" oppure "mostro"
//    immagine        il disegno, già ritagliato e senza sfondo
//    creatoIl        il giorno in cui è nato
//    recordStelle    il maggior numero di stelle raccolte (solo per gli eroi)
//    livelloMassimo  il livello più alto raggiunto (solo per gli eroi)
//
//  L'armadio è un po' lento a rispondere: per questo quasi tutte le
//  funzioni qui sotto vanno chiamate con "await", che vuol dire
//  "aspetta che l'armadio abbia finito".
// =====================================================================

const NOME_ARMADIO = "avventura-di-michele";
const SCAFFALE = "personaggi";
const SCAFFALE_SUONI = "suoni";
const SCAFFALE_LIVELLI = "livelli";
const ID_PREDEFINITO = 0;   // il numero dell'eroe che c'è sempre

// L'eroe che c'è fin dall'inizio: usa il disegno assets/player.png.
function eroePredefinito() {
  return {
    id: ID_PREDEFINITO,
    nome: "Michele",
    autore: "",
    tipo: "eroe",
    immagine: null,
    creatoIl: "",
    recordStelle: 0,
    livelloMassimo: 0,
  };
}

// Apre l'armadio. Se manca uno scaffale lo costruisce; sullo scaffale
// dei personaggi mette subito la scheda dell'eroe predefinito.
// Il numero 3 è la "versione" dell'armadio: la 1 aveva solo i personaggi,
// la 2 ha aggiunto i suoni, la 3 i livelli.
function apriArmadio() {
  return new Promise((fatto, errore) => {
    const richiesta = indexedDB.open(NOME_ARMADIO, 3);
    richiesta.onupgradeneeded = () => {
      const armadio = richiesta.result;
      if (!armadio.objectStoreNames.contains(SCAFFALE)) {
        const scaffale = armadio.createObjectStore(SCAFFALE, { keyPath: "id", autoIncrement: true });
        scaffale.put(eroePredefinito());
      }
      for (const nome of [SCAFFALE_SUONI, SCAFFALE_LIVELLI]) {
        if (!armadio.objectStoreNames.contains(nome)) {
          armadio.createObjectStore(nome, { keyPath: "id", autoIncrement: true });
        }
      }
    };
    richiesta.onsuccess = () => fatto(richiesta.result);
    richiesta.onerror = () => errore(richiesta.error);
  });
}

// Fa una cosa su uno scaffale e aspetta la risposta.
//   modo = "readonly" per guardare soltanto, "readwrite" per cambiare qualcosa
function usaScaffale(nomeScaffale, modo, cosaFare) {
  return apriArmadio().then((armadio) => new Promise((fatto, errore) => {
    const lavoro = armadio.transaction(nomeScaffale, modo);
    const richiesta = cosaFare(lavoro.objectStore(nomeScaffale));
    lavoro.oncomplete = () => { armadio.close(); fatto(richiesta.result); };
    lavoro.onerror = () => { armadio.close(); errore(lavoro.error); };
  }));
}

// ---------- Le quattro funzioni principali ----------

// Mette una scheda sullo scaffale. Se la scheda non ha ancora un numero (id),
// l'armadio gliene dà uno nuovo. Risponde con il numero della scheda.
function salvaPersonaggio(personaggio) {
  return usaScaffale(SCAFFALE, "readwrite", (scaffale) => scaffale.put(personaggio));
}

// Risponde con l'elenco di tutte le schede.
function caricaPersonaggi() {
  return usaScaffale(SCAFFALE, "readonly", (scaffale) => scaffale.getAll());
}

// Butta via la scheda con questo numero.
function eliminaPersonaggio(id) {
  return usaScaffale(SCAFFALE, "readwrite", (scaffale) => scaffale.delete(id));
}

// Prende la scheda, cambia il nome e la rimette a posto.
async function rinominaPersonaggio(id, nuovoNome) {
  const personaggio = await usaScaffale(SCAFFALE, "readonly", (scaffale) => scaffale.get(id));
  personaggio.nome = nuovoNome;
  return salvaPersonaggio(personaggio);
}

// ---------- I record ----------

// Aggiorna il record di un eroe, ma solo se ha fatto meglio di prima.
async function salvaRecord(id, stelle, livello) {
  const eroe = await usaScaffale(SCAFFALE, "readonly", (scaffale) => scaffale.get(id));
  if (!eroe) return;
  eroe.recordStelle = Math.max(eroe.recordStelle, stelle);
  eroe.livelloMassimo = Math.max(eroe.livelloMassimo, livello);
  return salvaPersonaggio(eroe);
}

// ---------- I nomi ----------

// Se il nome è già usato aggiunge un numero: "Drago", "Drago 2", "Drago 3"...
// (Serve quando arrivano personaggi, suoni o livelli da un amico: vedi scambio.js)
function nomeLibero(nome, nomiUsati) {
  if (!nomiUsati.includes(nome)) return nome;
  let numero = 2;
  while (nomiUsati.includes(nome + " " + numero)) numero++;
  return nome + " " + numero;
}
