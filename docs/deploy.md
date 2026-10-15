# Putting Ice Realm online

There are three ways to let anyone open Ice Realm: free hosting on GitHub Pages and Render, a quick link from your Mac for demos, and paid hosting that stays online and keeps bookings.

## Free hosting: GitHub Pages + Render

This is how the live site runs, at **https://the-ice-realm.github.io**. It costs nothing and needs no card.

- **The website** is on GitHub Pages. `.github/workflows/pages.yml` builds `frontend-next` on every push to `main` and publishes it.
- **The Java API** is on Render's free plan at `https://icerealm.onrender.com`. `render.yaml` describes it, and Render builds the `Dockerfile` on every push.
- The website calls the API through `VITE_API_BASE`. If Render ever gives the service a different address, set the repository variable `ICE_REALM_API` (Settings → Secrets and variables → Actions → Variables) and re-run the workflow.

Limits of the free plans:
- Render puts the server to sleep after 15 minutes without visitors. The next visit takes a minute or two, and the site shows a "waking up" message meanwhile. Open it a few minutes before a demo.
- There's no permanent disk, so bookings reset whenever the server restarts or sleeps. The sample grounds come back automatically.

### Setting it up again from scratch

1. On GitHub, create the free organisation `The-ICE-REALM` and a **public** repository `the-ice-realm.github.io`. Push this folder to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow publishes the site.
3. Sign in to render.com with GitHub. Choose **New → Blueprint**, pick the repository, enter the staff code for `ICE_REALM_ADMIN_TOKEN`, and click **Apply**.

### Updating the live site

```bash
cd ~/ice-realm
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages and Render both rebuild on their own.

## Quick link from your Mac (free)

Cloudflare Tunnel gives your Mac's site a public `https://…trycloudflare.com` address. It works while your Mac is awake and the backend is running, and the address changes each time you start it.

1. Start the backend:
   ```bash
   cd ~/ice-realm/backend
   ./mvnw spring-boot:run
   ```
2. In a second Terminal window, start the tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
3. Copy the `https://…trycloudflare.com` address it prints and share it. Press Ctrl+C in that window to take the site offline again.

The staff page is the same address with `/admin` on the end. Its code is in `backend/secrets.yml`.

## Hosting that stays online (Railway)

Railway builds the `Dockerfile` in this folder and runs it, with a disk that keeps your bookings. It costs about US$5 a month on the Hobby plan.

You need a free GitHub account and a Railway account (sign in to railway.com with GitHub).

### 1. Put the code on GitHub

1. On github.com, create a **private** repository named `ice-realm`, without a README.
2. In Terminal:
   ```bash
   cd ~/ice-realm
   git init
   git add .
   git commit -m "Ice Realm"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ice-realm.git
   git push -u origin main
   ```
   `.gitignore` keeps installed packages, build output, your local database and `backend/secrets.yml` out of GitHub.

### 2. Deploy on Railway

1. In Railway, choose **New Project → Deploy from GitHub repo** and pick `ice-realm`. Railway finds the Dockerfile and builds it. The first build takes several minutes.
2. Add a **volume** to the service and set its mount path to `/data`. This is where the database lives, so bookings survive restarts and updates.
3. Under **Variables**, add `ICE_REALM_ADMIN_TOKEN` with a private staff code. The app won't start without it.
4. Under **Networking**, generate a domain. Railway gives you an `https://…up.railway.app` address that anyone can open.

The first start fills the database with the sample grounds, just as it does on your Mac.

### 3. Your own domain (optional)

Buy a domain such as `icerealm.in` (about ₹700 a year from Hostinger, GoDaddy or Cloudflare). In Railway, add it as a custom domain under **Networking**, then add the DNS record Railway shows you at your domain provider.

### Updating the live site

Change the code, then:

```bash
cd ~/ice-realm
git add .
git commit -m "Describe the change"
git push
```

Railway rebuilds and redeploys on every push.

## Before real customers pay

| What | Where |
|---|---|
| UPI ID that receives payments | `app.upi.vpa` in `backend/src/main/resources/application.yml` |
| Staff code | `ICE_REALM_ADMIN_TOKEN` on the host; `backend/secrets.yml` on your Mac |
| Real grounds, prices and photos | `backend/.../config/DataSeeder.java`, and photos in `frontend-next/src/assets/arenas/` |

The staff page uses one shared code rather than separate staff accounts, and nothing yet stops someone from holding many slots at once. Both are fine for a demo; for a real business, add Spring Security logins and a limit on unpaid holds per phone number.
