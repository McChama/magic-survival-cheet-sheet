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
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        height: "100dvh",
        minHeight: 640,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        background: "#08080a",
        fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif",
        color: "#e8e8e2",
        boxShadow: "0 0 0 1px rgba(255,255,255,.08)",
      }}
    >
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
