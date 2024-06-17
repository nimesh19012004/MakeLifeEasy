document.addEventListener("DOMContentLoaded", function () {
  const autofillBtn = document.getElementById("autofillBtn");
  const form = document.getElementById("detailsForm");
  const statusDiv = document.getElementById("status");
  const savedDetailsDiv = document.getElementById("savedDetails");
  const updateBtn = document.getElementById("updateBtn");
  let editingIndex = null;
  const body = document.body;
  const darkModeToggle = document.getElementById("darkModeToggle");

  // Check if dark mode preference is stored and apply it
  chrome.storage.sync.get("darkMode", function (result) {
    if (result.darkMode) {
      body.classList.add("dark-mode");
    }
  });

  darkModeToggle.addEventListener("click", function () {
    body.classList.toggle("dark-mode");

    // Store dark mode preference
    const darkModeEnabled = body.classList.contains("dark-mode");
    chrome.storage.sync.set({ darkMode: darkModeEnabled });

    // Update saved details display for dark mode
    const savedDetailsDiv = document.getElementById("savedDetails");
    savedDetailsDiv.classList.toggle("dark-mode");
  });

  function displayDetailsByCategory(details) {
    savedDetailsDiv.innerHTML = "";

    const detailsByCategory = {};
    details.forEach((detail, index) => {
      if (!detailsByCategory[detail.category]) {
        detailsByCategory[detail.category] = [];
      }
      detailsByCategory[detail.category].push({ ...detail, index });
    });

    for (const category in detailsByCategory) {
      if (category) {
        const categoryHeader = document.createElement("h3");
        categoryHeader.textContent = category || "Uncategorized";
        savedDetailsDiv.appendChild(categoryHeader);

        detailsByCategory[category].forEach((detail) => {
          const detailDiv = document.createElement("div");
          detailDiv.classList.add("detail");
          detailDiv.innerHTML = `
          <div class="detail-content"><strong>Topic:</strong> ${
            detail.topic
          }</div>
          <div class="detail-content"><strong>Description:</strong> ${
            detail.description
          }</div>
          ${
            detail.date
              ? `<div><strong>Date:</strong> ${detail.date}</div>`
              : ""
          }
          <button data-index="${detail.index}" class="editBtn">Edit</button>
          <button data-index="${detail.index}" class="deleteBtn">Delete</button>
          <button data-description="${
            detail.description
          }" class="copyBtn">Copy</button>
          <hr>`;
          savedDetailsDiv.appendChild(detailDiv);
        });
      }
    }

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

  autofillBtn.addEventListener("click", function () {
    chrome.storage.sync.get(["details"], function (result) {
      const details = result.details || [];
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "autofillForms", details: details },
          function (response) {
            // console.log(response.status);
          }
        );
      });
    });
  });
});
