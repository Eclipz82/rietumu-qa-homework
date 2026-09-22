# Rietumu QA Homework

Automated tests for E-Link / E-Link PRO APIs (Task 1) and the Loan Calculator UI (Task 2),
built with Playwright + TypeScript.

## Setup

```bash
npm install
npx playwright install
cp .env.example .env
```

Requires Playwright 1.46+ (client certificates support) and Node.js.
`.env` holds sandbox credentials, tickets and the certificate path/password (see `.env.example`);
it is git-ignored, `.env.example` is the tracked template.

## Running tests

```bash
npx playwright test --project=api      # API tests
npx playwright test --project=ui       # UI tests
npx playwright show-report             # HTML report
```

Single file: `npx playwright test api-tests/tests/transactions.spec.ts --project=api`

## Project structure

```
.env.example              # template for .env (tracked; .env itself is git-ignored)
api-tests/
├── helpers/
│   ├── elink.ts          # E-Link: endpoint, credentials, tickets, callElink()
│   ├── elinkPro.ts       # E-Link PRO: endpoint, client certificate, callElinkPro(),
│   │                     #   buildPaymentXml(), registerPayment()
│   ├── env.ts            # typed access to environment variables (fails fast if missing)
│   └── xmlSign.ts        # XMLDSig signing (xml-crypto + node-forge)
└── tests/                # one spec file per API function
certs/
└── 068774.p12            # sandbox client certificate (from the assignment)
ui-tests/
├── pages/                # page objects
└── tests/
```

## API tests

| Function               | System     | Auth               | Tests         |
| ----------------------- | ---------- | ------------------- | ------------- |
| Transactions            | E-Link     | Basic Auth          | 6             |
| OutgoingPaymentDetails  | E-Link     | Basic Auth          | 6             |
| PostDocument            | E-Link PRO | client certificate  | 6 (2 `fixme`) |
| GetDocumentForSign      | E-Link PRO | client certificate  | 5             |
| PostSignedDocument      | E-Link PRO | client certificate  | 6             |

Sandbox URLs, credentials and the certificate are the public ones from the assignment
(`Information about the ELink Sandbox`), read from `.env` — nothing is hardcoded in the test code.

### What is covered

**Transactions** (E-Link)
- successful request: `code=0`, non-empty `transactions`, `more` flag
- transaction schema (field types)
- missing `rid` returns `code 4`, `error: "rid"`
- inactive ticket, invalid date format
- wrong password returns HTTP 401

**OutgoingPaymentDetails** (E-Link)
- successful request and response schema (`details` object)
- details are consistent with the same payment returned by `Transactions`
- missing `refno`, non-existent `refno`, inactive ticket

**PostDocument** (E-Link PRO)
- valid payment is registered: `IERR_OK`, `refNo` issued, `signatureRequired` contains `CER`
- missing `doc` returns `code 4`, inactive ticket returns `code 6`
- malformed XML is rejected

**GetDocumentForSign** (E-Link PRO)
- the registered document is returned (`<RefNo>` matches, status `20` / "Waiting for signature")
- returned XML contains the data that was sent in `PostDocument`
- missing `refNo`, non-existent `refNo`, inactive ticket

**PostSignedDocument** (E-Link PRO)
- full flow: `PostDocument` → `GetDocumentForSign` → sign → `PostSignedDocument` is accepted (`IERR_OK`)
- unsigned document is rejected as a parameter error (`code 4`, `error: "doc"`)
- document modified after signing is rejected as a document error (`IERR_SIG_BAD`)
- missing `refNo` / `doc`, inactive ticket

### Findings about the API behaviour

- **E-Link:** business errors are returned with **HTTP 200**; the error is in the body (`code`, `error`).
  Tests assert on `code`, not only on the HTTP status. `rid` is required for E-Link but not for E-Link PRO.
- **E-Link PRO order functions** return business errors with `code: 0`; the real result is in
  `error_code` / `error_level` / `error_field`. Parameter errors return `code: 4` with the parameter name in `error`.
- **Field naming differs between functions:** `Transactions` uses camelCase (`refno`, `benbank`),
  `OutgoingPaymentDetails` uses snake_case (`ref_no`, `bbank_name`); the parameter is `refno` in
  `OutgoingPaymentDetails` but `refNo` in the E-Link PRO order functions.
- The same payment has a negative amount in `Transactions` (`-650`) and a positive one
  in `OutgoingPaymentDetails` (`pmnt_amount: 650`).
- `PostDocument` validates the XML **structure**: omitting an optional element such as `AddInfo72`
  gives `IERR_XML`, so the test payment reproduces the full example from the documentation.
- `GetDocumentForSign` returns the document with server-added elements (`System`, `RegistrationDateTime`, `RefNo`);
  this is the XML that must be signed.
- `PostSignedDocument`: a document **without** a signature is rejected as a parameter error
  (`code 4`, `error: "doc"`); a **tampered** signed document is rejected as a document error
  (`code 0`, `IERR_SIG_BAD`, `error_level 4`).
- Signing follows the documentation: XMLDSig, enveloped, RSA-SHA1, C14N with comments,
  implemented with `xml-crypto` and `node-forge` (`helpers/xmlSign.ts`).
- Every `PostDocument` call registers a new document with a new `refNo`, so the tests are not idempotent.
- Credentials, tickets and the certificate path/password are read from environment variables
  (`helpers/env.ts`), not hardcoded, so the same code works against a different sandbox by only changing `.env`.

## Known limitations of the sandbox / not covered

- **`Transactions`:** the sandbox ignores `dateFrom` / `dateTill`. Any period returns the same two
  transactions from 2015-06-15. The test "empty period returns an empty list" is marked `test.fixme`.
- **`PostDocument`:** the sandbox does not validate payment content. An empty beneficiary name and a
  non-existent currency (`XXX`) are accepted with `IERR_OK` and a `refNo` is issued. The two related
  tests (expected: `error_level 4` and the offending field in `error_field`) are marked `test.fixme`.
- Pagination (`trnID`, `more`) is not tested: the sandbox returns everything on one page (`more: false`).
- ISO 20022 format is not supported in the sandbox (per the assignment), so it is not covered.
- Authorization (wrong password → 401) is verified once, in `Transactions`, because all E-Link
  functions share the same Basic Auth.

## UI tests

Target: Loan Calculator on https://www.rietumu.com/en/person/funding/funding-latvia
(Mortgage in Latvia). Tests use the Page Object pattern.

```bash
npx playwright test --project=ui
```

### Structure

- `ui-tests/pages/loanCalculatorPage.ts`: page object `LoanCalculatePage`
  - locators for the calculator fields (`#summa`, `#period1`, `#period`, `#rate`), repayment type radios,
    the "Monthly Repayment" row, the "Show table" button and the schedule table
  - `goto()`, `acceptCookies()`, `fillCalculator({...})`
  - `getMonthlyRepayment()`: waits until a number appears in the result row and parses it,
    so tests do not depend on fixed timeouts
- `ui-tests/tests/loanCalculator.spec.ts`: test scenarios

### What is covered

| Test | Description |
|------|-------------|
| Navigation | From the home page: Private → Lending → Mortgage in Latvia; URL and the calculator are displayed |
| UI elements | Amount, period (years / months) and interest rate fields are visible; by default **Variable** is checked, **Equal** is not |
| Switching repayment type | Variable → Equal → Variable recalculates the monthly repayment |
| Repayment schedule | "Show table" opens the schedule table |
| Monthly repayment (data-driven, 3 cases) | Calculated value for several combinations of period and repayment type |

Data-driven cases (amount 200000, rate 5%):

| Period | Type | Expected monthly repayment |
|--------|------|----------------------------|
| 15 y 0 m | Equal | 1581.59 |
| 10 y 0 m | Equal | 2121.31 |
| 15 y 0 m | Variable | 1944.44 (first payment) |

Expected values are computed with the standard formulas: for the variable type the first payment
is `amount / months + amount * rate / 12`; for the equal type it is the annuity payment. Amounts are
compared with `toBeCloseTo(expected, 1)` (tolerance 0.05) to avoid failures from rounding.

### Design notes

- By default the calculator has the **Variable** repayment type selected, not Equal — verified
  against the live site rather than assumed.
- Result values are read with `expect.poll`, because the calculator recalculates asynchronously after input.
- The cookie banner is accepted in every test via `acceptCookies()`, so tests are independent of each other.
- Test data is kept in a `cases` array; adding a scenario means adding one object.

### Known limitations / not covered

- The tests run against the live public website, so they depend on its availability and layout.
  Locators are based on element ids (`#summa`, `#rate`, ...), which may change.
- Not covered: validation of invalid input (empty, negative, non-numeric values), maximum/minimum limits,
  the content of the repayment schedule (row values and totals), other languages (RU / LV), mobile viewport.