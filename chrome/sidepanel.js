document.addEventListener("DOMContentLoaded", function () {
    const createPromptButton = document.getElementById("createPromptButton");
    const promptList = document.getElementById("promptList");

    // Load and render existing prompts on first load
    loadAndRenderPrompts();

    createPromptButton.addEventListener("click", function () {
        showPromptDialog();
    });

    function loadAndRenderPrompts() {
        chrome.storage.sync.get(["prompts"], function (result) {
            const prompts = result.prompts || [];
            prompts.forEach((prompt) => {
                addPromptToUI(prompt.title, prompt.content);
            });
        });
    }

    function showPromptDialog() {
        const dialog = document.createElement("div");
        dialog.classList.add("panel", "input-panel", "prompt-dialog");
        dialog.innerHTML = `
        <h3>Add new Prompt</h3>
        <label for="title">Title:</label>
        <input type="text" id="title" required><br>
        <label for="content">Content:</label>
        <textarea id="content" rows="4" required></textarea><br>
        <button id="savePromptButton">Save</button>
      `;

        const savePromptButton = dialog.querySelector("#savePromptButton");
        savePromptButton.addEventListener("click", function () {
            const title = dialog.querySelector("#title").value;
            const content = dialog.querySelector("#content").value;
            if (title && content) {
                savePrompt(title, content);
                addPromptToUI(title, content);
                dialog.remove();
            }
        });

        promptList.insertBefore(dialog, promptList.firstChild);
    }

    function savePrompt(title, content) {
        chrome.storage.sync.get(["prompts"], function (result) {
            const prompts = result.prompts || [];
            prompts.push({ title: title, content: content });
            chrome.storage.sync.set({ prompts: prompts }, function () {
                console.log("Prompt saved to storage.");
            });
        });
    }

    function addPromptToUI(title, content, index) {
        const promptPanel = document.createElement("div");
        promptPanel.classList.add("panel", "prompt-panel");
        promptPanel.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
        `;

        promptPanel.addEventListener("click", function () {
            copyToClipboard(content);
        });

        promptList.appendChild(promptPanel);
    }


    function copyToClipboard(text) {
        const variablePattern = /{{(.*?)}}/g;
        const variables = text.match(variablePattern);

        if (variables && variables.length > 0) {
            showVariableDialog(variables, text);
        } else {
            copyText(text);
        }
    }

    function showVariableDialog(variables, originalText) {
        const dialog = document.createElement("div");
        dialog.classList.add("panel", "input-panel", "variable-dialog");
        dialog.innerHTML = `
          <h3>Fill in Variables</h3>
          ${variables.map((variable) => `<label>${variable}: <input type="text" data-variable="${variable}"></label><br><br>`).join("")}
          <button id="replaceVariablesButton">Replace and Copy</button>
        `;

        const replaceVariablesButton = dialog.querySelector("#replaceVariablesButton");
        replaceVariablesButton.addEventListener("click", function () {
            const replacedText = replaceVariables(originalText, dialog);
            copyText(replacedText);
            dialog.remove();
        });

        promptList.insertBefore(dialog, promptList.firstChild);
    }

    function replaceVariables(text, dialog) {
        const inputElements = dialog.querySelectorAll("input[data-variable]");
        inputElements.forEach((inputElement) => {
            const variable = inputElement.getAttribute("data-variable");
            const value = inputElement.value;
            text = text.replace(new RegExp(variable, "g"), value);
        });

        return text;
    }

    function copyText(text) {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log("Text copied to clipboard");
                console.log(text);
            })
            .catch((error) => {
                console.error("Unable to copy text: ", error);
            });
    }
});
