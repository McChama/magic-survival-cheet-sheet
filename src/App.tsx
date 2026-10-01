import { RunDashboardScreen } from "./components/dashboard/RunDashboardScreen";
import { MagicCircleBubble } from "./components/layout/MagicCircleBubble";
import { ClassSelectScreen } from "./components/screens/ClassSelectScreen";
import { DropProbabilityScreen } from "./components/screens/DropProbabilityScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { MagicCombinationScreen } from "./components/screens/MagicCombinationScreen";
import { OwnedArtifactScreen, OwnedMagicScreen } from "./components/screens/OwnedGridScreen";
import { RecommenderScreen } from "./components/screens/RecommenderScreen";
import { ResearchScreen } from "./components/screens/ResearchScreen";
import { RunsScreen } from "./components/screens/RunsScreen";
import { SubjectSelectScreen } from "./components/screens/SubjectSelectScreen";
import { SynergyScreen } from "./components/screens/SynergyScreen";
import { useTranslation } from "react-i18next";
import { IS_COMPANION } from "./config/platform";
import { useNavigationStore, type Screen } from "./store/useNavigationStore";

/** The screens of a run in progress — the Magic Circle bubble floats over these and nowhere else. */
const RUN_SCREENS: Screen[] = ["dashboard", "ownedMagic", "ownedArtifact", "synergy"];

/**
 * All there is in the Android companion (`config/platform.ts`): the Runs list, a run's Dashboard and what opens from
 * it. Home and the Class / Subject / Research menus stay out — the game has them, and live sync reads them from it.
 */
const COMPANION_SCREENS: Screen[] = ["runs", "dashboard", "ownedMagic", "ownedArtifact", "synergy", "magicCombination", "recommender"];

function App() {
  const { t } = useTranslation("translation");
  // Persisted (`useNavigationStore`), not local state, so a reload resumes on the same screen instead of always
  // starting over at Home.
  const stored = useNavigationStore((s) => s.screen);
  const setScreen = useNavigationStore((s) => s.setScreen);
  // In the companion, Runs is where everything starts — including a screen remembered from before it was the root.
  const screen = IS_COMPANION && !COMPANION_SCREENS.includes(stored) ? "runs" : stored;
  return (
    <div className="w-full max-w-[430px] h-[100dvh] min-h-[640px] mx-auto relative overflow-hidden bg-[#08080a] font-magic text-[#e8e8e2] shadow-[0_0_0_1px_rgba(255,255,255,.08)]">
      {screen === "home" && (
        <HomeScreen
          onStartGame={() => setScreen("class")}
          onOpenCharacter={() => setScreen("subject")}
          onOpenResearch={() => setScreen("research")}
          onOpenRuns={() => setScreen("runs")}
        />
      )}
      {screen === "runs" && (
        <RunsScreen
          // With no Home behind it (the companion), closing the list goes on to the run that is loaded, and a new
          // run has no class to pick first: the game sets it.
          onClose={() => setScreen(IS_COMPANION ? "dashboard" : "home")}
          onOpenRun={() => setScreen("dashboard")}
          onNewRun={() => setScreen(IS_COMPANION ? "dashboard" : "class")}
        />
      )}
      {screen === "research" && <ResearchScreen onClose={() => setScreen("home")} />}
      {screen === "dropProbability" && <DropProbabilityScreen onClose={() => setScreen("home")} />}
      {screen === "recommender" && <RecommenderScreen onClose={() => setScreen("dashboard")} />}
      {screen === "subject" && <SubjectSelectScreen onClose={() => setScreen("home")} />}
      {screen === "class" && (
        <ClassSelectScreen onClose={() => setScreen("home")} onContinue={() => setScreen("dashboard")} />
      )}
      {screen === "dashboard" && (
        <RunDashboardScreen
          // The header's button leaves the run: back to picking a class on the web, to the Runs list in the companion.
          onLeave={() => setScreen(IS_COMPANION ? "runs" : "class")}
          leaveAria={t(IS_COMPANION ? "dashboard.runsAria" : "dashboard.changeClassAria")}
          onOpenRecommender={() => setScreen("recommender")}
          onOpenOwnedMagic={() => setScreen("ownedMagic")}
          onOpenOwnedArtifact={() => setScreen("ownedArtifact")}
          onOpenSynergy={() => setScreen("synergy")}
          onOpenMagicCombination={() => setScreen("magicCombination")}
        />
      )}
      {screen === "ownedMagic" && <OwnedMagicScreen onClose={() => setScreen("dashboard")} />}
      {screen === "ownedArtifact" && <OwnedArtifactScreen onClose={() => setScreen("dashboard")} />}
      {screen === "synergy" && <SynergyScreen onClose={() => setScreen("dashboard")} />}
      {screen === "magicCombination" && <MagicCombinationScreen onClose={() => setScreen("dashboard")} />}
      {RUN_SCREENS.includes(screen) && <MagicCircleBubble screen={screen} />}
    </div>
  );
}

export default App;
