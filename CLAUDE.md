# Notes for Claude Code sessions

- Owner: Justin Daubenmire (JDF Group). Users are Justin and his business partner, who is not technical. Keep the UI plain and fast on a phone.
- After editing anything in `src/`, run `python3 scripts/build.py`, then `python3 test/e2e.py`, then commit `private/dashboard.html` along with the source. Vercel deploys from `main` with no build step.
- Labor: only the labor percent from the sheet matters. No payroll or labor dollar analysis (owners take salaries outside labor versus sales). Labor is watched against 25% best practice for juice and smoothie franchises, 30% as the action ceiling.
- Sales goal per store is the same month last year. The scorecard has no supply or tip flags by design.
- The Orders tab: store tabs show current PAR counts only, in sheet order. Enhancers and Cookies build copyable orders. Nothing writes back to the sheets.
- Dashboard copy and replies to Justin: plain paragraphs, no hyphens, no motivational language.
- Never expose the service account key or password, never loosen the sheet allowlist in `lib/google.js`, and never serve `private/` publicly.
- Money always shows with a dollar sign, including raw sheet values in the All data tab (see `dtMoney` in `src/datatab.js`) and assistant answers.
- The Ask tab calls `/api/ask`, which needs `ANTHROPIC_API_KEY`. All math happens in `lib/tools.js`; the model only chooses lookups. Keep payroll and pay data out of the tools.
