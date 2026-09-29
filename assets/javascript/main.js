$(function() {
  $('#webchat').click(function(){
      window.open('../example-pages/demo.html','webchat', 'width=200, height=200');
  });

  $('.tests #webchat').click(function(){
      window.open('example-pages/demo.html','webchat', 'width=200, height=200');
  });

  $('a.trap').keydown(function(event){
    event.preventDefault();
    var href = $(this).attr('href');
    var text = $(this).text();
    window.open(href, text);
  });

  $('.open-lightbox-not-focused').click(function (event){
    event.preventDefault();
    $('.lightbox.not-focused').removeClass('hidden');
  });

  $('.lightbox.not-focused .close-button').click(function (){
    event.preventDefault();
    $('.lightbox.not-focused').addClass('hidden');
  });

  $('.open-lightbox-close-button').click(function (event){
    event.preventDefault();
    var $lClose = $('.lightbox.close-button');
    $lClose.removeClass('hidden');
    $lClose.focus();
  });

  $('.lightbox.close-button .close-button').click(function (){
    event.preventDefault();
    $('.lightbox.close-button').addClass('hidden');
  });

  $('.open-lightbox-focus-far').click(function (event){
    event.preventDefault();
    var $lbox = $('.lightbox.focus-far');
    $('body').append($lbox);
    $lbox.removeClass('hidden');
  });

  $('.lightbox.focus-far .close-button').click(function (){
    event.preventDefault();
    $('.lightbox.focus-far').addClass('hidden');
  });

  $('.open-lightbox-unescapable').click(function (event){
    event.preventDefault();
    $('.lightbox.unescapable').removeClass('hidden');
  });

  $('.lightbox.unescapable .close-button').click(function (){
    event.preventDefault();
    $('.lightbox.unescapable').addClass('hidden');
  });

  // escape key to close lightboxes
  $(window).keyup(function (e){
    if (e.keyCode == 27) { //escape key
      $('.lightbox').not('.unescapable').addClass('hidden');
    }
  });

  /* Concertina */

  $('.concertina dd').addClass('hidden');

  $('.concertina dt').click(function (e){
    var $dt = $(this);
    var $dd = $dt.next('dd');
    $dt.toggleClass('expanded');
    $dd.toggleClass('hidden');
  });

  $('.language-selector').change(function (){
    window.location = window.location.href;
  });

  $('.disappearing-alert').next('label').find('input').focus(function (){
    $('.disappearing-alert').removeClass('hidden');
    setTimeout(function (){
      $('.disappearing-alert').addClass('hidden');
    }, 500);
  });

  /* WCAG 2.1 and 2.2 test cases */

  // Single character shortcut that cannot be turned off
  if ($('.single-key-shortcut').length) {
    $(document).keydown(function (e){
      if (e.key === 'd' && !$(e.target).is('input, textarea')) {
        $('.single-key-shortcut').text('Message deleted.');
      }
    });
  }

  // Carousel that only responds to a horizontal swipe
  var swipeSlides = [
    'Slide 1 of 3: Apply for a passport online',
    'Slide 2 of 3: Renew your driving licence',
    'Slide 3 of 3: Check your State Pension age'
  ];
  var swipeIndex = 0;
  var swipeStart = null;

  $('.swipe-only').on('pointerdown', function (e){
    swipeStart = e.clientX;
  });

  $('.swipe-only').on('pointerup', function (e){
    if (swipeStart === null) { return; }
    var distance = e.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(distance) < 50) { return; }
    swipeIndex = (swipeIndex + (distance < 0 ? 1 : swipeSlides.length - 1)) % swipeSlides.length;
    $('.swipe-only-slide').text(swipeSlides[swipeIndex]);
  });

  // Action fires on pointer down, so it cannot be cancelled by moving away
  $('.pointer-down-action').on('mousedown', function (){
    $('.pointer-down-status').text('Draft deleted.');
  });

  // Undo only available by shaking the device
  $(window).on('devicemotion', function (e){
    var a = e.originalEvent.accelerationIncludingGravity;
    if ($('.motion-only').length && a && Math.abs(a.x) > 15) {
      $('.motion-only').text('Last change undone.');
    }
  });

  // Reordering only possible by dragging
  var $dragged = null;

  $('.drag-only li').on('dragstart', function (){
    $dragged = $(this);
  });

  $('.drag-only li').on('dragover', function (e){
    e.preventDefault();
  });

  $('.drag-only li').on('drop', function (e){
    e.preventDefault();
    if ($dragged && $dragged[0] !== this) {
      $(this).before($dragged);
    }
  });

  // Status message inserted without role="status" or aria-live
  $('.status-message-button').click(function (){
    $('.status-message-output').text('1 item added to your basket.');
  });

  // Paste blocked in password field
  $('.no-paste').on('paste', function (e){
    e.preventDefault();
  });

  // Focusing a field opens a new window
  $('.change-on-focus').focus(function (){
    var base = $('body').hasClass('tests') ? '' : '../';
    window.open(base + 'example-pages/demo.html', 'postcode-help', 'width=200, height=200');
  });

  // Signature pad that only works with a pointer
  $('.signature-pad').each(function (){
    var canvas = this;
    var ctx = canvas.getContext('2d');
    var drawing = false;

    $(canvas).on('pointerdown', function (e){
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    });

    $(canvas).on('pointermove', function (e){
      if (!drawing) { return; }
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    });

    $(canvas).on('pointerup pointerleave', function (){
      drawing = false;
    });
  });

  // Time limit that cannot be turned off or extended
  $('.time-limit').each(function (){
    var $form = $(this);
    var seconds = 60;
    var timer = setInterval(function (){
      seconds--;
      $form.find('.time-limit-seconds').text(seconds);
      if (seconds === 0) {
        clearInterval(timer);
        $form.find('input, button').prop('disabled', true);
        $form.find('p').first().text('Time is up.');
      }
    }, 1000);
  });

  // Interruptions that cannot be postponed
  var offers = [
    'Special offer: 20% off parking permits this week.',
    'Have you signed up for our newsletter?',
    'Tell us what you think of this service.'
  ];
  var offerIndex = 0;

  if ($('.interruption').length) {
    setInterval(function (){
      $('.interruption').text(offers[offerIndex]);
      offerIndex = (offerIndex + 1) % offers.length;
    }, 10000);
  }

  // Inactivity timeout with no warning
  $('.silent-timeout').each(function (){
    var $form = $(this);
    var timer;
    var reset = function (){
      clearTimeout(timer);
      timer = setTimeout(function (){
        $form.find('textarea').val('');
      }, 20 * 60 * 1000);
    };
    $form.on('input', reset);
    reset();
  });

  // Flashing badge, started by the user and stopped after 3 seconds
  $('.flash-start').click(function (){
    var $badge = $(this).siblings('.flash-badge');
    $badge.addClass('flashing');
    setTimeout(function (){
      $badge.removeClass('flashing');
    }, 3000);
  });

  // Animation that ignores prefers-reduced-motion
  $('.interaction-animation-start').click(function (){
    $('.interaction-animation').toggleClass('moved');
  });

  // Mouse clicks ignored when the device has a touch screen
  $('.touch-only-when-touchscreen').click(function (e){
    var pointerType = e.originalEvent && e.originalEvent.pointerType;
    if (navigator.maxTouchPoints > 0 && pointerType === 'mouse') { return; }
    $('.touch-only-when-touchscreen-output').text('Showing 20 more results.');
  });

});
