  $(document).ready(function () {
    $('#sessions').DataTable();

    $('.delete-btn').on('click', function () {
      const row = $(this).closest('tr');
      const centerId = row.data('id');

      if (confirm('Are you sure you want to delete this center?')) {
        fetch(`/admin/center/delete/${centerId}`, {
          method: 'DELETE',
        })
          .then(res => {
            if (res.ok) {
              row.remove();
              alert('Center deleted successfully.');
            } else {
              alert('Failed to delete center.');
            }
          })
          .catch(() => alert('An error occurred.'));
      }
    });
  });