# RepoWatch [![starline](https://raw.githubusercontent.com/ScottKirvan/RepoWatch/refs/heads/starlines/ScottKirvan/RepoWatch/starline.svg)](https://github.com/qoomon/starlines)
<div align="center">

  <img src="assets/media/logo.jpg" alt="logo" width="200" height="auto" />
    <h1><a href="https://github.com/ScottKirvan/RepoWatch">ScottKirvan/RepoWatch</a></h1>
  <h3>GitHub repo health at a glance — no login required for public repos</h3>
  
  
<!-- Badges -->
<p>
  <a href="https://github.com/ScottKirvan/RepoWatch/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/ScottKirvan/RepoWatch" alt="contributors" />
  </a>
  <a href="">
    <img src="https://img.shields.io/github/last-commit/ScottKirvan/RepoWatch" alt="last update" />
  </a>
  <a href="https://github.com/ScottKirvan/RepoWatch/network/members">
    <img src="https://img.shields.io/github/forks/ScottKirvan/RepoWatch" alt="forks" />
  </a>
  <a href="https://github.com/ScottKirvan/RepoWatch/stargazers">
    <img src="https://img.shields.io/github/stars/ScottKirvan/RepoWatch" alt="stars" />
  </a>
  <a href="https://github.com/ScottKirvan/RepoWatch/issues/">
    <img src="https://img.shields.io/github/issues/ScottKirvan/RepoWatch" alt="open issues" />
  </a>
  <a href="https://github.com/ScottKirvan/RepoWatch/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/ScottKirvan/RepoWatch.svg" alt="license" />
  </a>
  <a href="https://discord.gg/TN6XJSNK5Y">
    <!--<img src="https://img.shields.io/discord/704680098577514527?style=flat-square&label=%F0%9F%92%AC%20discord&color=00ACD7">-->
    <img src="https://img.shields.io/discord/1052011377415438346?style=flat-square&label=discord&color=00ACD7">
  </a>
</p>
   
<h4>
    <a href="https://tinyurl.com/3vf7whyd">View Demo</a>
  <span> · </span>
    <a href="https://github.com/ScottKirvan/RepoWatch/blob/main/README.md">Documentation</a>
  <span> · </span>
    <a href="https://github.com/ScottKirvan/RepoWatch/issues/new?template=bug_report.md">Report Bug</a>
  <span> · </span>
    <a href="https://github.com/ScottKirvan/RepoWatch/issues/new?template=feature_request.md">Request Feature</a>
  </h4>
</div>

**RepoWatch** is a single-page developer dashboard for monitoring GitHub repositories. Open `index.html` in any browser, see every repo's last commit, latest release, open PRs, and open issues in one sortable table. External contributor activity is called out with attention badges so you know what needs a response without clicking around GitHub.

## Features

- **No auth required for public repos** — loads real data from the GitHub API immediately, no login, no setup
- **PAT optional** — add a GitHub personal access token in Settings to unlock traffic data (views/clones) and private repos; also required once you exceed ~15 public repos (unauthenticated API limit is 60 requests/hour, 4 per repo)
- **Traffic chart** — 14-day area chart with logarithmic time axis (recent days expanded) and square-root value scale
- **Attention badges** — one row for open PRs, one row for open Issues; only repos with external contributor activity appear; each badge links to the filtered GitHub page
- **Sortable table** — click any column header (Repo, Last Push, PRs, Issues) to sort; default is oldest push first
- **Version + release date** — shown under repo name so you can track what shipped and when
- **Mobile-friendly** — compact layout, no sidebars

## Installation

RepoWatch is a static HTML file — no build step, no dependencies, no server.

**Hosted (GitHub Pages):**  
Visit [scottkirvan.github.io/RepoWatch](https://scottkirvan.github.io/RepoWatch/) — no install needed.

**Self-hosted:**  
1. Download `index.html`
2. Open it in any browser

**Fork and host your own:**  
Fork the repo and enable GitHub Pages (Settings → Pages → Branch: `main`, folder: `/`).

## Usage

1. Open the dashboard
2. Enter a GitHub username or org in the **Settings** panel
3. Add repos in `owner/repo` format, one per line
4. Optionally add a [GitHub PAT](https://github.com/settings/tokens) — see **GitHub PAT** below
5. Click **Load** — data loads from the GitHub API and displays immediately
6. Click any column header to re-sort the table
7. Click a PR or Issue count to open the filtered GitHub page
8. Click the traffic chart area to (eventually) open a detail view

## GitHub PAT

A personal access token is optional for public repos but recommended if you have more than ~15 repos (unauthenticated requests are capped at 60/hour; each repo costs 4).

**When you need a PAT:**
- More than ~15 public repos in your list
- Any private repos
- Traffic data (views/clones chart) — requires push access to each repo
- Org repos protected by SAML SSO — the PAT must be authorized for that org

**Creating a PAT:**

*Classic PAT* (simpler): [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) → select `repo` scope.

*Fine-grained PAT* (more secure): [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (fine-grained) → select repositories → grant **Contents: Read**, **Metadata: Read**, and **Administration: Read** (needed for traffic).

The PAT is stored only in your browser's `localStorage` and is sent only to `api.github.com`. It is never transmitted anywhere else.

Contributions / Contact
-----------------------
- Please [file an issue](https://github.com/ScottKirvan/RepoWatch/issues/new), or [grab a fork](https://github.com/ScottKirvan/RepoWatch/fork), hack away, and submit a [pull request](https://github.com/ScottKirvan/RepoWatch/pulls).
- Contact me at [linkedin.com/in/scottkirvan/](https://www.linkedin.com/in/scottkirvan/)
- You can also contact me at my [discord](https://discord.gg/TN6XJSNK5Y) server, I'm cptvideo.

Credits
-------
**[RepoWatch](https://github.com/ScottKirvan/RepoWatch)** — Copyright (c) 2025 [Scott Kirvan](https://github.com/ScottKirvan). [MIT License](LICENSE.md).

Project Link:  [RepoWatch](https://github.com/ScottKirvan/RepoWatch)  
[CHANGELOG](notes/CHANGELOG.md)  
[TODO](notes/TODO.md)
