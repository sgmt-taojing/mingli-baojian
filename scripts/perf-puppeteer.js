#!/usr/bin/env node
/**
 * perf-puppeteer.js — Performance baseline with Puppeteer
 *
 * Captures LCP, INP (via FID/CLS fallback), FCP, TBT, TTI
 * for the top 5 heaviest pages.
 *
 * Output: docs/PERF_BASELINE_REPORT.md
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '..', 'app');
const REPORT_PATH = path.resolve(__dirname, '..', 'docs', 'PERF_BASELINE_REPORT.md');

const PAGES = [
  { name: 'divination-hub', url: 'file://' + path.join(APP_DIR, 'divination-hub.html') },
  { name: 'fengshui', url: 'file://' + path.join(APP_DIR, 'fengshui.html') },
  { name: 'divination-knowledge', url: 'file://' + path.join(APP_DIR, 'divination-knowledge.html') },
  { name: 'ai-assistant', url: 'file://' + path.join(APP_DIR, 'ai-assistant.html') },
  { name: 'tcm-clinic', url: 'file://' + path.join(APP_DIR, 'tcm-clinic.html') },
];

async function measurePage(browser, page) {
  const tab = await browser.newPage();
  const metrics = { name: page.name, perf: {}, timing: {} };

  try {
    // Enable performance audit
    await tab.setViewport({ width: 1920, height: 1080 });

    // Collect performance entries
    const perfEntries = [];
    tab.on('metrics', (m) => {
      metrics.timing = m.timing || {};
      metrics.perf = m.perf || {};
    });

    await tab.goto(page.url, { waitUntil: 'load', timeout: 60000 });

    // Wait for LCP candidate
    await new Promise((r) => setTimeout(r, 5000));

    // Get Core Web Vitals via PerformanceObserver
    const vitals = await tab.evaluate(async () => {
      const result = {};

      // FCP
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      result.fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;

      // LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      result.lcp = lcpEntries.length > 0
        ? Math.round(lcpEntries[lcpEntries.length - 1].startTime)
        : null;

      // CLS
      try {
        const clsEntries = performance.getEntriesByType('layout-shift');
        result.cls = clsEntries.reduce((sum, e) => sum + e.value, 0).toFixed(3);
      } catch (e) {
        result.cls = null;
      }

      // TBT approximation (Long Tasks)
      try {
        const longTasks = [];
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({ duration: entry.duration, name: entry.name });
          }
        });
        obs.observe({ type: 'longtask', buffered: true });
        await new Promise((r) => setTimeout(r, 3000));
        result.tbt = Math.round(longTasks.reduce((s, t) => s + t.duration, 0));
        result.longTaskCount = longTasks.length;
      } catch (e) {
        result.tbt = null;
        result.longTaskCount = 0;
      }

      // DOM nodes
      result.domNodes = document.querySelectorAll('*').length;

      // JS heap (if available)
      if (performance.memory) {
        result.jsHeapMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      }

      // Resource count + total size
      const resources = performance.getEntriesByType('resource');
      result.resourceCount = resources.length;
      result.resourceSizeMB = (resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1048576).toFixed(2);

      // Load time
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry) {
        result.domContentLoaded = Math.round(navEntry.domContentLoadedEventEnd);
        result.loadComplete = Math.round(navEntry.loadEventEnd);
      }

      return result;
    });

    metrics.vitals = vitals;

    // Get all performance metrics
    const perfMetrics = await tab.metrics();
    metrics.perfMetrics = {
      layoutDuration: (perfMetrics.LayoutDuration * 1000).toFixed(0) + 'ms',
      jsDuration: (perfMetrics.JSDuration * 1000).toFixed(0) + 'ms',
      jsHeapUsedMB: (perfMetrics.JSHeapUsedSize / 1048576).toFixed(1),
    };

    return metrics;
  } catch (e) {
    metrics.error = e.message;
    return metrics;
  } finally {
    await tab.close();
  }
}

(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[perf] started ${startedAt}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  for (const page of PAGES) {
    process.stdout.write(`[perf] measuring ${page.name} ... `);
    const r = await measurePage(browser, page);
    results.push(r);
    const v = r.vitals || {};
    console.log(`LCP=${v.lcp || 'N/A'}ms FCP=${v.fcp || 'N/A'}ms DOM=${v.domNodes || 'N/A'}`);
  }

  await browser.close();

  // Generate report
  let md = `# Performance Baseline Report\n\n`;
  md += `> Generated: ${startedAt}\n`;
  md += `> Tool: Puppeteer (headless Chrome)\n`;
  md += `> Viewport: 1920×1080\n\n`;

  md += `## Core Web Vitals Summary\n\n`;
  md += `| Page | LCP (ms) | FCP (ms) | CLS | TBT (ms) | Long Tasks | DOM Nodes | Resources | Size (MB) |\n`;
  md += `|------|----------|----------|-----|----------|------------|-----------|-----------|----------|\n`;
  for (const r of results) {
    const v = r.vitals || {};
    const lcp = v.lcp || 'N/A';
    const fcp = v.fcp || 'N/A';
    const cls = v.cls || 'N/A';
    const tbt = v.tbt || 'N/A';
    const lt = v.longTaskCount ?? 'N/A';
    const dom = v.domNodes || 'N/A';
    const rc = v.resourceCount || 'N/A';
    const sz = v.resourceSizeMB || 'N/A';
    md += `| ${r.name} | ${lcp} | ${fcp} | ${cls} | ${tbt} | ${lt} | ${dom} | ${rc} | ${sz} |\n`;
  }

  md += `\n## Detailed Metrics\n\n`;
  for (const r of results) {
    const v = r.vitals || {};
    const pm = r.perfMetrics || {};
    md += `### ${r.name}\n\n`;
    md += `- **LCP**: ${v.lcp || 'N/A'} ms\n`;
    md += `- **FCP**: ${v.fcp || 'N/A'} ms\n`;
    md += `- **CLS**: ${v.cls || 'N/A'}\n`;
    md += `- **TBT**: ${v.tbt || 'N/A'} ms (${v.longTaskCount || 0} long tasks)\n`;
    md += `- **DOM Content Loaded**: ${v.domContentLoaded || 'N/A'} ms\n`;
    md += `- **Load Complete**: ${v.loadComplete || 'N/A'} ms\n`;
    md += `- **DOM Nodes**: ${v.domNodes || 'N/A'}\n`;
    md += `- **Resources**: ${v.resourceCount || 'N/A'} (${v.resourceSizeMB || 'N/A'} MB)\n`;
    md += `- **JS Heap**: ${v.jsHeapMB || pm.jsHeapUsedMB || 'N/A'} MB\n`;
    md += `- **Layout Duration**: ${pm.layoutDuration || 'N/A'}\n`;
    md += `- **JS Duration**: ${pm.jsDuration || 'N/A'}\n\n`;
  }

  // Scorecard
  md += `## Scoring (Lighthouse-style)\n\n`;
  md += `| Page | LCP Score | TBT Score | Overall |\n`;
  md += `|------|-----------|-----------|---------|\n`;
  for (const r of results) {
    const v = r.vitals || {};
    const lcpScore = v.lcp == null ? '?' : v.lcp <= 2500 ? '🟢 90+' : v.lcp <= 4000 ? '🟡 50-89' : '🔴 <50';
    const tbtScore = v.tbt == null ? '?' : v.tbt <= 200 ? '🟢 90+' : v.tbt <= 600 ? '🟡 50-89' : '🔴 <50';
    const overall = (v.lcp != null && v.tbt != null) ? ((v.lcp <= 2500 && v.tbt <= 200) ? '✅ Pass' : '⚠️ Needs Work') : '?';
    md += `| ${r.name} | ${lcpScore} | ${tbtScore} | ${overall} |\n`;
  }

  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`[perf] report → ${REPORT_PATH}`);
  console.log(`[perf] done.`);
  process.exit(0);
})().catch((e) => {
  console.error('[perf] FATAL', e);
  process.exit(2);
});
