import { useState } from "react";
import { RunDashboardScreen } from "./components/dashboard/RunDashboardScreen";
import { ClassSelectScreen } from "./components/screens/ClassSelectScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ResearchScreen } from "./components/screens/ResearchScreen";
import { SubjectSelectScreen } from "./components/screens/SubjectSelectScreen";

type Screen = "home" | "subject" | "class" | "dashboard" | "research";

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
      {screen === "subject" && <SubjectSelectScreen onClose={() => setScreen("home")} />}
      {screen === "class" && (
        <ClassSelectScreen onClose={() => setScreen("home")} onContinue={() => setScreen("dashboard")} />
      )}
      {screen === "dashboard" && <RunDashboardScreen onChangeClass={() => setScreen("class")} />}
    </div>
  );
}

export default App;
