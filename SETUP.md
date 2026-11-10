# Setup, one time

You do these once. After that nobody needs a Google account to use the dashboard.

## 1. Google service account (about 10 minutes)

1. Go to console.cloud.google.com and create a project named `jdf-ops`.
2. In APIs and Services, Library, enable **Google Sheets API** and **Google Drive API**.
3. In APIs and Services, Credentials, Create credentials, **Service account**. Name it `jdf-dashboard`. Skip the optional role steps.
4. Open the new service account, Keys, Add key, Create new key, **JSON**. A file downloads. Treat it like a password. Do not paste it into chat or commit it.
5. Copy the service account email (it looks like `jdf-dashboard@jdf-ops.iam.gserviceaccount.com`).
6. Open each of the nine sheets listed in `lib/google.js` and Share them with that email as **Viewer**: Monthly Sales Report, Monthly LvsS Report, Sysco / Daily Numbers Log, Daily Tip Count, Enhancer Order / Inventory, Cookie Order / Inventory, and the three PAR sheets (Ashland, Wadsworth, Massillon).

## 2. Supabase (login lockout)

Open the SQL editor in a Supabase project and run `supabase.sql`. Then copy the project URL and the **service_role** key from Project Settings, API.

## 3. Vercel

1. Add New Project, import `jdf-ops` from GitHub. Framework preset: **Other**. Leave build and output settings empty.
2. Before the first deploy, add these Environment Variables (Production):

| Name | Value |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | the whole contents of the downloaded key file, pasted as one value |
| `APP_PASSWORD` | the shared password. Use a long passphrase, four or more random words |
| `SESSION_SECRET` | a random string of 32 or more characters (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | optional, turns on the Ask tab. Create it in the Anthropic Console (console.anthropic.com), API keys. Billed per question, separate from a Claude subscription |
| `ANTHROPIC_MODEL` | optional, defaults to `claude-sonnet-5-5` |
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | the Supabase service_role key |

3. Deploy. Open the `.vercel.app` address, sign in, and confirm every status chip at the top says live.

## 4. Domain

In Vercel, Project, Settings, Domains, add `ops.thejdfgroup.com`. Vercel shows a CNAME target. In GoDaddy, DNS for thejdfgroup.com, add a CNAME record: Name `ops`, Value the target Vercel shows. HTTPS is issued automatically within a few minutes.

## Changing the password

Change `APP_PASSWORD` in Vercel, then redeploy. To sign everyone out on every device, change `SESSION_SECRET` and redeploy.
