// const deleteButton = document.getElementById("deleteProgram")

function openModal(id) {
    console.log("🚀 ~ openModal ~ id:", id)
    document.getElementById(id).style.display = 'flex';
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

function deleteAction(id) {
  
    var split = id.split('-');
    let programID = split[1];
    
  
    fetch('/admin/program/' + programID, {method:'DELETE'})
      .then((response)=> response.json())
        .then(()=>{
          alert("Successfully deleted!");
          location.reload();
        })
    closeModal(id);
}


  // deleteButton.addEventListener("click",  function(event) {
//     event.preventDefault() // stops form redirecting to another page on submit
    
    
// });

  $(document).ready(function () {
    $('#programsTable').DataTable();
  });