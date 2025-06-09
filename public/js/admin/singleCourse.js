$(document).ready(function() {
    $('#sessionsTable').DataTable({
      "pageLength": 10,
      "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
      "order": [[0, "asc"]],
      "responsive": true,
      "language": {
        "search": "Search sessions:",
        "lengthMenu": "Show _MENU_ sessions per page",
        "info": "Showing _START_ to _END_ of _TOTAL_ sessions",
        "infoEmpty": "No sessions available",
        "infoFiltered": "(filtered from _MAX_ total sessions)",
        "paginate": {
          "first": "First",
          "last": "Last",
          "next": "Next",
          "previous": "Previous"
        }
      }
    });
  });
