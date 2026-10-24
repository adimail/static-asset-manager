import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useStore } from "./store/useStore";
import { Header } from "./components/Layout/Header";
import { MainLayout } from "./components/Layout/MainLayout";
import { Footer } from "./components/Layout/Footer";
import { HelpModal } from "./components/Layout/HelpModal";
import { TagManagerModal } from "./components/Tags/TagManagerModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const {
    setUploadOpen,
    triggerSearchFocus,
    selectAsset,
    setHelpOpen,
    isHelpOpen,
    isUploadOpen,
    selectedAssetId,
    isTagModalOpen,
    setTagModalOpen,
  } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        (e.target as HTMLElement).tagName,
      );

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setUploadOpen(true);
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") ||
        (e.key === "/" && !isInput)
      ) {
        e.preventDefault();
        triggerSearchFocus();
      }

      if (e.key === "Escape") {
        if (isHelpOpen) setHelpOpen(false);
        else if (isTagModalOpen) setTagModalOpen(false);
        else if (isUploadOpen) setUploadOpen(false);
        else if (selectedAssetId) selectAsset(null);
      }

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [
    isHelpOpen,
    isUploadOpen,
    selectedAssetId,
    isTagModalOpen,
    setUploadOpen,
    triggerSearchFocus,
    selectAsset,
    setHelpOpen,
    setTagModalOpen,
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="h-screen flex flex-col overflow-hidden bg-bg text-gray-100">
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              style: {
                background: "#171920",
                color: "#f8fafc",
                border: "1px solid var(--color-border)",
              },
            }}
          />
          <Header />
          <MainLayout />
          <Footer />
          <HelpModal />
          <TagManagerModal />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
