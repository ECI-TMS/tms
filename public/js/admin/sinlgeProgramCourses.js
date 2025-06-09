$(document).ready(function() {
    $('#coursesTable').DataTable({
      "pageLength": 10,
      "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
      "order": [[0, "asc"]],
      "language": {
        "search": "Search Courses:",
        "lengthMenu": "Show _MENU_ courses per page",
        "info": "Showing _START_ to _END_ of _TOTAL_ courses",
        "infoEmpty": "No courses available",
        "infoFiltered": "(filtered from _MAX_ total courses)",
        "paginate": {
          "first": "First",
          "last": "Last",
          "next": "Next",
          "previous": "Previous"
        }
      },
      "columnDefs": [
        { "orderable": false, "targets": 2 } // Disable sorting for Actions column
      ]
    });
  });