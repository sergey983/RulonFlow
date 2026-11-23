import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import ComingSoonPage from "./pages/ComingSoonPage";
import CounterpartiesPage from "./pages/CounterpartiesPage";
import FilmTypesPage from "./pages/FilmTypesPage";
import DictionaryLayout from "./pages/dictionaries/DictionaryLayout";
import SuppliersPage from "./pages/SuppliersPage";
import DefectReasonsPage from "./pages/DefectReasonsPage";
import FilmBrandAliasesPage from "./pages/FilmBrandAliasesPage";
import StorageZonesPage from "./pages/StorageZonesPage";
import WarehouseMapPage from "./pages/WarehouseMapPage";
import ReceiptImportPage from "./pages/ReceiptImportPage";
import PalletTypesPage from "./pages/PalletTypesPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<HomePage />} />

                            <Route path="/dictionaries" element={<DictionaryLayout />}>
                                <Route
                                    index
                                    element={
                                        <Navigate to="/dictionaries/film-types" replace />
                                    }
                                />

                                <Route path="film-types" element={<FilmTypesPage />} />
                                <Route path="film-brand-aliases" element={<FilmBrandAliasesPage />} />
                                <Route path="suppliers" element={<SuppliersPage />} />
                                <Route path="counterparties" element={<CounterpartiesPage />} />
                                <Route path="defect-reasons" element={<DefectReasonsPage />} />

                                <Route path="storage-zones" element={<StorageZonesPage />} />
                                <Route path="warehouse-map/:zoneUuid" element={<WarehouseMapPage />} />
                                <Route path="receipt-import" element={<ReceiptImportPage />} />
                                <Route path="pallet-types" element={<PalletTypesPage />} />
                            </Route>

                            <Route
                                path="/warehouse"
                                element={<ComingSoonPage title="Рабочее место кладовщика" />}
                            />
                            <Route
                                path="/print"
                                element={<ComingSoonPage title="Рабочее место печатника" />}
                            />
                            <Route
                                path="/lamination"
                                element={<ComingSoonPage title="Рабочее место ламинаторщика" />}
                            />
                            <Route
                                path="/cutting"
                                element={<ComingSoonPage title="Рабочее место резчика" />}
                            />
                            <Route
                                path="/packing"
                                element={<ComingSoonPage title="Рабочее место упаковщика" />}
                            />
                            <Route
                                path="/logistics"
                                element={<ComingSoonPage title="Рабочее место логиста" />}
                            />
                            <Route
                                path="/admin"
                                element={<ComingSoonPage title="Администрирование" />}
                            />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}