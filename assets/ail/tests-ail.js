/* Fixture behaviour for A11y Intuition Lab (ail-2026) test cases.
   Part of the experiment: do not change without a log entry (see AGENTS.md).
   Vanilla JavaScript, no dependencies. Each behaviour is attached only to elements with its data-ail-* attribute,
   so it works the same on a test case's own page and on the combined test-cases page. */
(function () {
  'use strict';

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function isEditable(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  /* Timers, flashing and other behaviour that must never run on the combined test-cases page (D-014) start only on a
     test case's own page. The combined page's body has the class site-fixtures-page; fixture pages do not. */
  function onOwnPage() {
    return !document.body.classList.contains('site-fixtures-page');
  }

  function init() {
    /* keyboard-access-focus-removed-by-script-when-received-ail:
       the element loses focus as soon as it receives it (F55). */
    each('[data-ail-blur-on-focus]', function (el) {
      el.addEventListener('focus', function () { el.blur(); });
    });

    /* keyboard-access-single-character-key-shortcut-cannot-be-turned-off-ail:
       pressing the single character key (no modifier) anywhere outside a text field moves focus to the element.
       There is no way to turn the shortcut off or remap it (F99). */
    each('[data-ail-shortcut]', function (el) {
      var key = el.getAttribute('data-ail-shortcut').toLowerCase();
      document.addEventListener('keydown', function (event) {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (isEditable(event.target)) return;
        if (event.key && event.key.toLowerCase() === key) {
          event.preventDefault();
          el.focus();
        }
      });
    });

    /* timing-auto-rotating-carousel-without-pause-ail:
       shows the next slide every n milliseconds, for ever, with no pause, stop or hide control. */
    each('[data-ail-autorotate]', function (el) {
      var slides = el.querySelectorAll('[data-ail-slide]');
      var delay = parseInt(el.getAttribute('data-ail-autorotate'), 10) || 3000;
      var current = 0;
      window.setInterval(function () {
        slides[current].hidden = true;
        current = (current + 1) % slides.length;
        slides[current].hidden = false;
      }, delay);
    });

    /* pointer-and-motion-path-gesture-required-without-single-pointer-alternative-ail:
       slides change only with a horizontal swipe (pointer) or the arrow keys (keyboard). There are no buttons,
       so a single pointer cannot change the slide without a path-based gesture (F105). */
    each('[data-ail-swipe]', function (el) {
      var slides = el.querySelectorAll('[data-ail-slide]');
      var counter = el.querySelector('[data-ail-slide-counter]');
      var current = 0;
      var startX = null;
      function show(index) {
        if (index < 0 || index >= slides.length) return;
        slides[current].hidden = true;
        current = index;
        slides[current].hidden = false;
        if (counter) counter.textContent = (current + 1) + ' of ' + slides.length;
      }
      el.addEventListener('pointerdown', function (event) { startX = event.clientX; });
      el.addEventListener('pointerup', function (event) {
        if (startX === null) return;
        var dx = event.clientX - startX;
        startX = null;
        if (dx <= -50) show(current + 1);
        else if (dx >= 50) show(current - 1);
      });
      el.addEventListener('pointercancel', function () { startX = null; });
      el.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
        else if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
      });
    });

    /* pointer-and-motion-action-triggered-on-pointer-down-ail:
       the item is deleted on pointerdown, so the action cannot be aborted by moving the pointer away
       before releasing it, and there is no undo (F101). Keyboard activation (a click with detail 0) also deletes. */
    each('[data-ail-delete-on-down]', function (button) {
      function remove() {
        var item = button.closest('[data-ail-deletable]');
        var list = item.parentNode;
        var status = document.getElementById(button.getAttribute('data-ail-delete-on-down'));
        var next = item.nextElementSibling || item.previousElementSibling;
        item.parentNode.removeChild(item);
        if (status) status.textContent = 'Address deleted.';
        var nextButton = next && next.querySelector('[data-ail-delete-on-down]');
        if (nextButton) nextButton.focus();
        else if (list) { list.setAttribute('tabindex', '-1'); list.focus(); }
      }
      button.addEventListener('pointerdown', function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        remove();
      });
      button.addEventListener('click', function (event) {
        if (event.detail === 0) remove();
      });
    });

    /* pointer-and-motion-drag-and-drop-without-single-pointer-alternative-ail:
       items are reordered by dragging their handle. Keyboard users can move a focused handle with the arrow keys,
       but a click or tap on the handle does nothing, so there is no single pointer alternative (F108). */
    each('[data-ail-sortable]', function (list) {
      var status = document.getElementById(list.getAttribute('data-ail-sortable'));
      function items() { return Array.prototype.slice.call(list.children); }
      function nameOf(item) { return item.getAttribute('data-ail-item-name'); }
      function announce(item) {
        var all = items();
        var pos = all.indexOf(item) + 1;
        all.forEach(function (it, i) {
          var handle = it.querySelector('[data-ail-drag-handle]');
          handle.setAttribute('aria-label', 'Move ' + nameOf(it) + ', position ' + (i + 1) + ' of ' + all.length);
        });
        if (status) status.textContent = nameOf(item) + ' moved to position ' + pos + ' of ' + all.length + '.';
      }
      items().forEach(function (item) {
        var handle = item.querySelector('[data-ail-drag-handle]');
        var startIndex = -1;
        handle.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowUp' && item.previousElementSibling) {
            event.preventDefault();
            list.insertBefore(item, item.previousElementSibling);
            handle.focus();
            announce(item);
          } else if (event.key === 'ArrowDown' && item.nextElementSibling) {
            event.preventDefault();
            list.insertBefore(item.nextElementSibling, item);
            handle.focus();
            announce(item);
          }
        });
        /* Moving the item in the DOM releases pointer capture, so movement is tracked on the document. */
        function move(event) {
          var others = items().filter(function (it) { return it !== item; });
          var before = null;
          for (var i = 0; i < others.length; i++) {
            var box = others[i].getBoundingClientRect();
            if (event.clientY < box.top + box.height / 2) { before = others[i]; break; }
          }
          if (item.nextElementSibling !== before) list.insertBefore(item, before);
        }
        function stop() {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', stop);
          document.removeEventListener('pointercancel', stop);
          item.classList.remove('ail-sortable-dragging');
          if (items().indexOf(item) !== startIndex) announce(item);
          handle.focus();
        }
        handle.addEventListener('pointerdown', function (event) {
          if (event.button !== 0) return;
          event.preventDefault();
          startIndex = items().indexOf(item);
          item.classList.add('ail-sortable-dragging');
          document.addEventListener('pointermove', move);
          document.addEventListener('pointerup', stop);
          document.addEventListener('pointercancel', stop);
        });
      });
    });

    /* forms-focus-on-field-opens-new-window-ail:
       receiving focus opens a new window, a change of context on focus. */
    each('[data-ail-open-window-on-focus]', function (el) {
      el.addEventListener('focus', function () {
        var win = window.open('', 'ail-calendar', 'width=360,height=360');
        if (!win) return;
        try {
          win.document.title = 'Choose a date';
          win.document.body.innerHTML = '';
          var heading = win.document.createElement('h1');
          heading.textContent = 'Choose a date';
          var text = win.document.createElement('p');
          text.textContent = 'Calendar for ' + el.getAttribute('data-ail-open-window-on-focus') + '.';
          win.document.body.appendChild(heading);
          win.document.body.appendChild(text);
        } catch (e) { /* window not scriptable: leave it as it is */ }
      });
    });

    /* forms-status-message-not-announced-ail:
       the button writes a status message into an element that has no status role or live region (F103). */
    each('[data-ail-status-target]', function (button) {
      button.addEventListener('click', function () {
        var target = document.getElementById(button.getAttribute('data-ail-status-target'));
        if (target) target.textContent = button.getAttribute('data-ail-status-text');
      });
    });

    /* forms-custom-checkbox-without-checked-state-ail:
       a role="checkbox" element toggled by click and Space. The visual state changes; aria-checked is never set (F15). */
    each('[data-ail-checkbox]', function (box) {
      function toggle() { box.classList.toggle('ail-checkbox-checked'); }
      box.addEventListener('click', toggle);
      box.addEventListener('keydown', function (event) {
        if (event.key === ' ') { event.preventDefault(); toggle(); }
      });
    });

    /* authentication-paste-blocked-in-password-field-ail, authentication-login-requires-transcribing-a-code-without-paste-ail:
       paste is cancelled, so a password manager or copied password or code cannot be used (F109). */
    each('[data-ail-block-paste]', function (el) {
      el.addEventListener('paste', function (event) { event.preventDefault(); });
    });

    /* forms-selecting-a-radio-button-opens-a-new-window-ail:
       choosing an option opens a new window straight away, a change of context on change of setting (F37). */
    each('[data-ail-open-window-on-change]', function (el) {
      el.addEventListener('change', function () {
        if (!el.checked) return;
        var win = window.open('', 'ail-delivery', 'width=420,height=360');
        if (!win) return;
        try {
          win.document.title = el.getAttribute('data-ail-open-window-on-change');
          win.document.body.innerHTML = '';
          var heading = win.document.createElement('h1');
          heading.textContent = el.getAttribute('data-ail-open-window-on-change');
          win.document.body.appendChild(heading);
        } catch (e) { /* window not scriptable: leave it as it is */ }
      });
    });

    /* forms-form-submits-automatically-when-last-field-is-filled-ail:
       the form is submitted as soon as the field holds the required number of digits (F36). */
    each('[data-ail-autosubmit]', function (el) {
      var length = parseInt(el.getAttribute('data-ail-autosubmit'), 10) || 4;
      el.addEventListener('input', function () {
        if (new RegExp('^[0-9]{' + length + '}$').test(el.value) && el.form) el.form.submit();
      });
    });

    /* keyboard-access-disclosure-button-without-expanded-state-ail:
       the button shows and hides a section but never sets aria-expanded. */
    each('[data-ail-disclosure]', function (button) {
      button.addEventListener('click', function () {
        var target = document.getElementById(button.getAttribute('data-ail-disclosure'));
        if (target) target.hidden = !target.hidden;
      });
    });

    /* keyboard-access-tooltip-cannot-be-dismissed-with-escape-ail:
       the tooltip shows on hover or focus and stays while the pointer is over it, but only hides when the pointer or
       focus leaves. Escape does nothing, so it cannot be dismissed without moving away. */
    each('[data-ail-tooltip]', function (wrapper) {
      var tip = document.getElementById(wrapper.getAttribute('data-ail-tooltip'));
      var trigger = wrapper.querySelector('[aria-describedby]');
      if (!tip || !trigger) return;
      var hovered = false;
      var focused = false;
      function update() { tip.hidden = !(hovered || focused); }
      wrapper.addEventListener('mouseenter', function () { hovered = true; update(); });
      wrapper.addEventListener('mouseleave', function () { hovered = false; update(); });
      trigger.addEventListener('focus', function () { focused = true; update(); });
      trigger.addEventListener('blur', function () { focused = false; update(); });
    });

    /* keyboard-access-drawing-canvas-with-no-keyboard-alternative-ail:
       a freehand signature pad that only responds to pointer input. */
    each('[data-ail-signature]', function (canvas) {
      var ctx = canvas.getContext('2d');
      var drawing = false;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0b0c0c';
      function point(event) {
        var box = canvas.getBoundingClientRect();
        return { x: (event.clientX - box.left) * canvas.width / box.width, y: (event.clientY - box.top) * canvas.height / box.height };
      }
      canvas.addEventListener('pointerdown', function (event) {
        drawing = true;
        canvas.setPointerCapture(event.pointerId);
        var p = point(event);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
      });
      canvas.addEventListener('pointermove', function (event) {
        if (!drawing) return;
        var p = point(event);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
      canvas.addEventListener('pointerup', function () { drawing = false; });
      canvas.addEventListener('pointercancel', function () { drawing = false; });
      var clear = document.querySelector('[data-ail-signature-clear="' + canvas.id + '"]');
      if (clear) clear.addEventListener('click', function () { ctx.clearRect(0, 0, canvas.width, canvas.height); });
    });

    /* timing-animation-triggered-by-scrolling-ignores-reduced-motion-ail:
       scrolling the panel moves a decorative band sideways (parallax). prefers-reduced-motion is not checked and there
       is no control to turn the motion off. */
    each('[data-ail-scroll-motion]', function (scroller) {
      var layer = scroller.querySelector('[data-ail-motion-layer]');
      if (!layer) return;
      scroller.addEventListener('scroll', function () {
        var max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
        var progress = scroller.scrollTop / max;
        layer.style.transform = 'translateX(' + Math.round(progress * 300) + 'px) rotate(' + Math.round(progress * 360) + 'deg)';
      });
    });

    /* pointer-and-motion-shake-to-undo-without-alternative-ail:
       shaking the device clears the message. There is no button that does the same and no way to turn it off (F106). */
    each('[data-ail-shake-undo]', function (field) {
      var status = document.getElementById(field.getAttribute('data-ail-shake-undo'));
      var last = 0;
      window.addEventListener('devicemotion', function (event) {
        var a = event.acceleration || event.accelerationIncludingGravity;
        if (!a || a.x === null) return;
        var g = event.acceleration ? 0 : 9.81;
        var force = Math.abs(Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) - g);
        var now = Date.now();
        if (force > 15 && now - last > 1000) {
          last = now;
          field.value = '';
          if (status) status.textContent = 'Your message was cleared.';
        }
      });
    });

    /* pointer-and-motion-touch-only-interaction-ail:
       the button responds to touch and to the keyboard, but ignores mouse clicks (F98). */
    each('[data-ail-touch-only]', function (button) {
      var status = document.getElementById(button.getAttribute('data-ail-touch-only'));
      function toggle() {
        var pressed = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', pressed ? 'false' : 'true');
        if (status) status.textContent = pressed ? 'Removed from your saved services.' : 'Added to your saved services.';
      }
      button.addEventListener('touchend', function (event) {
        event.preventDefault();
        toggle();
      });
      /* Keyboard activation fires a click with detail 0; a mouse click has detail 1 or more and is ignored. */
      button.addEventListener('click', function (event) {
        if (event.detail === 0) toggle();
      });
    });

    /* timing-content-updates-interrupt-the-user-ail:
       some seconds after the page loads, an alert interrupts the user with a non-urgent message. There is no setting
       to postpone or turn off such interruptions. Own page only. */
    each('[data-ail-delayed-alert]', function (el) {
      if (!onOwnPage()) return;
      var delay = parseInt(el.getAttribute('data-ail-delayed-alert'), 10) || 10000;
      window.setTimeout(function () { el.textContent = el.getAttribute('data-ail-alert-text'); }, delay);
    });

    /* timing-session-timeout-loses-entered-data-ail:
       after a period of inactivity the session ends and the answers are deleted. A warning before the end lets the
       user extend the session (2.2.1), but nothing says up front how long the inactivity limit is, and the answers are
       lost when the session does end. Times are shortened to seconds. Own page only. */
    each('[data-ail-session-timeout]', function (form) {
      if (!onOwnPage()) return;
      var limit = parseInt(form.getAttribute('data-ail-session-timeout'), 10) || 40000;
      var warnAt = parseInt(form.getAttribute('data-ail-session-warning'), 10) || 20000;
      var warning = document.getElementById(form.getAttribute('data-ail-session-warning-id'));
      var expired = document.getElementById(form.getAttribute('data-ail-session-expired-id'));
      var warnTimer, endTimer;
      function start() {
        window.clearTimeout(warnTimer);
        window.clearTimeout(endTimer);
        if (warning) warning.hidden = true;
        warnTimer = window.setTimeout(function () { if (warning) warning.hidden = false; }, limit - warnAt);
        endTimer = window.setTimeout(function () {
          if (warning) warning.hidden = true;
          form.reset();
          if (expired) expired.hidden = false;
        }, limit);
      }
      ['input', 'keydown', 'pointerdown'].forEach(function (type) {
        form.addEventListener(type, function () { if (!expired || expired.hidden) start(); });
      });
      each('[data-ail-session-extend]', function (button) { button.addEventListener('click', start); });
      each('[data-ail-session-restart]', function (button) {
        button.addEventListener('click', function () {
          if (expired) expired.hidden = true;
          start();
        });
      });
      start();
    });

    /* multimedia-locally-flashing-animation-above-the-general-flash-threshold-ail (D-014):
       a large area flashes between saturated red and black five times a second (above the three-flash threshold),
       but only after the user selects the start button, which follows a photosensitivity warning. A stop button ends it,
       and it stops by itself after five seconds. Own page only: on the combined page it never starts. */
    each('[data-ail-flash]', function (area) {
      var startButton = document.querySelector('[data-ail-flash-start="' + area.id + '"]');
      var stopButton = document.querySelector('[data-ail-flash-stop="' + area.id + '"]');
      var timer = null;
      var endTimer = null;
      function stop() {
        window.clearInterval(timer);
        window.clearTimeout(endTimer);
        timer = null;
        area.classList.remove('ail-flash-on');
      }
      if (startButton) startButton.addEventListener('click', function () {
        if (!onOwnPage() || timer) return;
        timer = window.setInterval(function () { area.classList.toggle('ail-flash-on'); }, 100);
        endTimer = window.setTimeout(stop, 5000);
      });
      if (stopButton) stopButton.addEventListener('click', stop);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
