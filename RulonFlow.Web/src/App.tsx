import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import HomePage from './pages/HomePage';
import ComingSoonPage from './pages/ComingSoonPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import FilmTypesPage from './pages/FilmTypesPage';
import { Navigate } from 'react-router-dom';
import DictionaryLayout from './pages/dictionaries/DictionaryLayout';
import SuppliersPage from './pages/SuppliersPage';
import DefectReasonsPage from './pages/DefectReasonsPage';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />

                    <Route path="/dictionaries" element={<DictionaryLayout />}>
                        <Route index element={<Navigate to="/dictionaries/film-types" replace />} />
                        <Route path="film-types" element={<FilmTypesPage />} />
                        <Route path="suppliers" element={<SuppliersPage />} />
                        <Route path="counterparties" element={<CounterpartiesPage />} />
                        <Route path="defect-reasons" element={<DefectReasonsPage />} />
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
            </Routes>
        </BrowserRouter>
    );
}