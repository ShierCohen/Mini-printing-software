// moseover for remove, show, reprint, edit icons
let icons = document.getElementsByClassName("fa");

for (let i = 0; i < icons.length; i++) {
  icons[i].addEventListener("mouseover", function () {
    this.classList.add("selected");
  });

  icons[i].addEventListener("mouseout", function () {
    this.classList.remove("selected");
  });
}

//let rangeInput = document.getElementById("rangeinput").value;

//reset the print form
function resetForm() {
  document.getElementById("printInfo").reset();
}

//confermitsion before delete
function confirmation() {
  return confirm("Are you sure?");
}
