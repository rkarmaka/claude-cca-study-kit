(function () {
  const timerEl = document.getElementById('timer');
  const form = document.getElementById('exam-form');
  const submitBtn = document.getElementById('submit-btn');
  const dialog = document.getElementById('confirm-submit');
  const expiredDialog = document.getElementById('expired-dialog');
  const cancelBtn = document.getElementById('cancel-submit');
  const confirmBtn = document.getElementById('confirm-submit-btn');
  const warningEl = document.getElementById('unanswered-warning');

  if (!timerEl || !form) return;

  const expiresStr = timerEl.dataset.expires;
  const expiresAt = new Date(expiresStr);
  let submitting = false;
  let autoSubmitTriggered = false;

  const pad = (n) => n.toString().padStart(2, '0');

  function totalQuestions() {
    return form.querySelectorAll('.question-card').length;
  }

  function countUnanswered() {
    let unanswered = 0;
    form.querySelectorAll('.question-card').forEach((card) => {
      const radios = card.querySelectorAll('input[type="radio"]');
      const checked = Array.from(radios).some((r) => r.checked);
      if (!checked) unanswered++;
    });
    return unanswered;
  }

  function submit() {
    if (submitting) return;
    submitting = true;
    form.submit();
  }

  function tick() {
    const now = new Date();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    timerEl.textContent = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

    if (remaining <= 60) {
      timerEl.classList.remove('warning');
      timerEl.classList.add('critical');
    } else if (remaining <= 300) {
      timerEl.classList.add('warning');
    }

    if (remaining === 0 && !autoSubmitTriggered) {
      autoSubmitTriggered = true;
      if (dialog && dialog.open) dialog.close();
      if (expiredDialog && typeof expiredDialog.showModal === 'function') {
        expiredDialog.showModal();
      }
      setTimeout(submit, 800);
    }
  }

  tick();
  setInterval(tick, 1000);

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const u = countUnanswered();
      const total = totalQuestions();
      if (warningEl) {
        if (u > 0) {
          warningEl.textContent = `${u} of ${total} unanswered — counted as incorrect.`;
        } else {
          warningEl.textContent = `All ${total} questions answered.`;
        }
      }
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        if (confirm(`Submit? ${u} unanswered.`)) submit();
      }
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', () => dialog && dialog.close());
  if (confirmBtn) confirmBtn.addEventListener('click', submit);

  // Smooth scroll to question on label keyboard nav
  form.addEventListener('change', (e) => {
    // Light visual cue: nothing else here; option highlight handled by :has() in CSS
  });

  // Warn before leaving page without submitting
  window.addEventListener('beforeunload', (e) => {
    if (!submitting) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
})();
