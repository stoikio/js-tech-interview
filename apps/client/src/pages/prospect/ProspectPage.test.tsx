import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '../../lib/server-state';
import { failure, fakeApi, noContent, ok, type Reply } from '../../test/fake-api';
import { catalog, contract, draftQuote, prospectDetail } from '../../test/fixtures';
import { createQueryClient, pageWrapper } from '../../test/providers';
import { ProspectPage } from './ProspectPage';

function ContractMarker() {
  return <p>Contract page {useParams().contractId}</p>;
}

function renderProspectPage() {
  const queryClient = createQueryClient();
  render(
    <Routes>
      <Route path="/prospects" element={<p>Prospects page</p>} />
      <Route path="/prospects/:companyId" element={<ProspectPage />} />
      <Route path="/contracts/:contractId" element={<ContractMarker />} />
    </Routes>,
    { wrapper: pageWrapper(queryClient, '/prospects/company-1') },
  );
  return { queryClient, user: userEvent.setup() };
}

const premium = () => screen.getByRole('complementary', { name: 'Premium' });
const validateButton = () => within(premium()).getByRole('button', { name: 'Validate quote' });

describe('a quote with its contract', () => {
  it('is shown on the contract page', async () => {
    fakeApi({
      'GET /pricing/catalog': () => ok(catalog()),
      'GET /prospects/company-1': () =>
        ok(prospectDetail({ quote: draftQuote({ status: 'signed', contract: contract() }) })),
    });

    renderProspectPage();

    expect(await screen.findByText('Contract page contract-1')).toBeDefined();
  });
});

describe('a draft quote', () => {
  it('shows the quote and its premium', async () => {
    fakeApi({
      'GET /pricing/catalog': () => ok(catalog()),
      'GET /prospects/company-1': () => ok(prospectDetail()),
    });

    renderProspectPage();

    expect(await screen.findByText('Draft')).toBeDefined();
    expect(within(premium()).getByText('€2,000.00', { selector: 'p' })).toBeDefined();
    expect(screen.queryByText('Signed')).toBeNull();
  });

  it('says why the catalog is missing, next to the prospect', async () => {
    fakeApi({
      'GET /pricing/catalog': () => failure(400, 'No catalog'),
      'GET /prospects/company-1': () => ok(prospectDetail()),
    });

    renderProspectPage();

    expect((await screen.findByRole('alert')).textContent).toContain('No catalog');
  });

  it('is validated after confirmation, which opens the contract and forgets the prospect', async () => {
    const api = fakeApi({
      'GET /pricing/catalog': () => ok(catalog()),
      'GET /prospects/company-1': () => ok(prospectDetail()),
      'POST /quotes/quote-1/validate': () => ok(contract()),
    });
    const { queryClient, user } = renderProspectPage();
    await screen.findByText('Draft');

    await user.click(validateButton());
    const dialog = screen.getByRole('dialog', { name: 'Validate this quote?' });
    expect(api.callsTo('POST /quotes/quote-1/validate')).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Validate quote' }));

    expect(await screen.findByText('Contract page contract-1')).toBeDefined();
    expect(await screen.findByText('Quote signed')).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.prospect('company-1'))).toBeUndefined();
  });

  it('cannot be validated while a change is being saved', async () => {
    let release: (reply: Reply) => void = () => {};
    const saving = new Promise<Reply>((done) => (release = done));
    fakeApi({
      'GET /pricing/catalog': () => ok(catalog()),
      'GET /prospects/company-1': () => ok(prospectDetail()),
      'PUT /quotes/quote-1': () => saving,
    });
    const { user } = renderProspectPage();
    await screen.findByText('Draft');

    await user.click(screen.getByRole('switch', { name: 'Ransomware extortion' }));
    await waitFor(() => expect(validateButton().getAttribute('aria-disabled')).toBe('true'));
    await user.click(validateButton());
    expect(screen.queryByRole('dialog')).toBeNull();

    release(ok(draftQuote({ premiumCents: 350_000, options: ['ransomware_extortion'] })));

    await waitFor(() => expect(validateButton().getAttribute('aria-disabled')).toBe('false'));
    expect(within(premium()).getByText('€3,500.00', { selector: 'p' })).toBeDefined();
  });

  it('is deleted after confirmation, which goes back to the prospects', async () => {
    const api = fakeApi({
      'GET /pricing/catalog': () => ok(catalog()),
      'GET /prospects/company-1': () => ok(prospectDetail()),
      'DELETE /prospects/company-1': () => noContent(),
    });
    const { user } = renderProspectPage();
    await screen.findByText('Draft');

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete prospect' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this prospect?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete prospect' }));

    expect(await screen.findByText('Prospects page')).toBeDefined();
    expect(await screen.findByText('Prospect deleted')).toBeDefined();
    expect(api.callsTo('DELETE /prospects/company-1')).toHaveLength(1);
  });
});
