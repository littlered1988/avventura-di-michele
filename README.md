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

## Avviarlo sul computer

Il gioco ha bisogno di un piccolo server locale (aprendo `index.html` con un doppio clic
si vede lo stesso, ma la parte "app installabile" non funziona).

Apri un terminale **dentro questa cartella** e scrivi:

```bash
python -m http.server 8000
```

Poi apri nel browser <http://localhost:8000>. Per fermare il server: `Ctrl + C`.

Dopo aver cambiato un file basta ricaricare la pagina (`F5`).

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
| `manifest.json`, `sw.js` | Servono per installare il gioco come una app |
| `assets/` | Immagini e suoni |

## Le manopole e il pannello segreto

In cima a `settings.js` ci sono sei variabili: `gravita`, `forzaSalto`, `velocita`,
`dimensionePersonaggio`, `coloreCielo`, `velocitaNemici`.

- **Per provare al volo**: apri il pannello segreto e muovi gli slider. Il gioco cambia subito,
  ma quando ricarichi la pagina torna tutto come prima.
- **Per cambiare davvero**: quando hai trovato un valore che ti piace, leggilo nel pannello
  (per esempio `forzaSalto = 14`) e scrivilo uguale in `settings.js`.

## Aggiungere i disegni di Michele

Metti nella cartella `assets/` tre immagini con **esattamente** questi nomi:

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

## Registrare i suoni

Metti in `assets/` quattro file con questi nomi:

| File | Quando si sente | Idea |
|---|---|---|
| `salto.mp3` | a ogni salto | "Op!" |
| `stella.mp3` | quando si prende una stella | "Ding!" |
| `ahi.mp3` | quando si tocca un nemico | "Ahi!" |
| `vittoria.mp3` | arrivati alla bandiera | "Evvivaaa!" |

Come fare:

1. Registra con il registratore vocale del telefono, un suono per volta.
2. Tieni i suoni **cortissimi** (meno di un secondo per salto, stella e ahi) e taglia
   il silenzio all'inizio, altrimenti il suono arriva in ritardo.
3. Se il telefono salva in un altro formato (per esempio `.m4a`), converti in **MP3**
   con [Audacity](https://www.audacityteam.org/) (File → Esporta → MP3) o un convertitore online.
4. Copia i file in `assets/` e ricarica la pagina.

Finché un file manca, il gioco usa un suono "da robot" creato dal computer.

## Creare un nuovo livello

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

- Saltare in testa ai nemici per schiacciarli (in `controllaNemici`, dentro `game.js`).
- Un nuovo simbolo nei livelli, per esempio `M` per una molla che fa saltare altissimo.
- Un cuore `C` da raccogliere per recuperare una vita.
- Una nuova manopola in `settings.js`, con il suo slider nel pannello segreto.
