import { useState } from "react";
import { RunDashboardScreen } from "./components/dashboard/RunDashboardScreen";
import { MagicCircleBubble } from "./components/layout/MagicCircleBubble";
import { ClassSelectScreen } from "./components/screens/ClassSelectScreen";
import { DropProbabilityScreen } from "./components/screens/DropProbabilityScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { MagicCombinationScreen } from "./components/screens/MagicCombinationScreen";
import { OwnedArtifactScreen, OwnedMagicScreen } from "./components/screens/OwnedGridScreen";
import { RecommenderScreen } from "./components/screens/RecommenderScreen";
import { ResearchScreen } from "./components/screens/ResearchScreen";
import { SubjectSelectScreen } from "./components/screens/SubjectSelectScreen";
import { SynergyScreen } from "./components/screens/SynergyScreen";

type Screen =
  | "home"
  | "subject"
  | "class"
  | "dashboard"
  | "research"
  | "dropProbability"
  | "recommender"
  | "ownedMagic"
  | "ownedArtifact"
  | "synergy"
  | "magicCombination";

/** The screens of a run in progress — the Magic Circle bubble floats over these and nowhere else. */
const RUN_SCREENS: Screen[] = ["dashboard", "ownedMagic", "ownedArtifact", "synergy"];

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  return (
    <div className="w-full max-w-[430px] h-[100dvh] min-h-[640px] mx-auto relative overflow-hidden bg-[#08080a] font-magic text-[#e8e8e2] shadow-[0_0_0_1px_rgba(255,255,255,.08)]">
      {screen === "home" && (
        <HomeScreen
          onStartGame={() => setScreen("class")}
          onOpenCharacter={() => setScreen("subject")}
          onOpenResearch={() => setScreen("research")}
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
          onChangeClass={() => setScreen("class")}
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
