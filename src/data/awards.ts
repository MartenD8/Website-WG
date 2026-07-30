/** Awards from Awards.md */

export interface AwardDefinition {
  id: string;
  title: string;
}

export const AWARDS: AwardDefinition[] = [
  { id: "spruecheklopfer", title: "Sprücheklopfer" },
  { id: "gar-nicht-kommer", title: "Gar Nicht Kommer" },
  { id: "bester-bierpong", title: "Bester Bierpong-Spieler" },
  { id: "bester-dj", title: "Bester DJ" },
  { id: "groesster-wg-fan", title: "Größter WG-Fan" },
  {
    id: "spendierhosen",
    title: "Spendierhosen-Träger (meisten Alkohol mitgebracht)",
  },
  { id: "last-man-standing", title: "Last Man Standing" },
  { id: "first-man-falling", title: "First Man Falling" },
  { id: "haeufigster-partygast", title: "Häufigster Partygast" },
  {
    id: "abrissbirne",
    title: "Abrissbirne (meiste Sachen zerstört)",
  },
  { id: "bester-kippendreher", title: "Bester Kippendreher" },
  { id: "bester-trinker", title: "Bester Trinker" },
  { id: "bester-spitzname", title: "Bester Spitzname" },
  { id: "haette-haeufiger", title: "Hätte häufiger kommen sollen" },
  { id: "stimmungskanone", title: "Stimmungskanone" },
];
