import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppShell } from './layout/AppShell';
import { ContractPage } from './pages/contract/ContractPage';
import { ContractsPage } from './pages/ContractsPage';
import { ProspectPage } from './pages/prospect/ProspectPage';
import { ProspectsPage } from './pages/ProspectsPage';
import { Toolbox } from './toolbox/Toolbox';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/prospects" replace />} />
          <Route path="/prospects" element={<ProspectsPage />} />
          <Route path="/prospects/:companyId" element={<ProspectPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:contractId" element={<ContractPage />} />
        </Route>
      </Routes>
      <Toolbox />
    </BrowserRouter>
  );
}
