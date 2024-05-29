export function formatDate(value) {
  const date = new Date(value);

  // Define options for formatting the date
  const options = { day: "numeric", month: "short", year: "numeric" };

  // Format the date using toLocaleDateString
  const formattedDate = date.toLocaleDateString("en-US", options);

  return formattedDate;
}

export function delay(time) {
  setTimeout(() => {
    console.log("delayed");
  }, time);
}
