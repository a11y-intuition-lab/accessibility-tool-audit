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

    /* authentication-paste-blocked-in-password-field-ail:
       paste is cancelled, so a password manager or copied password cannot be used (F109). */
    each('[data-ail-block-paste]', function (el) {
      el.addEventListener('paste', function (event) { event.preventDefault(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
