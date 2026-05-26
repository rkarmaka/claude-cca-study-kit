/*
 * CCA Foundations practice exam — fully client-side.
 *
 * A static port of the Flask app (exam-app/app.py): same domain-weighted
 * sampling, 120-minute timer, scaled scoring, per-domain breakdown, and answer
 * review. Exam runs are stored in this browser's localStorage instead of on a
 * server, so your history is private to your device.
 */
(function () {
  "use strict";

  // --- Config (mirrors exam-app/app.py) ---
  var EXAM_DURATION_MINUTES = 120;
  var TOTAL_QUESTIONS = 60;
  var PASS_SCALED_SCORE = 720;

  // Sums to 60; 5 cross-domain (0) slots for scenario-integration questions.
  var DOMAIN_DISTRIBUTION = [
    [1, 15], [2, 10], [3, 11], [4, 11], [5, 8], [0, 5],
  ];

  var DOMAIN_SHORT = {
    1: "Agentic Architecture",
    2: "Tool Design & MCP",
    3: "Claude Code Config",
    4: "Prompt Engineering",
    5: "Context Management",
    0: "Cross-Domain",
  };

  var DOMAIN_FULL = {
    1: "Agentic Architecture & Orchestration",
    2: "Tool Design & MCP Integration",
    3: "Claude Code Configuration & Workflows",
    4: "Prompt Engineering & Structured Output",
    5: "Context Management & Reliability",
    0: "Cross-Domain Integrative",
  };

  // A single-domain drill draws this many questions from that domain (capped to
  // the pool size). "All domains" still uses the weighted 60-question mix above.
  var SINGLE_DOMAIN_COUNT = 20;
  var MINUTES_PER_QUESTION = 2; // 60 questions -> 120 minutes

  // Quick diagnostic: ~20 questions spread across domains (sums to 20).
  var DIAGNOSTIC_DISTRIBUTION = [[1, 5], [2, 3], [3, 4], [4, 4], [5, 3], [0, 1]];

  // Domain -> cheatsheet file (for post-exam recommendations). 0 (cross) has no
  // single cheatsheet, so it points at the trap sheet.
  var REPO = "https://github.com/rkarmaka/claude-cca-study-kit/blob/main/";
  var DOMAIN_NOTE = {
    1: "study-notes/domain1.md", 2: "study-notes/domain2.md",
    3: "study-notes/domain3.md", 4: "study-notes/domain4.md",
    5: "study-notes/domain5.md", 0: "study-notes/master-trap-sheet.md",
  };

  var STORAGE_KEY = "cca-exam-runs";
  var LETTERS = ["A", "B", "C", "D"];
  var CONFIDENCE = [
    { k: "guessed", label: "Guessed" },
    { k: "unsure", label: "Unsure" },
    { k: "known", label: "Knew it" },
  ];

  // --- State ---
  var QUESTIONS_BY_DOMAIN = null; // {domain: [q, ...]}
  var view = document.getElementById("view");
  var activeTimer = null;        // interval id for the exam timer
  var examInProgress = false;    // controls the beforeunload guard

  // --- Utilities ---
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Minimal inline markdown: **bold** and `code` (matches render_inline_md).
  function md(value) {
    if (!value) return "";
    var s = escapeHtml(value);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    return s;
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatDt(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function formatDur(seconds) {
    if (seconds == null) return "";
    var s = Math.floor(seconds), m = Math.floor(s / 60); s = s % 60;
    var h = Math.floor(m / 60); m = m % 60;
    return h ? (h + "h " + m + "m " + s + "s") : (m + "m " + s + "s");
  }

  function makeId() {
    var hex = "0123456789abcdef", out = "";
    for (var i = 0; i < 10; i++) out += hex[Math.floor(Math.random() * 16)];
    return out;
  }

  // --- Storage ---
  function allRuns() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveRun(run) {
    var runs = allRuns();
    runs[run.exam_id] = run;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }
  function getRun(id) { return allRuns()[id] || null; }
  function listRuns() {
    var runs = allRuns();
    return Object.keys(runs).map(function (k) { return runs[k]; })
      .sort(function (a, b) { return new Date(b.started_at) - new Date(a.started_at); });
  }

  // --- Exam logic ---
  function sampleN(arr, n) {
    var copy = arr.slice(), out = [];
    for (var i = 0; i < n && copy.length; i++) {
      var j = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(j, 1)[0]);
    }
    return out;
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function sampleExam() {
    var sampled = [];
    DOMAIN_DISTRIBUTION.forEach(function (pair) {
      var domain = pair[0], count = pair[1];
      var pool = QUESTIONS_BY_DOMAIN[domain] || [];
      if (pool.length < count) {
        throw new Error("Domain " + domain + " has " + pool.length + ", need " + count);
      }
      sampled = sampled.concat(sampleN(pool, count));
    });
    return shuffle(sampled);
  }

  function scoreExam(run) {
    var total = run.questions.length, correct = 0, byDomain = {};
    run.questions.forEach(function (q) {
      var key = String(q.domain);
      if (!byDomain[key]) {
        byDomain[key] = { id: q.domain, label: DOMAIN_SHORT[q.domain] || "Unknown", total: 0, correct: 0 };
      }
      byDomain[key].total++;
      if (run.user_answers[String(q.id)] === q.correct) {
        correct++; byDomain[key].correct++;
      }
    });
    Object.keys(byDomain).forEach(function (k) {
      var d = byDomain[k];
      d.percent = d.total ? Math.round((d.correct / d.total) * 1000) / 10 : 0;
    });
    var percent = total ? Math.round((correct / total) * 1000) / 10 : 0;
    var scaled = total ? Math.round(100 + (correct / total) * 900) : 0;
    return {
      total: total, correct: correct, percent: percent, scaled: scaled,
      passed: scaled >= PASS_SCALED_SCORE, pass_threshold: PASS_SCALED_SCORE,
      by_domain: byDomain,
    };
  }

  function sampleByDistribution(dist) {
    var out = [];
    dist.forEach(function (pair) {
      out = out.concat(sampleN(QUESTIONS_BY_DOMAIN[pair[0]] || [], pair[1]));
    });
    return shuffle(out);
  }

  // mode: "all" (weighted 60), "diagnostic" (~20 mixed), or a domain key (0–5).
  function startExam(mode) {
    var questions, label;
    if (mode === "all") {
      questions = sampleExam();
      label = "Full mock — all domains";
    } else if (mode === "diagnostic") {
      questions = sampleByDistribution(DIAGNOSTIC_DISTRIBUTION);
      label = "Quick diagnostic";
    } else {
      var pool = QUESTIONS_BY_DOMAIN[mode] || [];
      var count = Math.min(SINGLE_DOMAIN_COUNT, pool.length);
      questions = shuffle(sampleN(pool, count));
      label = DOMAIN_FULL[mode];
    }
    var duration = questions.length * MINUTES_PER_QUESTION;
    var started = new Date();
    var expires = new Date(started.getTime() + duration * 60000);
    var run = {
      exam_id: makeId(),
      mode: mode,
      mode_label: label,
      started_at: started.toISOString(),
      expires_at: expires.toISOString(),
      duration_minutes: duration,
      pass_threshold: PASS_SCALED_SCORE,
      questions: questions,
      user_answers: {},
      flagged: {},
      confidence: {},
      max_reached: 0,
      submitted_at: null,
      score: null,
    };
    saveRun(run);
    location.hash = "#/exam/" + run.exam_id;
  }

  function submitExam(run, answers) {
    var submitted = new Date();
    run.user_answers = answers;
    run.submitted_at = submitted.toISOString();
    run.duration_seconds = Math.floor((submitted - new Date(run.started_at)) / 1000);
    run.score = scoreExam(run);
    saveRun(run);
    examInProgress = false;
    location.hash = "#/results/" + run.exam_id;
  }

  // --- Shared render helpers ---
  function badge(score) {
    if (!score) return '<span class="badge badge-pending">in&nbsp;progress</span>';
    var cls = score.passed ? "pass" : "fail";
    return '<span class="badge badge-' + cls + '">' + (score.passed ? "PASS" : "FAIL") + "</span>";
  }

  function runsTableRows(runs, withReview) {
    return runs.map(function (r) {
      var scoreCell = r.score
        ? '<span class="mono">' + r.score.scaled + "/1000</span> " +
          '<span class="muted">· ' + r.score.correct + "/" + r.score.total +
          (withReview ? " · " + r.score.percent + "%" : "") + "</span>"
        : '<span class="muted">' + (withReview ? "—" : "in progress") + "</span>";
      var actions = r.score
        ? '<a href="#/results/' + r.exam_id + '">Results</a>' +
          (withReview ? ' <span class="muted">·</span> <a href="#/review/' + r.exam_id + '">Review</a>' : "")
        : '<a href="#/exam/' + r.exam_id + '">Resume</a>';
      return "<tr><td>" + formatDt(r.started_at) + "</td><td>" + scoreCell +
        "</td><td>" + badge(r.score) + "</td><td" + (withReview ? "" : ' class="right"') +
        ">" + actions + "</td></tr>";
    }).join("");
  }

  // --- Views ---
  function clearTimer() { if (activeTimer) { clearInterval(activeTimer); activeTimer = null; } }

  function modeCard(mode, title, sub) {
    return '<button type="button" class="mode-card" data-mode="' + mode + '">' +
      '<span class="mode-name">' + escapeHtml(title) + "</span>" +
      '<span class="mode-sub">' + sub + "</span></button>";
  }

  function renderHome() {
    clearTimer(); examInProgress = false;
    var runs = listRuns();

    var diagN = DIAGNOSTIC_DISTRIBUTION.reduce(function (a, p) { return a + p[1]; }, 0);

    // Two headline modes: a short diagnostic and the full weighted mock.
    var headline =
      modeCard("diagnostic", "Quick diagnostic",
        diagN + " questions · ~" + (diagN * MINUTES_PER_QUESTION) + " min · mixed domains · find your gaps fast") +
      modeCard("all", "Full mock exam",
        TOTAL_QUESTIONS + " questions · " + (TOTAL_QUESTIONS * MINUTES_PER_QUESTION) +
        " min · weighted like the real exam");

    // Single-domain drills.
    var drills = "";
    [1, 2, 3, 4, 5, 0].forEach(function (d) {
      var pool = (QUESTIONS_BY_DOMAIN[d] || []).length;
      var count = Math.min(SINGLE_DOMAIN_COUNT, pool);
      drills += modeCard(d, DOMAIN_FULL[d],
        count + " questions · " + (count * MINUTES_PER_QUESTION) + " min");
    });

    var html =
      '<section class="hero" style="padding-bottom:1rem">' +
        "<h1>Claude Certified Architect<br><span class=\"hero-sub\">Foundations · Practice Exam</span></h1>" +
        '<p class="muted">New here? Start with the quick diagnostic. Pass at ' + PASS_SCALED_SCORE + "/1000.</p>" +
      "</section>" +
      '<div class="mode-grid">' + headline + "</div>" +
      '<p class="mode-divider">Or drill a single domain</p>' +
      '<div class="mode-grid">' + drills + "</div>" +
      '<p class="muted" style="font-size:0.88rem;margin-top:0.25rem">' +
      "Your attempts are saved only in this browser — no account, nothing uploaded. " +
      "You can pause and resume anytime; your score appears only after you submit.</p>";

    if (runs.length) {
      html +=
        "<section><div class=\"section-head\"><h2>Recent attempts</h2>" +
        (runs.length > 5 ? '<a href="#/history" class="muted">See all →</a>' : "") +
        '</div><table class="runs-table"><thead><tr><th>Date</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>' +
        runsTableRows(runs.slice(0, 5), false) + "</tbody></table></section>";
    }
    view.innerHTML = html;
    view.querySelectorAll(".mode-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var m = btn.dataset.mode;
        startExam((m === "all" || m === "diagnostic") ? m : parseInt(m, 10));
      });
    });
  }

  function renderExam(id) {
    clearTimer();
    var run = getRun(id);
    if (!run) return renderError();
    if (run.submitted_at) { location.hash = "#/results/" + id; return; }
    examInProgress = true;
    if (!run.flagged) run.flagged = {};

    var n = run.questions.length;
    var palette = run.questions.map(function (q, i) {
      return '<button type="button" class="pal-btn" data-idx="' + i + '">' + (i + 1) + "</button>";
    }).join("");

    // Shell is rendered once so the timer keeps running across navigation;
    // only #question-container and the chrome update as you move between cards.
    // The question sits at the top, under a slim status bar.
    view.innerHTML =
      '<div class="exam-topbar">' +
        '<span class="progress-text" id="exam-progress"></span>' +
        '<div class="timer-wrap"><span id="timer" class="timer">--:--</span>' +
        '<span class="muted timer-label">left</span></div>' +
      "</div>" +
      '<div id="question-container"></div>' +
      '<div class="exam-nav">' +
        '<button type="button" class="btn btn-secondary btn-icon" id="prev-btn">← Previous</button>' +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn btn-secondary" id="flag-btn">⚑ Flag</button>' +
        '<button type="button" class="btn btn-primary btn-icon" id="next-btn">Next →</button>' +
      "</div>" +
      '<div class="palette" id="palette" aria-label="Question navigator">' + palette + "</div>" +
      '<div class="exam-footer"><p class="muted">Continue with Next. You can revisit earlier ' +
        "questions, but you can't skip ahead. Unanswered questions count as incorrect.</p>" +
        '<button type="button" class="btn btn-primary btn-lg" id="submit-btn">Submit Exam</button></div>' +
      '<dialog id="confirm-submit" class="confirm-dialog"><h3>Submit exam?</h3>' +
        '<p id="unanswered-warning" class="muted"></p>' +
        '<p class="muted">You will not be able to change answers after submitting.</p>' +
        '<div class="dialog-actions"><button type="button" class="btn btn-secondary" id="cancel-submit">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="confirm-submit-btn">Submit</button></div></dialog>' +
      '<dialog id="expired-dialog" class="confirm-dialog"><h3>Time\'s up</h3>' +
        '<p class="muted">Submitting your answers now.</p></dialog>';

    wireExam(run);
  }

  function countAnswered(run) {
    var c = 0;
    run.questions.forEach(function (q) {
      if (run.user_answers[String(q.id)]) c++;
    });
    return c;
  }

  function wireExam(run) {
    var n = run.questions.length;
    var qc = document.getElementById("question-container");
    var timerEl = document.getElementById("timer");
    var progressEl = document.getElementById("exam-progress");
    var prevBtn = document.getElementById("prev-btn");
    var nextBtn = document.getElementById("next-btn");
    var flagBtn = document.getElementById("flag-btn");
    var dialog = document.getElementById("confirm-submit");
    var expiredDialog = document.getElementById("expired-dialog");
    var warningEl = document.getElementById("unanswered-warning");
    var palBtns = Array.prototype.slice.call(view.querySelectorAll(".pal-btn"));
    var expiresAt = new Date(run.expires_at);
    var maxReached = run.max_reached || 0;          // furthest question unlocked
    var idx = Math.min(maxReached, n - 1);          // resume where they left off
    var autoSubmitted = false, submitting = false;

    function renderQuestion() {
      var q = run.questions[idx];
      var sel = run.user_answers[String(q.id)];
      var conf = run.confidence[String(q.id)];
      var opts = LETTERS.map(function (L) {
        return '<label class="option"><input type="radio" name="q_' + q.id + '" value="' + L + '"' +
          (sel === L ? " checked" : "") + '><span class="option-letter">' + L +
          '</span><span class="option-text">' + md(q.options[L]) + "</span></label>";
      }).join("");
      var confRow = CONFIDENCE.map(function (c) {
        return '<button type="button" class="conf-btn' + (conf === c.k ? " on" : "") +
          '" data-conf="' + c.k + '">' + c.label + "</button>";
      }).join("");
      qc.innerHTML =
        '<article class="question-card"><header class="q-header">' +
        '<span class="q-num">Question ' + (idx + 1) + " of " + n + "</span>" +
        '<span class="q-domain">' + escapeHtml(DOMAIN_SHORT[q.domain]) + "</span></header>" +
        '<div class="q-text">' + md(q.question) + "</div>" +
        '<fieldset class="q-options">' + opts + "</fieldset>" +
        '<div class="conf-row"><span class="conf-label">How sure are you?</span>' + confRow + "</div></article>";
      qc.querySelectorAll('input[type="radio"]').forEach(function (r) {
        r.addEventListener("change", function () {
          run.user_answers[String(q.id)] = r.value;
          saveRun(run);
          updateChrome();
        });
      });
      qc.querySelectorAll(".conf-btn").forEach(function (b) {
        b.addEventListener("click", function () {
          var key = String(q.id), v = b.dataset.conf;
          if (run.confidence[key] === v) delete run.confidence[key]; else run.confidence[key] = v;
          saveRun(run);
          qc.querySelectorAll(".conf-btn").forEach(function (x) {
            x.classList.toggle("on", x.dataset.conf === run.confidence[key]);
          });
        });
      });
      updateChrome();
      window.scrollTo(0, 0);
    }

    function updateChrome() {
      var q = run.questions[idx];
      var prefix = run.mode_label ? (run.mode_label + " · ") : "";
      progressEl.textContent = prefix + "Question " + (idx + 1) + " of " + n +
        " · " + countAnswered(run) + " answered";
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === n - 1;
      var flagged = !!run.flagged[String(q.id)];
      flagBtn.classList.toggle("flag-on", flagged);
      flagBtn.textContent = flagged ? "⚑ Flagged" : "⚑ Flag";
      palBtns.forEach(function (b, i) {
        var qq = run.questions[i];
        var locked = i > maxReached;
        b.classList.toggle("answered", !!run.user_answers[String(qq.id)]);
        b.classList.toggle("flagged", !!run.flagged[String(qq.id)]);
        b.classList.toggle("current", i === idx);
        b.classList.toggle("locked", locked);
        b.disabled = locked;
      });
    }

    // Move freely among questions already reached, but never past the frontier.
    function goTo(i) { idx = Math.max(0, Math.min(maxReached, i)); renderQuestion(); }

    function advance() {
      if (idx >= n - 1) return;
      var target = idx + 1;
      if (target > maxReached) {           // unlock the next question once
        maxReached = target;
        run.max_reached = maxReached;
        saveRun(run);
      }
      idx = target;
      renderQuestion();
    }

    prevBtn.addEventListener("click", function () { goTo(idx - 1); });
    nextBtn.addEventListener("click", advance);
    flagBtn.addEventListener("click", function () {
      var key = String(run.questions[idx].id);
      if (run.flagged[key]) delete run.flagged[key]; else run.flagged[key] = true;
      saveRun(run);
      updateChrome();
    });
    palBtns.forEach(function (b) {
      b.addEventListener("click", function () { goTo(parseInt(b.dataset.idx, 10)); });
    });

    function doSubmit() {
      if (submitting) return;
      submitting = true; examInProgress = false;
      submitExam(run, run.user_answers);
    }

    function tick() {
      var remaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
      var h = Math.floor(remaining / 3600), m = Math.floor((remaining % 3600) / 60), s = remaining % 60;
      timerEl.textContent = h > 0 ? (h + ":" + pad(m) + ":" + pad(s)) : (pad(m) + ":" + pad(s));
      if (remaining <= 60) { timerEl.classList.remove("warning"); timerEl.classList.add("critical"); }
      else if (remaining <= 300) { timerEl.classList.add("warning"); }
      if (remaining === 0 && !autoSubmitted) {
        autoSubmitted = true;
        if (dialog && dialog.open) dialog.close();
        if (expiredDialog && expiredDialog.showModal) expiredDialog.showModal();
        setTimeout(doSubmit, 800);
      }
    }
    tick();
    activeTimer = setInterval(tick, 1000);

    document.getElementById("submit-btn").addEventListener("click", function () {
      var u = n - countAnswered(run);
      warningEl.textContent = u > 0
        ? (u + " of " + n + " unanswered — counted as incorrect.")
        : ("All " + n + " questions answered.");
      if (dialog && dialog.showModal) dialog.showModal();
      else if (confirm("Submit? " + u + " unanswered.")) doSubmit();
    });
    document.getElementById("cancel-submit").addEventListener("click", function () { dialog.close(); });
    document.getElementById("confirm-submit-btn").addEventListener("click", doSubmit);

    renderQuestion();
  }

  function renderResults(id) {
    clearTimer(); examInProgress = false;
    var run = getRun(id);
    if (!run) return renderError();
    if (!run.submitted_at) { location.hash = "#/exam/" + id; return; }
    var sc = run.score;

    var domainList = Object.keys(sc.by_domain).map(function (k) { return sc.by_domain[k]; });

    var rows = domainList.slice()
      .sort(function (a, b) { return a.id - b.id; })
      .map(function (d) {
        return "<tr><td>" + escapeHtml(d.label) + '</td><td class="mono">' + d.correct + "/" + d.total +
          '</td><td class="mono">' + d.percent + '%</td><td><div class="bar"><div class="bar-fill" style="width: ' +
          d.percent + '%"></div></div></td></tr>';
      }).join("");

    // Recommend the weakest domains: those under 70%, or the single lowest if all
    // passed but the run wasn't perfect.
    var ranked = domainList.filter(function (d) { return d.total > 0; })
      .sort(function (a, b) { return a.percent - b.percent; });
    var weak = ranked.filter(function (d) { return d.percent < 70; });
    if (!weak.length && ranked.length && ranked[0].percent < 100) weak = [ranked[0]];
    weak = weak.slice(0, 2);

    var recsHtml = "";
    if (weak.length) {
      recsHtml = '<section class="recs"><h2>Focus next on</h2><div class="rec-grid">' +
        weak.map(function (d) {
          var note = REPO + (DOMAIN_NOTE[d.id] || "study-notes/master-trap-sheet.md");
          var fc = (d.id >= 1 && d.id <= 5) ? "../flashcards/#D" + d.id : "../flashcards/";
          return '<div class="rec-card"><div class="rec-head"><span class="rec-name">' +
            escapeHtml(d.label) + '</span><span class="rec-pct">' + d.percent + "%</span></div>" +
            '<div class="rec-links"><a href="' + note + '" target="_blank" rel="noopener">Review cheatsheet ↗</a>' +
            '<a href="' + fc + '">Drill flashcards →</a></div></div>';
        }).join("") + "</div></section>";
    }

    view.innerHTML =
      '<section class="results-hero ' + (sc.passed ? "pass" : "fail") + '"><div class="score-stack">' +
        '<div class="scaled mono">' + sc.scaled + '<span class="of">/1000</span></div>' +
        '<div class="result-label">' + (sc.passed ? "PASSED" : "FAILED") + "</div>" +
        '<div class="result-meta muted">' + sc.correct + "/" + sc.total + " correct · " + sc.percent +
        "% · pass at " + run.pass_threshold + "/1000</div></div>" +
        '<div class="actions"><a href="#/review/' + id + '" class="btn btn-primary">Review Answers</a>' +
        '<a href="#/" class="btn btn-secondary">Home</a></div></section>' +
      recsHtml +
      "<section><h2>Per-domain breakdown</h2>" +
        '<table class="domain-table"><thead><tr><th>Domain</th><th>Score</th><th>Percent</th><th></th></tr></thead>' +
        "<tbody>" + rows + "</tbody></table></section>" +
      '<section class="meta">' +
        (run.mode_label ? '<p class="muted">Focus: ' + escapeHtml(run.mode_label) + "</p>" : "") +
        '<p class="muted">Started ' + formatDt(run.started_at) + " · Submitted " +
        formatDt(run.submitted_at) + " · Duration " + formatDur(run.duration_seconds) + "</p>" +
        '<p class="muted">Exam ID <code>' + escapeHtml(run.exam_id) + "</code></p></section>";
  }

  function renderReview(id) {
    clearTimer(); examInProgress = false;
    var run = getRun(id);
    if (!run || !run.submitted_at) return renderError();

    var cards = run.questions.map(function (q, i) {
      var ua = run.user_answers[String(q.id)];
      var isCorrect = ua === q.correct;
      var state = isCorrect ? "correct" : (ua ? "incorrect" : "skipped");
      var resultText = isCorrect ? "✓ Correct" : (ua ? "✗ Incorrect" : "— Skipped");
      var opts = LETTERS.map(function (L) {
        var cls = "";
        if (L === q.correct) cls += " is-correct";
        if (L === ua && ua !== q.correct) cls += " is-user-wrong";
        var tags = "";
        if (L === q.correct) tags += '<span class="tag tag-correct">correct</span>';
        if (L === ua && ua !== q.correct) tags += '<span class="tag tag-yours">your answer</span>';
        return '<li class="' + cls.trim() + '"><strong>' + L + ")</strong> " + md(q.options[L]) + " " + tags + "</li>";
      }).join("");

      // Confidence callout: surface lucky guesses and overconfident misses.
      var conf = run.confidence[String(q.id)];
      var confNote = "";
      if (conf) {
        var msg = "";
        if (conf === "guessed" && isCorrect) msg = "Marked “guessed” and got it right — a lucky guess. Revisit this one.";
        else if (conf === "known" && !isCorrect && ua) msg = "Marked “knew it” but got it wrong — a blind spot worth studying.";
        else if (conf === "guessed") msg = "You guessed here.";
        else if (conf === "unsure") msg = "You were unsure here.";
        else msg = "You felt confident here.";
        var tone = (conf === "guessed" && isCorrect) ? "warn" : ((conf === "known" && !isCorrect && ua) ? "bad" : "neutral");
        confNote = '<p class="conf-note ' + tone + '">' + msg + "</p>";
      }

      return '<article class="review-card ' + state + '" data-state="' + state + '"><header class="q-header">' +
        '<span class="q-num">Q' + (i + 1) + " · " + escapeHtml(DOMAIN_SHORT[q.domain]) + "</span>" +
        '<span class="q-result">' + resultText + "</span></header>" +
        '<div class="q-text">' + md(q.question) + "</div>" +
        '<ul class="review-options">' + opts + "</ul>" + confNote +
        '<details class="explanation"' + (isCorrect ? "" : " open") + "><summary>Explanation</summary><p>" +
        md(q.explanation) + "</p></details></article>";
    }).join("");

    view.innerHTML =
      '<div class="review-header"><div><h1>Review answers</h1><p class="muted">' +
        run.score.correct + "/" + run.score.total + " correct · " + run.score.scaled + "/1000 · " +
        '<a href="#/results/' + id + '">back to results</a></p></div>' +
        '<div class="review-filter">' +
        '<button type="button" class="chip chip-active" data-filter="all">All</button>' +
        '<button type="button" class="chip" data-filter="incorrect">Incorrect</button>' +
        '<button type="button" class="chip" data-filter="correct">Correct</button>' +
        '<button type="button" class="chip" data-filter="skipped">Skipped</button></div></div>' + cards;

    var chips = view.querySelectorAll(".chip");
    var reviewCards = view.querySelectorAll(".review-card");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("chip-active"); });
        chip.classList.add("chip-active");
        var f = chip.dataset.filter;
        reviewCards.forEach(function (card) {
          card.style.display = (f === "all" || card.dataset.state === f) ? "" : "none";
        });
      });
    });
  }

  function renderHistory() {
    clearTimer(); examInProgress = false;
    var runs = listRuns();
    var body = runs.length
      ? '<table class="runs-table"><thead><tr><th>Date</th><th>Score</th><th>Result</th><th>Actions</th></tr></thead><tbody>' +
        runsTableRows(runs, true) + "</tbody></table>"
      : '<p class="muted">No attempts yet. <a href="#/">Start one</a>.</p>';
    view.innerHTML = "<h1>Exam history</h1>" + body;
  }

  function renderError() {
    clearTimer(); examInProgress = false;
    view.innerHTML = '<section class="hero"><h1>Not found</h1>' +
      '<p class="muted">That exam could not be found in this browser.</p>' +
      '<p><a href="#/" class="btn btn-secondary">Home</a></p></section>';
  }

  // --- Router ---
  function route() {
    var hash = location.hash.replace(/^#/, "") || "/";
    var parts = hash.split("/").filter(Boolean); // e.g. ["exam","abc123"]
    window.scrollTo(0, 0);
    if (parts.length === 0) return renderHome();
    switch (parts[0]) {
      case "exam": return parts[1] ? renderExam(parts[1]) : renderError();
      case "results": return parts[1] ? renderResults(parts[1]) : renderError();
      case "review": return parts[1] ? renderReview(parts[1]) : renderError();
      case "history": return renderHistory();
      default: return renderError();
    }
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("beforeunload", function (e) {
    if (examInProgress) { e.preventDefault(); e.returnValue = ""; }
  });

  // --- Boot ---
  fetch("questions.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      QUESTIONS_BY_DOMAIN = {};
      data.questions.forEach(function (q) {
        (QUESTIONS_BY_DOMAIN[q.domain] = QUESTIONS_BY_DOMAIN[q.domain] || []).push(q);
      });
      route();
    })
    .catch(function (err) {
      view.innerHTML = '<section class="hero"><h1>Could not load questions</h1>' +
        '<p class="muted">' + escapeHtml(String(err)) +
        ". This app must be served over HTTP (it works on the published site).</p></section>";
    });
})();
