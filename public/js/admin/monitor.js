$(document).ready(function () {
    $('#monitors').DataTable();
  });

  async function deleteMonitor(userID, username) {
    const confirmed = confirm(`Are you sure you want to delete monitor "${username}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/admin/monitors/${userID}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        alert('Monitor deleted successfully.');
        location.reload(); // Refresh the page to reflect changes
      } else {
        alert(data.error || 'Failed to delete monitor.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    }
  }