# Règles d'Ingénierie du Projet Blu (Pool Management)

<RULE[ui_alerts_modals]>
# Standardisation des Dialogues et Modales UI
1. **INTERDICTION d'utiliser les fonctions natives du navigateur** : Ne jamais utiliser `window.confirm()`, `window.alert()`, ou `window.prompt()`.
2. **OBLIGATION d'utiliser `ConfirmModal` ou `ModalLayout`** : Toute demande de confirmation ou formulaire surgissant doit impérativement utiliser `ModalLayout` ou `ConfirmModal`.
3. **Téléportation via React Portal** : Toute boîte modale doit être rendue via `ReactDOM.createPortal(modalJSX, document.body)` afin de ne jamais être piégée dans le défilement ou le contexte d'empilement (stacking context) d'un conteneur parent.
</RULE[ui_alerts_modals]>

<RULE[mobile_typography_and_contrast]>
# Standards de Typographie Mobile & Contraste Extérieur (Plein Soleil)
L'application est utilisée sur smartphone par des techniciens au bord des bassins en extérieur.
1. **INTERDICTION ABSOLUE des micro-tailles (< 12px)** :
   - `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` sont STRICTEMENT INTERDITS.
   - Micro-métadonnées et badges denses : `text-xs font-black` (12px minimum).
   - Informations secondaires et dates : `text-sm font-semibold` (14px minimum).
   - Corps de texte et notes clients : `text-base` (16px minimum).
   - Titres de section : `text-xl font-black` (20px).
   - Titres principaux : `text-2xl font-black` (24px).
2. **Contraste Élevé Garanti** :
   - Interdiction de `text-slate-400` sur fond blanc pour du contenu informatif. Utiliser `text-slate-500` minimum.
   - Sur fond coloré ou dégradé, l'opacité minimale du texte est `text-white/80` (jamais en-dessous).
3. **Prévention du Zoom iOS** :
   - Tout champ `<input>`, `<select>` ou `<textarea>` doit avoir une taille de police minimale de 16px (`text-base`) pour empêcher l'auto-zoom forcé par Safari iOS.
</RULE[mobile_typography_and_contrast]>

<RULE[touch_targets_44px]>
# Cibles Tactiles & Boutons (Apple HIG / Material Standard)
1. **Surface minimale d'appui de 44×44px** : Tout élément interactif (bouton, lien, icône cliquable, case à cocher, switch) doit obligatoirement avoir une surface cliquable d'au moins 44×44px (`min-h-[44px] min-w-[44px]`).
2. **Boutons d'icônes** : Même si l'icône visuelle est petite (`size={16}` ou `size={18}`), le conteneur bouton doit mesurer au moins `w-11 h-11` (44px).
3. **Taille minimale des icônes décoratives avec texte** : Les icônes associées à des labels doivent avoir `size={14}` minimum (jamais 10 ou 12).
</RULE[touch_targets_44px]>

<RULE[supabase_type_safety]>
# Type-Safety & Rigueur Supabase
1. **Client Typé Obligatoire** : Toute interaction avec Supabase doit exploiter le schéma généré `Database` de `src/lib/database.types.ts`.
2. **INTERDICTION de `any` sur les flux de données** : Utiliser les types de lignes dédiés (`Database['public']['Tables']['...']['Row']` ou alias dans `supabase.ts`).
3. **Retour Utilisateur Systématique (Toast)** : Tout bloc `catch` asynchrone lors d'une mutation ou d'une requête critique doit notifier l'utilisateur avec `toast.error(...)` au lieu d'un simple `console.error`.
</RULE[supabase_type_safety]>

<RULE[component_modularity_350_lines]>
# Modularité & Plafond de Taille de Composants (< 350 Lignes)
1. **Plafond strict** : Aucun composant React ne doit dépasser 350 lignes de code.
2. **Découpage en 3 couches pour les grands écrans** :
   - Service / Helpers : calculs de facturation, devis, ventilation pure (`services/` ou `helpers/`).
   - Hook d'état : logique de formulaire, sélection et chargement (`use[Nom]Form.ts` ou `use[Nom]State.ts`).
   - Sous-composants : découpage des formulaires et onglets dans des fichiers distincts.
   - Vue principale allégée orchestrant les sous-composants.
</RULE[component_modularity_350_lines]>

<RULE[empty_state_compact_cta]>
# Règle UX & Mobile : États Vides & Cartes d'Action Compactes (Zero-Waste Layout)
L'application est utilisée sur smartphone avec une hauteur d'écran restreinte.
1. **INTERDICTION des blocs vides géants** :
   - Un conteneur ou bloc vide (ex: liste d'intervenants vide, historique vide, aucun bassin, aucun produit) ne doit JAMAIS occuper une hauteur démesurée (> 80px) avec du vide vertical et une simple icône centrée.
2. **OBLIGATION du pattern CTA Compact Haute Densité (Solution A)** :
   - Quand une section est vide mais qu'une action est possible (ex: assigner un intervenant, ajouter un bassin, enregistrer un document), remplacer le bloc vide par une **barre d'action compacte et cliquable de 48px à 56px de haut**.
   - Spécifications obligatoires :
     - `min-h-[52px]` pour garantir la cible tactile mobile $\ge 44$px.
     - Bordure en tirets fins (`border-2 border-dashed border-slate-200/90 hover:border-blue-500/80 dark:border-slate-700`).
     - Icône d'action à gauche (`w-10 h-10` avec fond coloré doux et icône `size={18}`).
     - Label d'action clair (`text-xs font-black uppercase`) + sous-titre explicatif (`text-xs font-semibold text-slate-500`).
     - Bouton pastille `+` à droite (`w-8 h-8 rounded-lg`).
     - L'intégralité du conteneur est cliquable d'un seul geste (`active:scale-[0.99]`).
3. **Transition dynamique** :
   - Dès que des éléments existent, le bloc s'étend naturellement en carte complète (`card-bento`) avec la liste des données et son en-tête dédié.
</RULE[empty_state_compact_cta]>

<RULE[git_command_commit_push]>
# Règle d'Action : Commande "git" (Commit & Push Automatique)
Dès que l'utilisateur écrit "git" (ou une formulation équivalente demandant "git") :
1. **Commit automatique** : Exécuter `git add -A` et `git commit -m "[message explicite et détaillé des modifications]"` en français.
2. **Push automatique** : Exécuter `git push` vers le dépôt distant.
3. **Compte-rendu clair** : Afficher un résumé synthétique des fichiers committés et pushés.
</RULE[git_command_commit_push]>
