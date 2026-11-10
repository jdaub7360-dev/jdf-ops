# JDF Group operations dashboard

Live dashboard for the three Pulp Juice and Smoothie Bar stores (Ashland, Wadsworth, Massillon). Reads the company Google Sheets through a service account, behind one shared password. Hosted on Vercel at ops.thejdfgroup.com.

## How it fits together

- `src/` holds the dashboard source: parsing and calculation (`engine*.js`), one file per area of the UI, `shim.js` (turns the dashboard's data calls into polling calls to this site), and sample data (`fixtures.json`) used for the snapshot shown if Google cannot be reached.
- `scripts/build.py` assembles `src/` into `private/dashboard.html`. **Run it and commit the result after any change in `src/`.**
- `api/app.js` serves the login page, or the dashboard once the visitor has a valid session cookie. The dashboard HTML is never served publicly.
- `api/login.js` checks the shared password, with a lockout after 5 wrong tries in 15 minutes. `api/sheets.js` and `api/meta.js` read Google, and only for the nine sheets listed in `lib/google.js`.
- Refresh is polling, not push: sales and labor about every 30 seconds, the rest every one to five minutes.

## Develop and test

```
npm install
python3 scripts/build.py
python3 test/e2e.py     # runs the real routes against sample data, needs Chrome
```

See `SETUP.md` for first time deployment.
