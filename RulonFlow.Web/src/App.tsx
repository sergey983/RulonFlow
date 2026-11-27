import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

import AppLayout from "./layout/AppLayout";
import HomePage from "./pages/HomePage";
import ComingSoonPage from "./pages/ComingSoonPage";
import CounterpartiesPage from "./pages/CounterpartiesPage";
import FilmTypesPage from "./pages/FilmTypesPage";
import FilmTypeParamsPage from "./pages/FilmTypeParamsPage";
import DictionaryLayout from "./pages/dictionaries/DictionaryLayout";
import SuppliersPage from "./pages/SuppliersPage";
import DefectReasonsPage from "./pages/DefectReasonsPage";
import FilmBrandAliasesPage from "./pages/FilmBrandAliasesPage";
import StorageZonesPage from "./pages/StorageZonesPage";
import WarehouseMapPage from "./pages/WarehouseMapPage";
import PalletTypesPage from "./pages/PalletTypesPage";
import LoginPage from "./pages/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import UsersPage from "./pages/admin/UsersPage";
import RolesPage from "./pages/admin/RolesPage";

import TechnologistLayout from "./pages/technologist/TechnologistLayout";
import TechnologistImportPage from "./pages/technologist/TechnologistImportPage";
import CuttingJobsPage from "./pages/technologist/CuttingJobsPage";
import PrintingJobsPage from "./pages/technologist/PrintingJobsPage";
import LaminationJobsPage from "./pages/technologist/LaminationJobsPage";

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
                                <Route path="film-type-params" element={<FilmTypeParamsPage />} />
                                <Route path="film-brand-aliases" element={<FilmBrandAliasesPage />} />
                                <Route path="suppliers" element={<SuppliersPage />} />
                                <Route path="counterparties" element={<CounterpartiesPage />} />
                                <Route path="defect-reasons" element={<DefectReasonsPage />} />
                                <Route path="storage-zones" element={<StorageZonesPage />} />
                                <Route path="warehouse-map/:zoneUuid" element={<WarehouseMapPage />} />
                                <Route path="pallet-types" element={<PalletTypesPage />} />
                            </Route>

                            <Route path="/technologist" element={<TechnologistLayout />}>
                                <Route index element={<Navigate to="/technologist/import" replace />} />
                                <Route path="import" element={<TechnologistImportPage />} />
                                <Route path="cutting" element={<CuttingJobsPage />} />
                                <Route path="printing" element={<PrintingJobsPage />} />
                                <Route path="lamination" element={<LaminationJobsPage />} />
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
                            <Route path="/admin" element={<AdminLayout />}>
                                <Route
                                    index
                                    element={
                                        <Navigate to="/admin/users" replace />
                                    }
                                />
                                <Route path="users" element={<UsersPage />} />
                                <Route path="roles" element={<RolesPage />} />
                                <Route path="*" element={<Navigate to="/admin/users" replace />} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
