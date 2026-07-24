import { createContext, useContext, useState } from "react";

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);

  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
