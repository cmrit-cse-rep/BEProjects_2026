document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const submitBtn = document.getElementById("submitBtn");
  const spinner = document.querySelector(".spinner");
  const btnText = document.querySelector(".btn-text");
  const errorDiv = document.getElementById("error");

  errorDiv.classList.add("hidden");
  if (!fileInput.files.length) {
    alert("Please select a CSV file first!");
    return;
  }

  // Show loading state
  btnText.textContent = "Processing...";
  submitBtn.disabled = true;
  spinner.classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(()=>({error:"Unknown"}));
      throw new Error(err.error || "Server error");
    }

    const data = await response.json();

    // Shape
    document.getElementById("shape").textContent =
      `Shape: ${data.shape[0]} rows × ${data.shape[1]} cols`;

    // Build table
    const table = document.getElementById("previewTable");
    table.innerHTML = "";

    // Header
    const headerRow = document.createElement("tr");
    data.preview[0].forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Data rows
    data.preview.slice(1).forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    document.getElementById("result").classList.remove("hidden");
  } catch (err) {
    errorDiv.textContent = "Error: " + err.message;
    errorDiv.classList.remove("hidden");
    console.error(err);
  } finally {
    // Hide loading state
    btnText.textContent = "Upload & Process";
    submitBtn.disabled = false;
    spinner.classList.add("hidden");
  }
});

// Update the file name display
document.getElementById("fileInput").addEventListener("change", (e) => {
    const fileName = e.target.files[0] ? e.target.files[0].name : "No file selected";
    document.getElementById("fileNameDisplay").textContent = fileName;
});