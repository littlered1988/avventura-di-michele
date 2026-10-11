// =====================================================================
//  SW.JS - IL "SERVICE WORKER"
// =====================================================================
//  È un aiutante invisibile che tiene da parte una copia del gioco,
//  così funziona anche quando non c'è Internet.
//
//  La sua regola è semplice:
//    1. prova a prendere il file da Internet (così è sempre l'ultima versione)
//    2. se Internet non c'è, usa la copia messa da parte
// =====================================================================

const NOME_MEMORIA = "avventura-di-michele";

// I file indispensabili: li mettiamo da parte appena il gioco viene installato.
const FILE_DEL_GIOCO = [
  "./",
  "index.html",
  "style.css",
  "settings.js",
  "levels.js",
  "game.js",
  "manifest.json",
  "assets/icona-192.png",
  "assets/icona-512.png",
];

self.addEventListener("install", (evento) => {
  self.skipWaiting();
  evento.waitUntil(
    caches.open(NOME_MEMORIA).then((memoria) => memoria.addAll(FILE_DEL_GIOCO))
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(prendiFile(evento.request));
});

async function prendiFile(richiesta) {
  const memoria = await caches.open(NOME_MEMORIA);
  try {
    const risposta = await fetch(richiesta);
    // Mettiamo da parte solo le risposte complete e riuscite (codice 200).
    if (risposta.status === 200) {
      memoria.put(richiesta, risposta.clone());
    }
    return risposta;
  } catch (errore) {
    // Niente Internet: usiamo la copia messa da parte, se c'è.
    const copia = await memoria.match(richiesta);
    return copia || Response.error();
  }
}
