# Stoïk Lite

Brokers use Stoïk Lite to quote cyber insurance for companies and turn those quotes into contracts.

## Language

### People

**Broker**:
A person who creates prospects, configures quotes and validates them. There is no login: whoever uses the app is a broker.
_Avoid_: Agent, user

**Company**:
The business being quoted or insured.
_Avoid_: Customer, account, insured

**Prospect**:
A company whose latest quote is a draft: it has not signed yet. Created together with its first draft quote, from a name and a turnover.
_Avoid_: Lead, opportunity

**Client**:
A company whose latest quote is signed. Clients appear with the contracts, not with the prospects.

**Turnover**:
A company's yearly revenue. Brokers pick it from turnover brackets, which match the revenue bands of the pricing rules.
_Avoid_: Annual revenue, sales

### Quoting

**Quote**:
A priced offer for a company: a coverage limit, a deductible and a set of options. A quote is either draft or signed.
_Avoid_: Proposal, offer, estimate

**Draft quote**:
A quote the broker can still change. Its premium is recomputed on every change.

**Signed quote**:
A quote the broker validated. It became a contract and can no longer change.
_Avoid_: Converted, accepted, bound

**Validate**:
The broker action that signs a draft quote and creates its contract. A draft quote can be validated as soon as it is priced.
_Avoid_: Bind, convert, accept, issue

**Coverage limit**:
The most the contract pays out over its whole period.
_Avoid_: Cover amount, sum insured, ceiling

**Deductible**:
The part of each loss the company pays itself before the contract pays. A higher deductible means a lower premium.
_Avoid_: Excess, franchise

**Option**:
An optional coverage extension (ransomware extortion, social engineering fraud, business interruption, regulatory fines & penalties). Each selected option adds a loading.
_Avoid_: Add-on, rider, guarantee

### Pricing

**Premium**:
The yearly amount the company pays for its insurance, in euros.
_Avoid_: Price, cost, rate

**Pricing rules**:
The revenue bands, factors and loadings the premium is computed from.
_Avoid_: Rate card, tariff

**Revenue band**:
A range of turnover with its own base premium. The highest band sets the maximum eligible turnover (50M EUR).

**Base premium**:
The premium of the company's revenue band, before any factor is applied.

**Factor**:
A multiplier applied to the base premium for the chosen coverage limit or deductible.

**Loading**:
A percentage added to the premium for a selected option.
_Avoid_: Surcharge, markup

**Base cover**:
The part of the premium for the coverage limit and deductible: the base premium multiplied by their factors.

**Pricing breakdown**:
The base cover and the price of each option, which add up to the premium, with the factors that produced them.

### Contracts

**Contract**:
A signed quote: the insurance contract of a company for 12 months, starting the day the quote is validated. Its terms and premium are copied from the quote. A contract has no status.
_Avoid_: Policy, coverage
