import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { failure, fakeApi, ok } from '../test/fake-api';
import { company, contract } from '../test/fixtures';
import { createQueryClient, pageWrapper } from '../test/providers';
import { ContractPage } from './contract/ContractPage';
import { NewProspectDialog } from './NewProspectDialog';

// Every page that needs the pricing catalog says when it cannot get it.

describe('when the pricing catalog cannot be loaded', () => {
  it('the new prospect dialog says so, instead of offering an empty turnover', async () => {
    fakeApi({ 'GET /pricing/catalog': () => failure(503, 'The pricing catalog is unavailable') });

    render(<NewProspectDialog open onClose={() => {}} />, {
      wrapper: pageWrapper(createQueryClient()),
    });

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The pricing catalog is unavailable',
    );
  });

  it('the contract page still shows the contract, and says so', async () => {
    fakeApi({
      'GET /pricing/catalog': () => failure(503, 'The pricing catalog is unavailable'),
      'GET /contracts/contract-1': () => ok({ ...contract(), company: company() }),
    });

    render(
      <Routes>
        <Route path="/contracts/:contractId" element={<ContractPage />} />
      </Routes>,
      { wrapper: pageWrapper(createQueryClient(), '/contracts/contract-1') },
    );

    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeDefined();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'The pricing catalog is unavailable',
    );
    // Without the catalog, the turnover is shown as an amount.
    expect(screen.getByText('€1,000,000.00')).toBeDefined();
  });
});
