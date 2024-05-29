const tableBody = document.getElementById("tableBody");
const createSessionForm = document.getElementById("createSessionForm");

const user = JSON.parse(localStorage.getItem("user"));
let elem = document.createElement("input");

elem.setAttribute("value", user.ProgramID);
elem.setAttribute("type", "hidden");
elem.setAttribute("name", "ProgramID");

createSessionForm.appendChild(elem);
const getData = async () => {
  const res = await fetch(`/manager/sessions/${user.ProgramID}`);
  const data = await res.json();
  data.sessions.map((item) => {
    let node = document.createElement("tr");

    let row = `
        <tr>
          <td>${item.SessionID}</td>
          <td>${item.Center}</td>
          <td>
            ${item.DeliverablesStatus}
          </td>
          <td>${item.StartDate}</td>
          <td>${item.EndDate}</td>
          <td>${item.trainer}</td>
          <td>${item.monitor}</td>
          <td>${item.Duration}</td>
          <td>${item.program}</td>
          <td><button
              class="upload-btn"
              onclick="location.href='session/update/${item.SessionID}'"
            >Update</button></td>
          <td><button
              class="upload-btn"
              onclick="location.href='session/${item.SessionID}'"
            >View</button></td>
        </tr>
    `;
    node.innerHTML = row;
    tableBody.appendChild(node);
  });
};

getData();
