# Rietumu QA Homework

Automated tests for E-Link / E-Link PRO APIs (Task 1) and the Loan Calculator UI (Task 2),
built with Playwright + TypeScript.

## Setup

```bash
npm install
npx playwright install
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
├── helpers/elink.ts     # shared constants (endpoint, credentials, tickets) and callElink()
└── tests/               # one file per API function test
ui-tests/
├── pages/               # page objects
└── tests/
```

## API tests

Sandbox: https://test-elink.rietumu.lv/TCatBox/elink/process.json (Basic Auth, credentials from the sandbox description).

| Function | System | Tests |
|----------|--------|-------|
| GetDocumentForSign | E-Link PRO | TODO |
| OutgoingPaymentDetails | E-Link | 6 |
| PostDocument | E-Link PRO | TODO |
| PostSignedDocument | E-Link PRO | TODO |
| Transactions | E-Link | 6 |



### What is covered

**Transactions**
- successful request (`code=0`, non-empty `transactions`) and transaction schema
- missing `rid` returns `code 4`
- inactive ticket, invalid date format
- wrong password returns HTTP 401

**OutgoingPaymentDetails**
- successful request and response schema
- details are consistent with the same payment returned by `Transactions`
- missing `refno`, non-existent `refno`, inactive ticket

**E-Link PRO:** TODO

## Notes

- Authorization is verified once (in `Transactions`), because all E-Link functions share the same Basic Auth.
- Repeated values (endpoint, credentials, tickets) live in `helpers/elink.ts`.