// Filters test cases by origin (original audit) and WCAG level (added test cases).
// The filter is hidden until this script runs, so everything is shown without JavaScript.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.filter[data-filter-for]').forEach(function (filter) {
    var target = document.getElementById(filter.getAttribute('data-filter-for'));
    if (!target) { return; }

    var items = target.querySelectorAll('[data-filter]');
    var groups = target.querySelectorAll('[data-filter-group]');
    var checkboxes = filter.querySelectorAll('input[type="checkbox"]');
    var count = filter.querySelector('.filter-count');

    function update() {
      var show = {};
      checkboxes.forEach(function (box) { show[box.value] = box.checked; });

      var visible = 0;
      items.forEach(function (item) {
        var on = !!show[item.getAttribute('data-filter')];
        item.hidden = !on;
        if (on) { visible++; }
      });

      groups.forEach(function (group) {
        group.hidden = !group.querySelector('[data-filter]:not([hidden])');
      });

      if (count) {
        count.textContent = 'Showing ' + visible + ' of ' + items.length + ' test cases';
      }
    }

    checkboxes.forEach(function (box) { box.addEventListener('change', update); });
    filter.hidden = false;
    update();
  });
});
