# L'avventura di Michele

Un piccolo gioco a piattaforme fatto da Michele e dal suo babbo.
Corri, salta, raccogli le stelle e arriva alla bandiera!

Solo HTML, CSS e JavaScript: niente da installare, niente da compilare.

## Come si gioca

| | Tastiera | Tablet / telefono |
|---|---|---|
| Muoversi | frecce ← → | pulsanti ◀ ▶ |
| Saltare | spazio (o freccia ↑) | pulsante ▲ |
| Premere il pulsante dei cartelli | Invio | toccarlo |
| Pannello segreto | tasto `P` | tenere premuto 3 secondi sul titolo |

Toccare un mostro di fianco fa perdere un cuore. Saltargli **in testa** invece lo schiaccia
e fa guadagnare punti (🏆).

## Avviarlo sul computer

Il gioco ha bisogno di un piccolo server locale (aprendo `index.html` con un doppio clic
si vede lo stesso, ma la parte "app installabile" non funziona).

Apri un terminale **dentro questa cartella** e scrivi:

```bash
python -m http.server 8000
```

Poi apri nel browser <http://localhost:8000>. Per fermare il server: `Ctrl + C`.

Dopo aver cambiato un file basta ricaricare la pagina (`F5`). Se una volta non vedi la
modifica, ricarica una seconda volta.

Per provarlo su tablet o telefono collegati allo stesso Wi-Fi, apri
`http://INDIRIZZO-DEL-PC:8000` (l'indirizzo del PC si vede con il comando `ipconfig`).

## I file

| File | Cosa contiene |
|---|---|
| `index.html` | La pagina: il foglio del gioco, i pulsanti, i cartelli |
| `style.css` | L'aspetto di pulsanti, scritte e cartelli |
| `settings.js` | **Le manopole** (gravità, salto, velocità...) e il pannello segreto |
| `levels.js` | **I livelli**, disegnati con le lettere |
| `game.js` | Il motore del gioco: movimento, collisioni, disegno, suoni |
| `personaggi.js` | **La memoria dei personaggi**: salvare, caricare, eliminare, rinominare, record, esporta/importa |
| `creazione.js` | La pagina "Crea il tuo personaggio": dalla foto del disegno al personaggio |
| `galleria.js` | Le pagine con le figurine: Galleria, "Chi gioca?", Classifica |
| `suoni.js` | La pagina "Registra i suoni": microfono, memoria dei suoni e menu per sceglierli |
| `editor.js` | L'editor di livelli: la griglia, la memoria dei livelli e la pagina "I miei livelli" |
| `scambio.js` | Esportare, condividere con gli amici e importare personaggi, suoni e livelli |
| `manifest.json`, `sw.js` | Servono per installare il gioco come una app |
| `assets/` | Immagini e suoni |

## Le manopole e il pannello segreto

In cima a `settings.js` ci sono sette variabili: `gravita`, `forzaSalto`, `velocita`,
`dimensionePersonaggio`, `coloreCielo`, `velocitaNemici`, `puntiMostro`.

- **Per provare al volo**: apri il pannello segreto e muovi gli slider. Il gioco cambia subito,
  ma quando ricarichi la pagina torna tutto come prima.
- **Per cambiare davvero**: quando hai trovato un valore che ti piace, leggilo nel pannello
  (per esempio `forzaSalto = 14`) e scrivilo uguale in `settings.js`.

## La Galleria dei personaggi

Ogni bambino può creare il suo eroe o il suo mostro direttamente dal gioco, senza toccare i file.

1. Nel menu iniziale tocca **Crea il tuo personaggio**.
2. Scegli **EROE** o **MOSTRO**.
3. Tocca **Fai una foto** e fotografa il disegno, oppure **Scegli un'immagine**.
4. Guarda l'anteprima sullo sfondo a scacchi: gli scacchi sono le parti trasparenti.
   Se resta del foglio, sposta **Pulisci sfondo** verso destra; se sparisce un pezzo del
   disegno, spostalo verso sinistra.
5. Scrivi il nome del personaggio e chi l'ha disegnato, poi **Salva!**

Per una foto che viene bene:

- foglio **bianco**, senza righe né quadretti;
- pennarelli dai colori decisi e un bel contorno scuro (il giallo chiaro e la matita leggera
  rischiano di sparire insieme al foglio);
- il disegno che **guarda verso destra**;
- buona luce, niente ombra della mano o del telefono sul foglio;
- nella foto solo il foglio: se si vede il tavolo, entra anche lui nel personaggio.

Poi:

- **Galleria**: tutte le figurine, divise in Eroi e Mostri. Toccandone una si può giocare
  con lui, rinominarlo o eliminarlo.
- **Chi gioca?**: prima di ogni partita si sceglie l'eroe.
- **Mostri a sorpresa**: i mostri di ogni livello vengono pescati a caso tra quelli salvati,
  e la prima volta che uno compare il gioco lo presenta ("Attento! Arriva Drago Fulmine di Tommaso!").
  Se dalla Galleria scegli "Gioca con lui" su un mostro, in quella partita ci sarà solo lui.
- **Classifica degli eroi**: per ogni eroe il record di stelle e il livello più alto raggiunto.
- **Password genitore** (facoltativa): si imposta dal pannello segreto e viene chiesta prima
  di eliminare un personaggio. È un lucchetto per bambini, non una vera protezione.

L'eroe "Michele" c'è sempre e usa il disegno `assets/player.png` (vedi sotto); non si può
eliminare.

## Come funziona la memoria dei personaggi

*Questa parte è scritta per essere raccontata a Michele.*

**Dove finiscono i personaggi?**
Dentro il browser c'è un armadio invisibile che si chiama **IndexedDB**. Quello che ci metti
dentro resta lì anche se chiudi il gioco o spegni il tablet, come i giocattoli che ritrovi
nell'armadio la mattina dopo.

**Com'è fatto l'armadio?**
Ha uno scaffale che si chiama `personaggi`. Su quello scaffale ogni personaggio ha la sua
**scheda**, come una figurina con le informazioni scritte dietro:

| Sulla scheda c'è | Per esempio |
|---|---|
| `id` — il suo numero, che sceglie l'armadio | `3` |
| `nome` | `"Drago Fulmine"` |
| `autore` — chi l'ha disegnato | `"Tommaso"` |
| `tipo` | `"eroe"` oppure `"mostro"` |
| `immagine` — il disegno ritagliato | (un'immagine PNG) |
| `creatoIl` — quando è nato | `"2026-10-13..."` |
| `recordStelle` e `livelloMassimo` | `12` e `3` |

**Chi parla con l'armadio?**
Solo il file `personaggi.js`. Dentro ci sono quattro funzioni, che sono come quattro richieste
che si possono fare a un bibliotecario:

- `salvaPersonaggio` → "Metti questa scheda sullo scaffale."
- `caricaPersonaggi` → "Fammi vedere tutte le schede."
- `eliminaPersonaggio` → "Butta via la scheda numero 3."
- `rinominaPersonaggio` → "Prendi la scheda numero 3, cambia il nome e rimettila a posto."

**Perché nel codice c'è scritto `await`?**
Perché l'armadio non risponde subito: ci mette un attimo a cercare. `await` vuol dire
"aspetta che abbia finito, poi vai avanti". È come chiedere un libro al bibliotecario e
aspettare al bancone che torni.

**Come fa una foto a diventare un personaggio?**
Una foto è fatta di tantissimi puntini colorati. Il file `creazione.js` li guarda uno per uno:
**se** il puntino è chiaro come il foglio lo fa diventare invisibile, **altrimenti** lo lascia
com'è. Poi cerca dove comincia e dove finisce il disegno, ritaglia tutto intorno e lo
rimpicciolisce alla misura giusta.

**Tre cose importanti da sapere**

1. **Ogni dispositivo ha il suo armadio.** I personaggi creati sul tablet non compaiono da
   soli sul telefono, e non vanno su Internet: restano solo lì.
2. **Ogni indirizzo ha il suo armadio.** Il gioco aperto su `localhost` e quello su
   GitHub Pages non vedono gli stessi personaggi.
3. **L'armadio si può svuotare.** Succede se si cancellano i "dati di navigazione" del browser
   o si disinstalla la app. Su iPad e iPhone, Safari può svuotarlo da solo se il gioco non
   viene aperto per alcune settimane; installandolo sulla schermata Home è molto più al sicuro.

**Nell'armadio ci sono altri due scaffali**, fatti allo stesso modo: `suoni` per le voci
registrate e `livelli` per i livelli costruiti con l'editor.

**Per questo esiste la "Copia di sicurezza di tutto"** (in fondo alla Galleria). Mette tutte
le schede in un unico file: è la valigia del gioco. Dentro un file di testo immagini e suoni
non ci stanno, quindi vengono trasformati in una lunghissima fila di lettere (si chiama
*base64*) e ritrasformati all'arrivo.

- **Per fare una copia di sicurezza**: tocca "Copia di sicurezza di tutto" e conserva il file.
- **Per portare tutto su un altro tablet o darlo a un amico**: vedi "Scambiare personaggi,
  suoni e livelli con gli amici".

## Aggiungere i disegni di Michele

Questi sono i disegni **predefiniti**, quelli che il gioco usa quando non è stato scelto un
personaggio della Galleria. Metti nella cartella `assets/` tre immagini con **esattamente**
questi nomi:

| File | Cos'è | Consigli |
|---|---|---|
| `player.png` | il personaggio | quadrata, che **guarda verso destra** |
| `nemico.png` | il nemico | quadrata, che guarda verso destra |
| `stella.png` | la stella | quadrata |

Come fare:

1. Michele disegna su un foglio bianco con pennarelli dai colori decisi.
2. Fai una foto dall'alto con buona luce e ritaglia il disegno in un quadrato.
3. Togli lo sfondo bianco per renderlo trasparente (va bene qualsiasi programma o sito
   "rimuovi sfondo") e salva in formato **PNG**.
4. Rimpicciolisci a circa 200×200 pixel: basta e avanza.
5. Copia il file in `assets/` e ricarica la pagina.

Finché un'immagine manca, il gioco usa al suo posto una forma colorata.
Le immagini vengono sempre disegnate dentro un quadrato: se il disegno non è quadrato, si schiaccia.

## Registrare i suoni dal gioco

Il modo più semplice: nel menu iniziale tocca **🎤 Suoni**.

1. Accanto al suono che vuoi cambiare tocca **🎤 Registra** e fai il tuo verso.
   La registrazione si ferma da sola dopo un paio di secondi, oppure toccando di nuovo il pulsante.
2. Dai un nome al suono (per esempio "Boing di Michele").
3. Il suono appena registrato viene scelto subito. Dal **menu** accanto puoi cambiarlo
   quando vuoi: ci sono tutte le registrazioni fatte per quell'effetto e "Suono del gioco".
4. **▶ Prova** fa ascoltare il suono scelto, **🗑️** elimina la registrazione scelta.

Cose da sapere:

- La prima volta il browser chiede il **permesso di usare il microfono**: bisogna dire di sì.
- Il microfono funziona solo sul gioco pubblicato (indirizzo `https`) o su `localhost`,
  non aprendo il gioco dal tablet con l'indirizzo del PC (`http://192.168...`).
- Non serve essere velocissimi: il gioco taglia da solo il silenzio prima della voce.
- I suoni registrati stanno nell'armadio del browser, su uno scaffale chiamato `suoni`,
  proprio come i personaggi (vedi "Come funziona la memoria dei personaggi"). Quindi
  **restano solo su quel dispositivo**: chi apre il gioco da un altro tablet non li sente.
- Per darli a un amico usa **📤 Condividi i miei suoni** (vedi "Scambiare personaggi, suoni
  e livelli con gli amici").
- Per far sentire un suono **a tutti quelli che aprono il gioco**, mettilo come file nella
  cartella `assets/`, come spiegato qui sotto.

Quando il gioco deve fare un suono sceglie così: **se** dal menu è stata scelta una
registrazione usa quella, **altrimenti** usa il file in `assets/`, **altrimenti** il suono
"da robot" creato dal computer.

## Mettere i suoni nella cartella assets

Metti in `assets/` cinque file con questi nomi:

| File | Quando si sente | Idea |
|---|---|---|
| `salto.mp3` | a ogni salto | "Op!" |
| `stella.mp3` | quando si prende una stella | "Ding!" |
| `ahi.mp3` | quando si tocca un nemico | "Ahi!" |
| `vittoria.mp3` | arrivati alla bandiera | "Evvivaaa!" |
| `schiacciato.mp3` | saltando in testa a un mostro | "Splat!" |

Come fare:

1. Registra con il registratore vocale del telefono, un suono per volta.
2. Tieni i suoni **cortissimi** (meno di un secondo per salto, stella, ahi e schiacciato) e taglia
   il silenzio all'inizio, altrimenti il suono arriva in ritardo.
3. Se il telefono salva in un altro formato (per esempio `.m4a`), converti in **MP3**
   con [Audacity](https://www.audacityteam.org/) (File → Esporta → MP3) o un convertitore online.
4. Copia i file in `assets/` e ricarica la pagina.

Finché un file manca, il gioco usa un suono "da robot" creato dal computer.

## Creare un livello con l'editor

Il modo più semplice, senza toccare i file: nel menu iniziale tocca **🧱 Livelli**, poi
**Crea un livello nuovo**.

1. Scegli un **attrezzo** (Terreno, Stella, Nemico, Bandiera, Partenza o Gomma).
2. **Tocca le caselle** della griglia per metterlo. La griglia scorre di lato; con
   "Più lungo" e "Più corto" cambi la lunghezza del livello.
3. Sotto la griglia vedi **il livello scritto con i simboli**: cambia a ogni tocco, ed è
   lo stesso testo che si scriverebbe in `levels.js`.
4. **▶ Gioca il mio livello** lo fa provare subito. Con la casetta 🏠 in alto si torna
   all'editor.
5. Dai un nome e premi **💾 Salva**: il livello finisce in "I miei livelli", da dove si può
   giocare, modificare, condividere o eliminare.

Di partenza e di bandiera ce n'è sempre una sola: mettendola in un posto nuovo sparisce da
quello vecchio. Senza tutte e due il livello non si può giocare.

Un bel gioco da fare insieme: costruire un livello nell'editor, poi copiare il testo sotto
la griglia dentro `levels.js` per farlo diventare un livello "vero" del gioco.

## Scambiare personaggi, suoni e livelli con gli amici

Tutto quello che si crea resta sul dispositivo dove è stato creato. Per darlo a un amico
si usa un **pacchetto**: un file che finisce con `.json`.

**Per mandare:**

| Cosa | Dove si trova il pulsante |
|---|---|
| Un solo personaggio | Galleria → tocca la figurina → **📤 Condividi** |
| Tutti i personaggi | Galleria → **📤 Esporta tutti i personaggi** |
| I suoni registrati | Suoni → **📤 Condividi i miei suoni** |
| Un solo livello | Livelli → **📤 Condividi** sulla carta del livello |
| Tutti i livelli | Livelli → **📤 Condividi tutti i livelli** |
| Tutto insieme (copia di sicurezza) | Galleria → **💾 Copia di sicurezza di tutto** |

Su tablet e telefono si apre il menu "Condividi" del dispositivo, per mandare il file con
un messaggio o una mail. Dove questo non è possibile (per esempio sul PC) il file viene
scaricato nella cartella dei download, e lo si manda a mano.

**Per ricevere:** l'amico apre il gioco, va in Galleria, Suoni o Livelli (è uguale) e tocca
**📂 Importa da un amico**, poi sceglie il file ricevuto. Il gioco aggiunge tutto quello
che c'è nel pacchetto e dice cosa è arrivato.

Importare **aggiunge** sempre e non cancella mai: se arriva un "Drago Fulmine" e ce n'è già
uno, quello nuovo diventa "Drago Fulmine 2".

I suoni arrivati vanno poi scelti dal menu nella pagina Suoni: non sostituiscono da soli
quelli che l'amico sta già usando.

## Scrivere un livello nel codice

Apri `levels.js`. Ogni livello è un disegno fatto di simboli:

| Simbolo | Significato |
|---|---|
| `#` | blocco di terreno |
| `*` | stella |
| `E` | nemico |
| `F` | bandiera di arrivo |
| `P` | punto di partenza |
| `-` | aria |

1. Copia un livello intero, dalla riga con `[` fino alla riga con `],`.
2. Incollalo subito prima dell'ultima riga del file (`];`).
3. Cambia i simboli come vuoi. Il gioco si accorge da solo che c'è un livello in più.

Regole da ricordare:

- Tutte le righe **lunghe uguali** (per allungare il livello, allunga tutte le righe).
- 10 righe per livello; ogni riga è tra virgolette e finisce con una virgola.
- Una sola `P` e una sola `F`, appoggiate sopra un `#`. Anche i nemici `E` vanno sopra un `#`.
- Un buco nel terreno (`--` al posto di `##` nelle ultime due righe) fa cadere: tienili larghi
  2 caselle, 3 è già difficile.
- Con le manopole di partenza il personaggio salta su piattaforme alte al massimo **2 caselle**.
- Un nemico passeggia per 3 caselle a destra e a sinistra di dove l'hai messo.

Un trucco: usa nell'editor un carattere a larghezza fissa, così le colonne restano allineate.

## Pubblicare su GitHub Pages

1. Crea un account su <https://github.com> (se non ce l'hai).
2. Crea un nuovo repository **pubblico**, per esempio `avventura-di-michele`.
3. Carica i file. Dal terminale, dentro questa cartella:

   ```bash
   git init
   git add .
   git commit -m "Prima versione del gioco"
   git branch -M main
   git remote add origin https://github.com/TUO-NOME/avventura-di-michele.git
   git push -u origin main
   ```

   Oppure, senza terminale: nella pagina del repository scegli **Add file → Upload files**
   e trascina dentro tutto il contenuto della cartella (compresa `assets/`).
4. Nel repository vai su **Settings → Pages**. In "Build and deployment" scegli
   **Deploy from a branch**, branch **main**, cartella **/ (root)**, poi **Save**.
5. Dopo un minuto o due il gioco è online su `https://TUO-NOME.github.io/avventura-di-michele/`.

Per aggiornare il gioco pubblicato, dopo ogni modifica:

```bash
git add .
git commit -m "Nuovo livello"
git push
```

### Installarlo come app

Apri l'indirizzo del gioco sul tablet o sul telefono:

- **Android (Chrome)**: menu ⋮ → "Aggiungi a schermata Home" / "Installa app".
- **iPad / iPhone (Safari)**: pulsante Condividi → "Aggiungi alla schermata Home".
- **PC (Chrome o Edge)**: icona di installazione a destra nella barra dell'indirizzo.

Una volta installato funziona anche senza Internet. Quando Internet c'è, il gioco prende
sempre l'ultima versione pubblicata.

## Idee per continuare insieme

- Un nuovo simbolo nei livelli, per esempio `M` per una molla che fa saltare altissimo.
- Un cuore `C` da raccogliere per recuperare una vita.
- Una nuova manopola in `settings.js`, con il suo slider nel pannello segreto.
