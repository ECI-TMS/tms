        // let table = new DataTable('#trainer_table');
        $(document).ready(function () {

            $(document).on('click', '.delete_trainer', function (e) {
                
            
                const trainerID = $(this).data('id');
                $('#input_id').val(trainerID);




                $('.confirm_delete').one('click', function () {
                    const trainerIdForDelete = $('#input_id').val()
                    $.ajax({
                        type: "post",
                        url: `/trainer/deleteUser`,
                        data: { id: trainerIdForDelete },
                        dataType: 'json',


                        success: function (response) {
                            if (response.status == true) {
                                alert('trainer deleted successfully')
                            }
                            window.location.href = "/admin/trainers";


                        },
                    });
                });

            });

        });

