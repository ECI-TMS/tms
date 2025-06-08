document.addEventListener("DOMContentLoaded", () => {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.getAttribute("data-id");

        if (confirm("Are you sure you want to delete this client?")) {
          const res = await fetch(`/admin/organizations/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            tr.remove();
          } else {
            alert("Failed to delete client.");
          }
        }
      });
    });
  });

   $('#clientsTable').DataTable();