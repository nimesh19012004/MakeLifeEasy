// contentScript.js
function autofillForms(details) {
  if (details.length > 0) {
    details.forEach((detail) => {
      const { topic, description } = detail;
      const formLabels = document.querySelectorAll("label");
      formLabels.forEach((label) => {
        const labelText = label.textContent.toLowerCase();
        if (labelText.includes(topic.toLowerCase())) {
          let input = document.getElementById(label.getAttribute("for"));

          if (!input) {
            // Try to find input field within the same container as the label
            input = label.querySelector("input, textarea, select");
          }

          if (!input) {
            // Try to find input field in the next sibling elements
            let sibling = label.nextElementSibling;
            while (sibling && !input) {
              if (
                sibling.tagName === "INPUT" ||
                sibling.tagName === "TEXTAREA" ||
                sibling.tagName === "SELECT"
              ) {
                input = sibling;
              }
              sibling = sibling.nextElementSibling;
            }
          }

          if (input) {
            input.value = description;
            const event = new Event("input", { bubbles: true });
            input.dispatchEvent(event);
          }
        }
      });
    });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofillForms") {
    autofillForms(request.details);
    sendResponse({ status: "Forms autofilled" });
  }
});
