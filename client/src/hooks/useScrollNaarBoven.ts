import { useEffect } from "react";
import { useLocation } from "wouter";
import { scrollNaarBoven } from "./useLenis";

/**
 * Bij een nieuwe pagina bovenaan beginnen.
 *
 * Wouter wisselt alleen de component om; de browser laat de scrollpositie staan. Zonder dit
 * land je vanaf "Volledig aanbod" onderaan de homepage op `/aanbod` op diezelfde hoogte.
 *
 * **Op het pad, niet op de zoekreeks.** `useLocation()` geeft alleen het pad terug, en dat is
 * hier precies goed: het beheerpaneel zet open sheets in het webadres (`?boeking=14`, zie
 * `useSheetParam`). Zou dit op de zoekreeks reageren, dan sprong de boekingenlijst naar boven
 * zodra je halverwege een boeking opent.
 *
 * **Geen uitzondering voor de eerste render.** Die had ik er eerst in — de browser zet je bij
 * een herlaadactie terug waar je was, en dat leek netjes om te laten staan. Maar zo'n
 * uitzondering hangt aan een ref die alleen klopt zolang dit component niet hermount, en als
 * dat wél gebeurt slikt hij juist élke navigatie in. Dat risico weegt niet op tegen wat het
 * oplevert; `scrollRestoration` hieronder zet die browserherstel-stap toch al uit.
 */
export function useScrollNaarBoven() {
  const [pad] = useLocation();

  useEffect(() => {
    // De browser mag hier niet ook aan trekken: bij terug/vooruit zet hij zijn eigen
    // opgeslagen positie terug, en dan concurreert dat met de regel hieronder.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useEffect(() => {
    // Een anker (`/galerij#events`) is een expliciet doel; dat overrulen we niet.
    if (window.location.hash) return;
    scrollNaarBoven();
  }, [pad]);
}
