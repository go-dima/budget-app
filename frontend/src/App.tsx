import { ConfigProvider } from "antd";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { FilterProvider } from "./contexts";
import { AdminPage, ListPage, OverviewPage, ReportPage } from "./pages";
import "./App.css";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <BrowserRouter>
        <FilterProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/list" element={<ListPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </AppLayout>
        </FilterProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
