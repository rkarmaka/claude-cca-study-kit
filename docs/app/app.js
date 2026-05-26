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

  var STORAGE_KEY = "cca-exam-runs";
  var LETTERS = ["A", "B", "C", "D"];

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

  function startExam() {
    var started = new Date();
    var expires = new Date(started.getTime() + EXAM_DURATION_MINUTES * 60000);
    var run = {
      exam_id: makeId(),
      started_at: started.toISOString(),
      expires_at: expires.toISOString(),
      duration_minutes: EXAM_DURATION_MINUTES,
      pass_threshold: PASS_SCALED_SCORE,
      questions: sampleExam(),
      user_answers: {},
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

  function renderHome() {
    clearTimer(); examInProgress = false;
    var runs = listRuns();
    var dist = DOMAIN_DISTRIBUTION.map(function (p) {
      return "<li><span>" + DOMAIN_SHORT[p[0]] + '</span><span class="muted">' + p[1] + " questions</span></li>";
    }).join("");

    var html =
      '<section class="hero">' +
        "<h1>Claude Certified Architect<br><span class=\"hero-sub\">Foundations · Practice Exam</span></h1>" +
        '<p class="muted">' + TOTAL_QUESTIONS + " questions · " + EXAM_DURATION_MINUTES +
          " minutes · Pass at " + PASS_SCALED_SCORE + "/1000</p>" +
        '<div class="start-form"><button type="button" id="start-btn" class="btn btn-primary btn-lg">Start New Exam</button></div>' +
        '<details class="distribution"><summary>Question distribution</summary><ul>' + dist + "</ul></details>" +
      "</section>";

    if (runs.length) {
      html +=
        "<section><div class=\"section-head\"><h2>Recent attempts</h2>" +
        (runs.length > 5 ? '<a href="#/history" class="muted">See all →</a>' : "") +
        '</div><table class="runs-table"><thead><tr><th>Date</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>' +
        runsTableRows(runs.slice(0, 5), false) + "</tbody></table></section>";
    }
    view.innerHTML = html;
    document.getElementById("start-btn").addEventListener("click", startExam);
  }

  function renderExam(id) {
    clearTimer();
    var run = getRun(id);
    if (!run) return renderError();
    if (run.submitted_at) { location.hash = "#/results/" + id; return; }
    examInProgress = true;

    var cards = run.questions.map(function (q, i) {
      var opts = LETTERS.map(function (L) {
        return '<label class="option"><input type="radio" name="q_' + q.id + '" value="' + L + '"' +
          (run.user_answers[String(q.id)] === L ? " checked" : "") +
          '><span class="option-letter">' + L + '</span><span class="option-text">' + md(q.options[L]) + "</span></label>";
      }).join("");
      return '<article class="question-card" id="q-' + (i + 1) + '"><header class="q-header">' +
        '<span class="q-num">Question ' + (i + 1) + " of " + run.questions.length + "</span>" +
        '<span class="q-domain">' + escapeHtml(DOMAIN_SHORT[q.domain]) + "</span></header>" +
        '<div class="q-text">' + md(q.question) + "</div>" +
        '<fieldset class="q-options">' + opts + "</fieldset></article>";
    }).join("");

    view.innerHTML =
      '<div class="exam-header"><div><h1>Practice Exam</h1>' +
        '<p class="muted">' + run.questions.length + " questions · " + run.duration_minutes +
        " minutes · pass at " + run.pass_threshold + "/1000</p></div>" +
        '<div class="timer-container"><div id="timer" class="timer">--:--</div>' +
        '<div class="muted timer-label">time remaining</div></div></div>' +
      '<form id="exam-form" novalidate>' + cards +
        '<div class="exam-footer"><p class="muted">Answer all questions, then submit. ' +
        "Unanswered questions are counted as incorrect.</p>" +
        '<button type="button" class="btn btn-primary btn-lg" id="submit-btn">Submit Exam</button></div></form>' +
      '<dialog id="confirm-submit" class="confirm-dialog"><h3>Submit exam?</h3>' +
        '<p id="unanswered-warning" class="muted"></p>' +
        '<p class="muted">You will not be able to change answers after submitting.</p>' +
        '<div class="dialog-actions"><button type="button" class="btn btn-secondary" id="cancel-submit">Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="confirm-submit-btn">Submit</button></div></dialog>' +
      '<dialog id="expired-dialog" class="confirm-dialog"><h3>Time\'s up</h3>' +
        '<p class="muted">Submitting your answers now.</p></dialog>';

    wireExam(run);
  }

  function collectAnswers(form) {
    var answers = {};
    form.querySelectorAll(".question-card").forEach(function (card) {
      var checked = card.querySelector('input[type="radio"]:checked');
      if (checked) {
        var name = checked.name; // q_<id>
        answers[name.slice(2)] = checked.value;
      }
    });
    return answers;
  }

  function wireExam(run) {
    var form = document.getElementById("exam-form");
    var timerEl = document.getElementById("timer");
    var dialog = document.getElementById("confirm-submit");
    var expiredDialog = document.getElementById("expired-dialog");
    var warningEl = document.getElementById("unanswered-warning");
    var expiresAt = new Date(run.expires_at);
    var autoSubmitted = false, submitting = false;

    // Persist answers as the user goes, so a refresh/resume keeps them.
    form.addEventListener("change", function () {
      run.user_answers = collectAnswers(form);
      saveRun(run);
    });

    function doSubmit() {
      if (submitting) return;
      submitting = true; examInProgress = false;
      submitExam(run, collectAnswers(form));
    }

    function countUnanswered() {
      var u = 0;
      form.querySelectorAll(".question-card").forEach(function (card) {
        if (!card.querySelector('input[type="radio"]:checked')) u++;
      });
      return u;
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
      var u = countUnanswered(), total = run.questions.length;
      warningEl.textContent = u > 0
        ? (u + " of " + total + " unanswered — counted as incorrect.")
        : ("All " + total + " questions answered.");
      if (dialog && dialog.showModal) dialog.showModal();
      else if (confirm("Submit? " + u + " unanswered.")) doSubmit();
    });
    document.getElementById("cancel-submit").addEventListener("click", function () { dialog.close(); });
    document.getElementById("confirm-submit-btn").addEventListener("click", doSubmit);
  }

  function renderResults(id) {
    clearTimer(); examInProgress = false;
    var run = getRun(id);
    if (!run) return renderError();
    if (!run.submitted_at) { location.hash = "#/exam/" + id; return; }
    var sc = run.score;

    var rows = Object.keys(sc.by_domain).map(function (k) { return sc.by_domain[k]; })
      .sort(function (a, b) { return a.id - b.id; })
      .map(function (d) {
        return "<tr><td>" + escapeHtml(d.label) + '</td><td class="mono">' + d.correct + "/" + d.total +
          '</td><td class="mono">' + d.percent + '%</td><td><div class="bar"><div class="bar-fill" style="width: ' +
          d.percent + '%"></div></div></td></tr>';
      }).join("");

    view.innerHTML =
      '<section class="results-hero ' + (sc.passed ? "pass" : "fail") + '"><div class="score-stack">' +
        '<div class="scaled mono">' + sc.scaled + '<span class="of">/1000</span></div>' +
        '<div class="result-label">' + (sc.passed ? "PASSED" : "FAILED") + "</div>" +
        '<div class="result-meta muted">' + sc.correct + "/" + sc.total + " correct · " + sc.percent +
        "% · pass at " + run.pass_threshold + "/1000</div></div>" +
        '<div class="actions"><a href="#/review/' + id + '" class="btn btn-primary">Review Answers</a>' +
        '<a href="#/" class="btn btn-secondary">Home</a></div></section>' +
      "<section><h2>Per-domain breakdown</h2>" +
        '<table class="domain-table"><thead><tr><th>Domain</th><th>Score</th><th>Percent</th><th></th></tr></thead>' +
        "<tbody>" + rows + "</tbody></table></section>" +
      '<section class="meta"><p class="muted">Started ' + formatDt(run.started_at) + " · Submitted " +
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
      return '<article class="review-card ' + state + '" data-state="' + state + '"><header class="q-header">' +
        '<span class="q-num">Q' + (i + 1) + " · " + escapeHtml(DOMAIN_SHORT[q.domain]) + "</span>" +
        '<span class="q-result">' + resultText + "</span></header>" +
        '<div class="q-text">' + md(q.question) + "</div>" +
        '<ul class="review-options">' + opts + "</ul>" +
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
