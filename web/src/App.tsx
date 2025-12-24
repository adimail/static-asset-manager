import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileUploader } from "./components/FileUploader/FileUploader";
import { AssetList } from "./components/AssetList/AssetList";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Asset Manager
          </h1>
          <FileUploader />
          <AssetList />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
