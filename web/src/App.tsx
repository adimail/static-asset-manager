import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useStore } from "./store/useStore";
import { Header } from "./components/Layout/Header";
import { MainLayout } from "./components/Layout/MainLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { theme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="h-screen flex flex-col overflow-hidden bg-bg text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme={theme === "system" ? "system" : theme}
          />
          <Header />
          <MainLayout />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
