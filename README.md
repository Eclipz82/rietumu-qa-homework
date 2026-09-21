# Rietumu QA Homework

Automated tests for E-Link / E-Link PRO APIs (Task 1) and the Loan Calculator UI (Task 2),
built with Playwright + TypeScript.

## Setup

```bash
npm install
npx playwright install
```

Requires Playwright 1.46+ (client certificates support)
```bash
npm i -D xml-crypto@^6 node-forge @types/node-forge 
```

## Running tests

```bash
npx playwright test --project=api      # API tests
npx playwright test --project=ui       # UI tests
npx playwright show-report             # HTML report
```

## Project structure

```
api-tests/
├── helpers/
│   ├── elink.ts         # E-Link: endpoint, credentials, tickets, callElink()
│   ├── elinkPro.ts      # E-Link PRO: endpoint, client certificate, callElinkPro(),
│   │                    #   buildPaymentXml(), registerPayment()
│   └── xmlSign.ts       # XMLDSig signing (xml-crypto + node-forge)
└── tests/               # one spec file per API function
certs/
└── 068774.p12           # sandbox client certificate (from the assignment)
ui-tests/
├── pages/               # page objects
└── tests/
```

## API tests

Sandbox: https://test-elink.rietumu.lv/TCatBox/elink/process.json (Basic Auth, credentials from the sandbox description).

| Function | System | Auth | Tests |
|----------|--------|------|-------|
| Transactions | E-Link | Basic Auth | 7 (1 `fixme`) |
| OutgoingPaymentDetails | E-Link | Basic Auth | 6 |
| PostDocument | E-Link PRO | client certificate | 6 (2 `fixme`) |
| GetDocumentForSign | E-Link PRO | client certificate | 5 |
| PostSignedDocument | E-Link PRO | client certificate | 6 |


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
- unsigned document is rejected
- document modified after signing is rejected (`IERR_SIG_BAD`)
- missing `refNo` / `doc`, inactive ticket

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
- TODO: anything else you found while running the tests.

## UI tests