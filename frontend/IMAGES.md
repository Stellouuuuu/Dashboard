# Images de l'interface

Les images actuelles de `public/img/` sont **provisoires** : elles ont été générées pour
caler la mise en page. Remplace-les par de vraies images **en gardant exactement les mêmes
noms de fichiers**. Aucun code n'est à modifier (chemins centralisés dans `src/data/images.ts`).

## Style attendu

Même ambiance que la maquette de référence :
- illustrations « lo-fi » douces ou photos aux tons pastel (rose, mauve, bleu glacier, gris chaud) ;
- lumière de fin de journée, ciels nuageux, silhouettes de ville ou de toits ;
- pas de texte ni de logo dans l'image, pas de visage reconnaissable ;
- le texte blanc est posé par-dessus : prévoir des zones calmes (ciel, flou) à gauche et en bas.

## Licence

Utiliser uniquement des images **libres de droits avec usage commercial autorisé**
(Unsplash, Pexels, Pixabay) ou des images générées par vos soins. Noter la source de chaque
image dans le tableau `Crédits` ci-dessous.

## Fichiers à fournir

Format JPG, qualité ~80, poids < 300 Ko (< 450 Ko pour `bg.jpg` et `hero-*`).

| Fichier | Taille (px) | Où il apparaît | Sujet suggéré | Mots-clés de recherche |
| --- | --- | --- | --- | --- |
| `bg.jpg` | 1920 × 1280 | Fond de toutes les pages (flouté par le CSS) | Rue ou façade d'immeuble, tons gris/beige | `city street overcast`, `building facade beige` |
| `hero-weather.jpg` | 1600 × 900 | Bannière du dashboard (widget météo), hero de la landing | Personne allongée sur un toit sous un ciel rose, nuages | `lofi rooftop sunset illustration`, `pink clouds sky` |
| `hero-github.jpg` | 1600 × 900 | Bannière du dashboard (widget GitHub) | Bureau de développeur la nuit, écran, ville bleue | `night desk coding lofi`, `blue city night window` |
| `hero-rss.jpg` | 1600 × 900 | Bannière (widget RSS), bloc final de la landing | Lecture au coucher du soleil, journal, café | `reading sunset cafe`, `lofi reading illustration` |
| `svc-weather.jpg` | 640 × 440 | Carte « Météo » (dashboard, landing, page Services) | Ciel bleu avec nuages, soleil | `blue sky clouds sun` |
| `svc-github.jpg` | 640 × 440 | Carte « GitHub » | Ville la nuit, lumières bleues, ou clavier | `city night blue lights` |
| `svc-rss.jpg` | 640 × 440 | Carte « RSS » | Pile de journaux / magazines, ou coucher de soleil rose | `newspaper pastel`, `pink sunset city` |
| `widget-city_temperature.jpg` | 600 × 760 | Carte du widget Température | Ville ensoleillée, ciel rose | `sunny city pastel`, `warm sky rooftops` |
| `widget-precipitation_forecast.jpg` | 600 × 760 | Carte Prévisions de pluie | Pluie sur une vitre ou ville enneigée bleutée | `rain window blue`, `snowy town` |
| `widget-recent_commits.jpg` | 600 × 760 | Carte Commits récents | Écran de code, ambiance bleue | `code screen blue`, `laptop night` |
| `widget-security_alerts.jpg` | 600 × 760 | Carte Alertes de sécurité | Cadenas, serrure, ou ville rouge crépuscule | `padlock`, `red dusk city` |
| `widget-article_list.jpg` | 600 × 760 | Carte Derniers articles | Livres, bibliothèque, tons chauds | `books warm light`, `library pastel` |
| `widget-feed_summary.jpg` | 600 × 760 | Carte Résumé de flux | Journal plié, tons clairs | `newspaper morning light` |
| `hero-finance.jpg` | 1600 × 900 | Bannière du dashboard (widget Finance) | Graphique boursier en chandeliers, écran sombre | `stock market candlestick dark` |
| `hero-hackernews.jpg` | 1600 × 900 | Bannière du dashboard (widget Hacker News) | Écran de code/terminal, ambiance sombre | `terminal code dark screen` |
| `svc-finance.jpg` | 640 × 440 | Carte « Finance » | Graphique boursier en chandeliers | `candlestick chart dark` |
| `svc-hackernews.jpg` | 640 × 440 | Carte « Hacker News » | Code affiché sur écran sombre | `computer code dark screen` |
| `widget-exchange_rate.jpg` | 600 × 760 | Carte Taux de change | Pièce/puce électronique, tons finance | `crypto coin computer chip` |
| `widget-crypto_price.jpg` | 600 × 760 | Carte Prix crypto | Bitcoin posé sur un livre | `bitcoin coin book` |
| `widget-top_stories.jpg` | 600 × 760 | Carte Meilleures actus HN | Terminal/code, ambiance sombre | `terminal output code` |
| `widget-story_search.jpg` | 600 × 760 | Carte Recherche d'actus HN | Loupe posée près d'un ordinateur portable | `magnifying glass laptop` |
| `auth.jpg` | 1200 × 1600 | Colonne image du login / inscription | Même univers que `hero-weather.jpg`, en portrait | `lofi rooftop sky vertical` |
| `dashboard-preview.jpg` | 1600 × 1000 | Section « Aperçu » de la landing | **Capture d'écran** du dashboard une fois les vraies images en place | — |

Les images `widget-*.jpg` sont en portrait : le texte du widget s'affiche dans le tiers
inférieur, assombri automatiquement. Les images `hero-*` et `auth.jpg` sont assombries à
gauche et en bas.

## Consigne pour Claude Code

> Remplace chaque fichier listé dans `frontend/IMAGES.md` (dossier `frontend/public/img/`)
> par une image libre de droits (Unsplash, Pexels ou Pixabay) correspondant au sujet décrit.
> Respecte le nom de fichier, les dimensions (recadre si besoin) et le poids maximal.
> Remplis le tableau « Crédits » (fichier, auteur, lien, licence).
> Termine par une nouvelle capture du dashboard (1600 × 1000) pour `dashboard-preview.jpg`.

## Crédits

| Fichier | Auteur | Source | Licence |
| --- | --- | --- | --- |
| `bg.jpg` | Sol Ponce | https://unsplash.com/photos/buildings-line-a-narrow-overcast-city-street-u6RX8rk-Ufc | Unsplash License |
| `hero-weather.jpg` | David Knieradl | https://unsplash.com/photos/pink-and-purple-clouds-against-a-light-sky-BIcK9E3A6u0 | Unsplash License |
| `hero-github.jpg` | Jakub Żerdzicki | https://unsplash.com/photos/a-coders-workspace-filled-with-code-and-keyboards-FjtWczJWRlc | Unsplash License |
| `hero-rss.jpg` | Haberdoedas | https://unsplash.com/photos/a-newspaper-lies-folded-on-a-wooden-table-vhtTw_twiec | Unsplash License |
| `svc-weather.jpg` | Codioful (Formerly Gradienta) | https://unsplash.com/photos/blue-sky-with-white-clouds-Y8K6UFMnKt8 | Unsplash License |
| `svc-github.jpg` | Kevin Nalty | https://unsplash.com/photos/city-skyline-under-blue-sky-during-night-time-oXmVuJ8t20A | Unsplash License |
| `svc-rss.jpg` | DJ | https://unsplash.com/photos/a-pink-sunset-over-new-york-city-J3-j4i_JYEc | Unsplash License |
| `widget-city_temperature.jpg` | Stavrialena Gontzou | https://unsplash.com/photos/citycape-during-golden-hour-G8OyUvtAxUQ | Unsplash License |
| `widget-precipitation_forecast.jpg` | Bernd Dittrich | https://unsplash.com/photos/rain-drops-on-a-window-with-a-dark-blue-sky-in-the-background-wLhmecNUVNc | Unsplash License |
| `widget-recent_commits.jpg` | Jakub Żerdzicki | https://unsplash.com/photos/computer-screen-displaying-lines-of-code-vEmtcGx5nyQ | Unsplash License |
| `widget-security_alerts.jpg` | Anne Nygård | https://unsplash.com/photos/silver-and-black-combination-padlock-rTC5SF27jIc | Unsplash License |
| `widget-article_list.jpg` | Eman Ali | https://unsplash.com/photos/a-stack-of-books-FDuxrHs9zpE | Unsplash License |
| `widget-feed_summary.jpg` | Emre Gencer | https://www.pexels.com/photo/newspaper-in-sunlight-on-wooden-table-29818003/ | Pexels License |
| `hero-finance.jpg` | Maxim Hopman | https://unsplash.com/photos/stock-market-candlestick-chart-on-dark-screen-fiXLQXAhCfk | Unsplash License |
| `hero-hackernews.jpg` | Bernd Dittrich | https://unsplash.com/photos/computer-screen-displaying-code-and-terminal-output-fmH6yLBwEPw | Unsplash License |
| `svc-finance.jpg` | Austin Hervias | https://unsplash.com/photos/candlestick-stock-chart-on-dark-screen-VLpWpv3oDB4 | Unsplash License |
| `svc-hackernews.jpg` | Bernd Dittrich | https://unsplash.com/photos/computer-code-displayed-on-a-dark-screen--PZhcbjJxdI | Unsplash License |
| `widget-exchange_rate.jpg` | Michael Förtsch | https://unsplash.com/photos/a-bit-coin-sitting-on-top-of-a-computer-chip-q9V8LMHx2jo | Unsplash License |
| `widget-crypto_price.jpg` | rc.xyz NFT gallery | https://unsplash.com/photos/a-bit-coin-sitting-on-top-of-an-open-book-LeF9iK78QLU | Unsplash License |
| `widget-top_stories.jpg` | Bernd Dittrich | https://unsplash.com/photos/computer-screen-showing-code-and-terminal-output-gflXHUC_f3w | Unsplash License |
| `widget-story_search.jpg` | Agence Olloweb | https://unsplash.com/photos/magnifying-glass-near-gray-laptop-computer-d9ILr-dbEdg | Unsplash License |
| `auth.jpg` | Nick Nice | https://unsplash.com/photos/a-view-of-a-sunset-from-a-rooftop-CMn0hdjdQgo | Unsplash License |
| `dashboard-preview.jpg` | Capture d'écran de l'app (page /dashboard, compte de démo) | — | — |
