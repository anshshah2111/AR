/* India–USA Performing Arts Initiative — SPA router & views */
(() => {
  "use strict";

  // --------- helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const view = $("#view");
  const sidebar = $("#sidebar");
  const navToggle = $("#navToggle");

  const CONTENT_BASE = "content/";
  const DATA_BASE = "data/";

  // Cache fetches so route changes don't refetch constantly
  const cache = new Map();
  async function fetchText(url) {
    if (cache.has(url)) return cache.get(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const text = await res.text();
    cache.set(url, text);
    return text;
  }
  async function fetchJSON(url) {
    const t = await fetchText(url);
    return JSON.parse(t);
  }

  function renderMarkdown(md) {
    if (!window.marked) return `<pre>${esc(md)}</pre>`;
    marked.setOptions({ breaks: false, gfm: true });
    // Rewrite inter-doc links like (02-city-decision.md) -> (#/city-analysis)
    const mdSlugToRoute = {
      "01-executive-summary.md": "#/",
      "02-city-decision.md": "#/city-analysis",
      "03-sponsor-structures.md": "#/sponsor-structures",
      "04-consulate-programs.md": "#/programs",
      "05-precedents.md": "#/precedents",
      "06-stakeholder-map.md": "#/stakeholders",
      "07-pilot-festival-concept.md": "#/concept",
      "08-funding-stack.md": "#/funding",
      "09-p3-visa-playbook.md": "#/visa-playbook",
      "10-timeline.md": "#/timeline",
      "11-open-questions.md": "#/open-questions",
      "12-outreach-templates.md": "#/outreach",
      "13-seattle-local-advantages.md": "#/seattle-playbook"
    };
    const rewritten = md.replace(/\(([01]\d-[a-z0-9-]+\.md)\)/g, (_, file) =>
      `(${mdSlugToRoute[file] || `${CONTENT_BASE}${file}`})`
    );
    return marked.parse(rewritten);
  }

  function loading() { view.innerHTML = `<div class="loading">Loading…</div>`; }
  function errorBox(msg) {
    view.innerHTML = `<div class="panel"><h3>Something went wrong</h3><p>${esc(msg)}</p></div>`;
  }

  function prioClass(p) {
    if (!p) return "tag";
    const s = String(p).toLowerCase();
    if (s.includes("high")) return "prio-pill prio-high";
    if (s.includes("med")) return "prio-pill prio-medium";
    return "prio-pill prio-low";
  }

  function emailLink(addr, subj) {
    if (!addr || !/@/.test(addr)) return esc(addr || "");
    const href = `mailto:${addr}?subject=${encodeURIComponent(subj || "India–USA Performing Arts Initiative")}`;
    return `<a class="email" href="${href}">${esc(addr)}</a>`;
  }

  // --------- views ----------
  async function renderHome() {
    loading();
    const [md, programs, consulates, stakeholders, funding, timeline] = await Promise.all([
      fetchText(CONTENT_BASE + "01-executive-summary.md"),
      fetchJSON(DATA_BASE + "programs.json"),
      fetchJSON(DATA_BASE + "consulates.json"),
      fetchJSON(DATA_BASE + "stakeholders.json"),
      fetchJSON(DATA_BASE + "funding-sources.json"),
      fetchJSON(DATA_BASE + "timeline.json"),
    ]);

    const kpiHTML = `
      <div class="kpi-row">
        <div class="kpi"><div class="label">Timeline</div><div class="value">6 mo</div><div class="note">Pilot to inaugural event</div></div>
        <div class="kpi"><div class="label">Consulates in scope</div><div class="value">${consulates.consulates.length}</div><div class="note">Seattle · SF · LA · Embassy DC</div></div>
        <div class="kpi"><div class="label">Programs cataloged</div><div class="value">${programs.programs.length}</div><div class="note">Filterable catalog</div></div>
        <div class="kpi"><div class="label">Milestones</div><div class="value">${timeline.milestones.length}</div><div class="note">Across 5 phases</div></div>
      </div>`;

    const tier1Stake = stakeholders.stakeholders.filter(s => s.tier === 1).slice(0, 4);
    const topPrograms = programs.programs
      .slice()
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
      .slice(0, 4);
    const topFunders = (funding.fundingSources || []).slice(0, 4);

    const dashHTML = `
      <div class="dash-grid">
        <div class="dash-card">
          <h3>Top consulate programs</h3>
          <ul>${topPrograms.map(p => `<li><strong>${esc(p.name)}</strong> — <span class="tag">${esc(p.operator || "")}</span></li>`).join("")}</ul>
          <div class="cta"><a href="#/programs">See full programs catalog →</a></div>
        </div>
        <div class="dash-card">
          <h3>Priority stakeholders (Tier 1)</h3>
          <ul>${tier1Stake.map(s => `<li><strong>${esc(s.name)}</strong> — ${esc(s.role || "")}, ${esc(s.organization || "")}</li>`).join("")}</ul>
          <div class="cta"><a href="#/stakeholders">Open stakeholder directory →</a></div>
        </div>
        <div class="dash-card">
          <h3>Funding stack at-a-glance</h3>
          <ul>${topFunders.map(f => `<li><strong>${esc(f.name)}</strong> — ${esc(f.rangeUSD || "")} · <span class="tag">${esc(f.probability || "")}</span></li>`).join("")}</ul>
          <div class="cta"><a href="#/funding">See funding stack →</a></div>
        </div>
        <div class="dash-card">
          <h3>Next 4 weeks</h3>
          <ul>${timeline.milestones.filter(m => m.week <= 2).slice(0, 5).map(m => `<li>W${m.week} — ${esc(m.action)}</li>`).join("")}</ul>
          <div class="cta"><a href="#/timeline">Open full timeline →</a></div>
        </div>
      </div>`;

    view.innerHTML = `
      <section class="hero">
        <div class="eyebrow">Research Dossier · Pilot Year Plan</div>
        <h1>India–USA Cultural Performing Arts Initiative</h1>
        <p>Seattle-led bi-coastal pilot festival of Indian performing arts — with a flagship Bay Area evening event in Year 1, expanding to tri-coastal programming (Seattle · SF Bay Area · LA) in Year 2.</p>
      </section>
      ${kpiHTML}
      ${dashHTML}
      <hr/>
      ${renderMarkdown(md)}
    `;
  }

  async function renderMarkdownPage(file) {
    loading();
    try {
      const md = await fetchText(CONTENT_BASE + file);
      view.innerHTML = renderMarkdown(md);
    } catch (e) { errorBox(e.message); }
  }

  async function renderPrograms() {
    loading();
    const [data, consulates] = await Promise.all([
      fetchJSON(DATA_BASE + "programs.json"),
      fetchJSON(DATA_BASE + "consulates.json"),
    ]);
    const programs = data.programs || [];
    const operators = Array.from(new Set(programs.map(p => p.operator).filter(Boolean))).sort();
    const categories = Array.from(new Set(programs.map(p => p.category).filter(Boolean))).sort();

    view.innerHTML = `
      <h1>Consulate &amp; Cultural Programs Catalog</h1>
      <p>Filterable index of every program that could support Indian artists traveling to the US or collaborating with US institutions. Ranked by fit for this initiative.</p>
      <div class="filter-bar">
        <input type="search" id="p-q" placeholder="Search programs…" />
        <select id="p-op"><option value="">All operators</option>${operators.map(o => `<option>${esc(o)}</option>`).join("")}</select>
        <select id="p-cat"><option value="">All categories</option>${categories.map(c => `<option>${esc(c)}</option>`).join("")}</select>
        <select id="p-feas">
          <option value="">Any feasibility</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span class="count" id="p-count"></span>
      </div>
      <div class="card-grid" id="p-grid"></div>
    `;

    function card(p) {
      const tags = [];
      if (p.operator) tags.push(`<span class="tag navy">${esc(p.operator)}</span>`);
      if (p.category) tags.push(`<span class="tag">${esc(p.category)}</span>`);
      if (p.feasibilityForUs) tags.push(`<span class="tag saffron">feasibility: ${esc(p.feasibilityForUs)}</span>`);
      const prio = p.priority ? `<span class="${prioClass(p.priority <= 2 ? "high" : p.priority <= 4 ? "med" : "low")}">Priority ${p.priority}</span>` : "";
      const how = Array.isArray(p.howToApply) ? `<ol>${p.howToApply.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
      const covers = Array.isArray(p.covers) ? `<ul>${p.covers.map(s => `<li>${esc(s)}</li>`).join("")}</ul>` : esc(p.covers || "");
      const url = p.applicationUrl ? `<a href="${esc(p.applicationUrl)}" target="_blank" rel="noopener">Apply / more info ↗</a>` : "";
      return `
        <div class="card">
          <div class="title">${esc(p.name)} ${prio}</div>
          <div class="sub">${esc(p.operator || "")}</div>
          <div class="tags">${tags.join("")}</div>
          <div class="body">${esc(p.what || "")}</div>
          <dl class="kv">
            ${p.eligibility ? `<dt>Eligibility</dt><dd>${esc(p.eligibility)}</dd>` : ""}
            ${p.timeline ? `<dt>Timeline</dt><dd>${esc(p.timeline)}</dd>` : ""}
            ${p.contact ? `<dt>Contact</dt><dd>${esc(p.contact)}</dd>` : ""}
            ${covers ? `<dt>Covers</dt><dd>${covers}</dd>` : ""}
            ${how ? `<dt>How to apply</dt><dd>${how}</dd>` : ""}
          </dl>
          ${p.notes ? `<div class="body"><em>${esc(p.notes)}</em></div>` : ""}
          <div>${url}</div>
        </div>`;
    }

    const grid = $("#p-grid"), count = $("#p-count");
    const q = $("#p-q"), op = $("#p-op"), cat = $("#p-cat"), feas = $("#p-feas");

    function apply() {
      const ql = q.value.toLowerCase().trim();
      const opv = op.value, cv = cat.value, fv = feas.value.toLowerCase();
      const filtered = programs.filter(p => {
        if (opv && p.operator !== opv) return false;
        if (cv && p.category !== cv) return false;
        if (fv && !(p.feasibilityForUs || "").toLowerCase().includes(fv)) return false;
        if (!ql) return true;
        const blob = [p.name, p.what, p.operator, p.category, p.eligibility, p.notes, p.timeline].join(" ").toLowerCase();
        return blob.includes(ql);
      }).sort((a, b) => (a.priority || 99) - (b.priority || 99));
      count.textContent = `${filtered.length} of ${programs.length} programs`;
      grid.innerHTML = filtered.map(card).join("") || `<div class="panel">No programs match these filters.</div>`;
    }
    [q, op, cat, feas].forEach(el => el.addEventListener("input", apply));
    apply();
  }

  async function renderConsulates() {
    loading();
    const data = await fetchJSON(DATA_BASE + "consulates.json");
    const cards = (data.consulates || []).map(c => {
      const track = (c.culturalProgrammingTrackRecord || []).map(t => `<li>${esc(t)}</li>`).join("");
      const partners = (c.keyPartners || []).map(t => `<span class="tag">${esc(t)}</span>`).join(" ");
      const jur = Array.isArray(c.jurisdiction) ? c.jurisdiction.join(", ") : (c.jurisdiction || "");
      return `
        <div class="card">
          <div class="title">${esc(c.name)} <span class="${prioClass(c.priority || "")}">${esc(c.priority || "")}</span></div>
          <div class="sub">${esc(c.consulGeneral || "")} · est. ${esc(c.established || "")}</div>
          <dl class="kv">
            ${c.address ? `<dt>Address</dt><dd>${esc(c.address)}</dd>` : ""}
            ${c.phone ? `<dt>Phone</dt><dd>${esc(c.phone)}</dd>` : ""}
            ${c.contactEmail ? `<dt>Email</dt><dd>${emailLink(c.contactEmail, "Cultural partnership — India–USA Performing Arts")}</dd>` : ""}
            ${c.website ? `<dt>Website</dt><dd><a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website)}</a></dd>` : ""}
            ${jur ? `<dt>Jurisdiction</dt><dd>${esc(jur)}</dd>` : ""}
          </dl>
          ${track ? `<div><strong>Track record</strong><ul>${track}</ul></div>` : ""}
          ${partners ? `<div><strong>Key partners</strong><div class="tags">${partners}</div></div>` : ""}
          ${c.whyTheyMatter ? `<div class="body"><em>${esc(c.whyTheyMatter)}</em></div>` : ""}
        </div>`;
    }).join("");
    view.innerHTML = `
      <h1>Consulates</h1>
      <p>India's West Coast consular presence doubled between late 2023 and early 2026. This is the primary surface for cultural partnership.</p>
      <div class="card-grid">${cards}</div>`;
  }

  async function renderStakeholders() {
    loading();
    const data = await fetchJSON(DATA_BASE + "stakeholders.json");
    const stake = data.stakeholders || [];
    const cats = Array.from(new Set(stake.map(s => s.category).filter(Boolean))).sort();
    const cities = Array.from(new Set(stake.map(s => s.city).filter(Boolean))).sort();

    view.innerHTML = `
      <h1>Stakeholder Directory</h1>
      <p>Tiered map of people and organizations to engage. Tier 1 = immediate outreach.</p>
      <div class="filter-bar">
        <input type="search" id="s-q" placeholder="Search name, org, role…" />
        <select id="s-tier">
          <option value="">All tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
        <select id="s-cat"><option value="">All categories</option>${cats.map(c => `<option>${esc(c)}</option>`).join("")}</select>
        <select id="s-city"><option value="">All cities</option>${cities.map(c => `<option>${esc(c)}</option>`).join("")}</select>
        <span class="count" id="s-count"></span>
      </div>
      <div class="card-grid" id="s-grid"></div>`;

    function card(s) {
      const tier = s.tier ? `<span class="tag ${s.tier === 1 ? "green" : s.tier === 2 ? "saffron" : ""}">Tier ${s.tier}</span>` : "";
      const cat = s.category ? `<span class="tag">${esc(s.category)}</span>` : "";
      const action = s.actionPriority ? `<span class="tag warn">${esc(s.actionPriority)}</span>` : "";
      return `
        <div class="card">
          <div class="title">${esc(s.name)}</div>
          <div class="sub">${esc(s.role || "")}${s.organization ? " · " + esc(s.organization) : ""}${s.city ? " · " + esc(s.city) : ""}</div>
          <div class="tags">${tier}${cat}${action}</div>
          ${s.contact ? `<dl class="kv"><dt>Contact</dt><dd>${emailLink(s.contact, "India–USA Performing Arts — outreach")}</dd></dl>` : ""}
          ${s.approach ? `<div class="body"><strong>Approach: </strong>${esc(s.approach)}</div>` : ""}
          ${s.whyTheyMatter ? `<div class="body"><em>${esc(s.whyTheyMatter)}</em></div>` : ""}
        </div>`;
    }
    const grid = $("#s-grid"), count = $("#s-count");
    const q = $("#s-q"), tier = $("#s-tier"), cat = $("#s-cat"), city = $("#s-city");
    function apply() {
      const ql = q.value.toLowerCase().trim();
      const filtered = stake.filter(s => {
        if (tier.value && String(s.tier) !== tier.value) return false;
        if (cat.value && s.category !== cat.value) return false;
        if (city.value && s.city !== city.value) return false;
        if (!ql) return true;
        const blob = [s.name, s.role, s.organization, s.approach, s.whyTheyMatter, s.city].join(" ").toLowerCase();
        return blob.includes(ql);
      }).sort((a, b) => (a.tier || 9) - (b.tier || 9));
      count.textContent = `${filtered.length} of ${stake.length} stakeholders`;
      grid.innerHTML = filtered.map(card).join("") || `<div class="panel">No matches.</div>`;
    }
    [q, tier, cat, city].forEach(el => el.addEventListener("input", apply));
    apply();
  }

  async function renderPrecedents() {
    loading();
    const data = await fetchJSON(DATA_BASE + "precedents.json");
    const items = (data.precedents || []).slice().sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || "")));
    const cards = items.map(p => {
      const partners = (p.partners || []).map(x => `<span class="tag">${esc(x)}</span>`).join(" ");
      const lessons = (p.applicableLessons || []).map(x => `<li>${esc(x)}</li>`).join("");
      return `
        <div class="card">
          <div class="title">${esc(p.name)}</div>
          <div class="sub">${esc(p.date || "")}${p.location ? " · " + esc(p.location) : ""}</div>
          <div class="tags">${p.category ? `<span class="tag saffron">${esc(p.category)}</span>` : ""}</div>
          ${p.scope ? `<div class="body">${esc(p.scope)}</div>` : ""}
          ${p.headlinePerformance ? `<div class="body"><strong>Headline: </strong>${esc(p.headlinePerformance)}</div>` : ""}
          ${partners ? `<div><strong>Partners</strong><div class="tags">${partners}</div></div>` : ""}
          ${lessons ? `<div><strong>Lessons</strong><ul>${lessons}</ul></div>` : ""}
          ${p.whyItMatters ? `<div class="body"><em>${esc(p.whyItMatters)}</em></div>` : ""}
        </div>`;
    }).join("");
    view.innerHTML = `
      <h1>Precedents</h1>
      <p>Prior events we can learn from or directly model. Most important: India Culture Week at Seattle University (Nov 2024).</p>
      <div class="card-grid">${cards}</div>`;
  }

  async function renderFunding() {
    loading();
    const [funding, md] = await Promise.all([
      fetchJSON(DATA_BASE + "funding-sources.json"),
      fetchText(CONTENT_BASE + "08-funding-stack.md")
    ]);
    const cards = (funding.fundingSources || []).map(f => {
      const doesnt = Array.isArray(f.doesNotCover) ? `<ul>${f.doesNotCover.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
      return `
        <div class="card">
          <div class="title">${esc(f.name)} <span class="${prioClass(f.probability)}">${esc(f.probability || "")}</span></div>
          <div class="sub">${esc(f.type || "")}</div>
          <dl class="kv">
            ${f.rangeUSD ? `<dt>Range</dt><dd>${esc(f.rangeUSD)}</dd>` : ""}
            ${f.covers ? `<dt>Covers</dt><dd>${esc(f.covers)}</dd>` : ""}
            ${doesnt ? `<dt>Does not cover</dt><dd>${doesnt}</dd>` : ""}
            ${f.applicationTimeline ? `<dt>Timeline</dt><dd>${esc(f.applicationTimeline)}</dd>` : ""}
            ${f.ourTiming ? `<dt>Our timing</dt><dd>${esc(f.ourTiming)}</dd>` : ""}
            ${f.contactPath ? `<dt>Path</dt><dd>${esc(f.contactPath)}</dd>` : ""}
            ${f.applicationUrl ? `<dt>Apply</dt><dd><a href="${esc(f.applicationUrl)}" target="_blank" rel="noopener">${esc(f.applicationUrl)}</a></dd>` : ""}
          </dl>
          ${f.notes ? `<div class="body"><em>${esc(f.notes)}</em></div>` : ""}
        </div>`;
    }).join("");
    view.innerHTML = `
      <h1>Funding Stack</h1>
      <div class="two-col">
        <div>${renderMarkdown(md)}</div>
        <div class="panel"><h3>Funding sources</h3><div class="card-grid" style="grid-template-columns:1fr">${cards}</div></div>
      </div>`;
  }

  async function renderSponsorStructures() {
    loading();
    const [md, data] = await Promise.all([
      fetchText(CONTENT_BASE + "03-sponsor-structures.md"),
      fetchJSON(DATA_BASE + "sponsor-options.json")
    ]);
    const cards = (data.sponsorOptions || []).map(o => {
      const pros = (o.pros || []).map(x => `<li>${esc(x)}</li>`).join("");
      const cons = (o.cons || []).map(x => `<li>${esc(x)}</li>`).join("");
      const alt = (o.alternatives || []).map(a =>
        `<span class="tag">${esc(a.name)}${a.fee ? " — " + esc(a.fee) : ""}</span>`).join(" ");
      return `
        <div class="card">
          <div class="title">${esc(o.name)}</div>
          <div class="sub">${esc(o.leadProvider || "")}${o.setupTime ? " · " + esc(o.setupTime) : ""}</div>
          <div class="body">${esc(o.shortDescription || "")}</div>
          ${pros ? `<div><strong>Pros</strong><ul>${pros}</ul></div>` : ""}
          ${cons ? `<div><strong>Cons</strong><ul>${cons}</ul></div>` : ""}
          ${alt ? `<div><strong>Alternatives</strong><div class="tags">${alt}</div></div>` : ""}
        </div>`;
    }).join("");
    view.innerHTML = `
      <h1>Sponsor / Partner Structures</h1>
      <div class="two-col">
        <div>${renderMarkdown(md)}</div>
        <div class="panel"><h3>Options compared</h3><div class="card-grid" style="grid-template-columns:1fr">${cards}</div></div>
      </div>`;
  }

  function statusLabel(s) {
    if (s === "done") return "Done";
    if (s === "in-progress") return "In progress";
    return "Not started";
  }
  function nextStatus(s) {
    if (!s || s === "not-started") return "in-progress";
    if (s === "in-progress") return "done";
    return "not-started";
  }

  async function renderTimeline() {
    loading();
    const data = await fetchJSON(DATA_BASE + "timeline.json");
    const phases = data.phases || [];
    const milestones = data.milestones || [];

    const statusKey = "iupai:timeline:status";
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(statusKey) || "{}"); } catch {}

    const grouped = phases.map(ph => ({
      phase: ph,
      items: milestones.filter(m => m.phase === ph.id)
        .sort((a, b) => (a.week || 0) - (b.week || 0))
    }));

    function render() {
      view.innerHTML = `
        <h1>Timeline</h1>
        <p>Week-by-week plan across 5 phases. Toggle status on any milestone — saved in your browser.</p>
        <div class="timeline-wrap">
          ${grouped.map(g => `
            <div class="timeline-month">
              <h3>Phase ${g.phase.id.split("-")[1]}: ${esc(g.phase.name)} <span class="badge">Weeks ${esc(g.phase.weeks)}</span></h3>
              <div class="panel" style="padding:0">
                ${g.items.map((m, i) => {
                  const key = `${m.phase}:${m.week}:${i}`;
                  const st = saved[key] || m.status || "not-started";
                  return `
                    <div class="timeline-item">
                      <div><div class="week">Week ${esc(m.week)}</div><div class="owner">${esc(m.owner || "")}</div></div>
                      <div><div class="action">${esc(m.action)}${m.critical ? ' <span class="tag warn">critical</span>' : ""}</div></div>
                      <button class="status-toggle" data-status="${esc(st)}" data-key="${esc(key)}">${statusLabel(st)}</button>
                    </div>`;
                }).join("")}
              </div>
            </div>`).join("")}
        </div>`;
      $$(".status-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const cur = btn.dataset.status;
          const nxt = nextStatus(cur);
          saved[key] = nxt;
          try { localStorage.setItem(statusKey, JSON.stringify(saved)); } catch {}
          btn.dataset.status = nxt;
          btn.textContent = statusLabel(nxt);
        });
      });
    }
    render();
  }

  // --------- router ----------
  const routes = {
    "/": renderHome,
    "/city-analysis": () => renderMarkdownPage("02-city-decision.md"),
    "/sponsor-structures": renderSponsorStructures,
    "/programs": renderPrograms,
    "/consulates": renderConsulates,
    "/precedents": renderPrecedents,
    "/stakeholders": renderStakeholders,
    "/concept": () => renderMarkdownPage("07-pilot-festival-concept.md"),
    "/funding": renderFunding,
    "/visa-playbook": () => renderMarkdownPage("09-p3-visa-playbook.md"),
    "/timeline": renderTimeline,
    "/open-questions": () => renderMarkdownPage("11-open-questions.md"),
    "/outreach": () => renderMarkdownPage("12-outreach-templates.md"),
    "/seattle-playbook": () => renderMarkdownPage("13-seattle-local-advantages.md"),
  };

  function currentRoute() {
    const h = location.hash.replace(/^#/, "") || "/";
    return routes[h] ? h : "/";
  }
  function highlightNav(route) {
    $$(".sidebar a").forEach(a => {
      a.classList.toggle("active", a.dataset.route === route);
    });
  }
  async function handleRoute() {
    const route = currentRoute();
    highlightNav(route);
    try { await routes[route](); }
    catch (e) { errorBox(e.message); console.error(e); }
    window.scrollTo({ top: 0, behavior: "instant" });
    sidebar.classList.remove("open");
  }

  window.addEventListener("hashchange", handleRoute);
  if (navToggle) navToggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("DOMContentLoaded", handleRoute);
  if (document.readyState !== "loading") handleRoute();
})();
