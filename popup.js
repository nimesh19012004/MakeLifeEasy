document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("detailsForm");
  const statusDiv = document.getElementById("status");
  const savedDetailsDiv = document.getElementById("savedDetails");
  const updateBtn = document.getElementById("updateBtn");
  let editingIndex = null;

  function displayDetailsByCategory(details) {
    savedDetailsDiv.innerHTML = "";

    // Group details by category
    const detailsByCategory = {};
    details.forEach((detail, index) => {
      if (!detailsByCategory[detail.category]) {
        detailsByCategory[detail.category] = [];
      }
      detailsByCategory[detail.category].push({ ...detail, index });
    });

    // Display details
    for (const category in detailsByCategory) {
      if (category) {
        const categoryHeader = document.createElement("h3");
        categoryHeader.textContent = category || "Uncategorized";
        savedDetailsDiv.appendChild(categoryHeader);

        detailsByCategory[category].forEach((detail) => {
          const detailDiv = document.createElement("div");
          detailDiv.classList.add("detail");
          detailDiv.innerHTML = `
            <strong>Topic:</strong> ${detail.topic}<br>
            <strong>Description:</strong> ${detail.description}<br>
            ${detail.date ? `<strong>Date:</strong> ${detail.date}<br>` : ""}
            <button data-index="${detail.index}" class="editBtn">Edit</button>
            <button data-index="${
              detail.index
            }" class="deleteBtn">Delete</button>
            <button data-description="${
              detail.description
            }" class="copyBtn">Copy</button>
            <hr>`;
          savedDetailsDiv.appendChild(detailDiv);
        });
      }
    }

    // Add event listeners to edit, delete, and copy buttons
    document.querySelectorAll(".editBtn").forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        const detail = details[index];
        document.getElementById("topic").value = detail.topic;
        document.getElementById("description").value = detail.description;
        document.getElementById("date").value = detail.date || "";
        document.getElementById("category").value = detail.category || "";
        document.getElementById("detailId").value = index;
        form.querySelector('input[type="submit"]').style.display = "none";
        updateBtn.style.display = "inline";
        editingIndex = index;
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        details.splice(index, 1);
        chrome.storage.sync.set({ details }, function () {
          displayDetailsByCategory(details);
          statusDiv.textContent = "Detail deleted!";
        });
      });
    });

    document.querySelectorAll(".copyBtn").forEach((button) => {
      button.addEventListener("click", function () {
        const description = this.getAttribute("data-description");
        navigator.clipboard
          .writeText(description)
          .then(() => {
            statusDiv.textContent = "Description copied to clipboard!";
          })
          .catch((err) => {
            console.error("Could not copy text: ", err);
          });
      });
    });
  }

  // Load saved details on popup load
  chrome.storage.sync.get(["details"], function (result) {
    const details = result.details || [];
    displayDetailsByCategory(details);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const topic = document.getElementById("topic").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;

    // Check if at least topic and description are filled
    if (topic && description) {
      chrome.storage.sync.get(["details"], function (result) {
        let details = result.details || [];
        const newDetail = { topic, description };
        if (date) {
          newDetail.date = date;
        }
        if (category) {
          newDetail.category = category;
        }
        details.push(newDetail);
        chrome.storage.sync.set({ details }, function () {
          statusDiv.textContent = "Details saved!";
          displayDetailsByCategory(details);
          form.reset();
        });
      });
    } else {
      statusDiv.textContent =
        "Please fill in required fields (Topic, Description).";
    }
  });

  updateBtn.addEventListener("click", function (event) {
    event.preventDefault();
    const topic = document.getElementById("topic").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const index = document.getElementById("detailId").value;

    // Check if at least topic and description are filled
    if (topic && description) {
      chrome.storage.sync.get(["details"], function (result) {
        let details = result.details || [];
        details[index] = { topic, description };
        if (date) {
          details[index].date = date;
        }
        if (category) {
          details[index].category = category;
        }
        chrome.storage.sync.set({ details }, function () {
          statusDiv.textContent = "Details updated!";
          displayDetailsByCategory(details);
          form.reset();
          form.querySelector('input[type="submit"]').style.display = "inline";
          updateBtn.style.display = "none";
        });
      });
    } else {
      statusDiv.textContent =
        "Please fill in required fields (Topic, Description).";
    }
  });
});
