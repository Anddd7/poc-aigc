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
                addPromptToUI(prompt.id, prompt.title, prompt.content);
            });
        });
    }

    let promptDialog = null;

    function showPromptDialog() {
        if (promptDialog) {
            return;
        }

        promptDialog = document.createElement("div");
        promptDialog.classList.add("panel", "input-panel", "prompt-dialog");
        promptDialog.innerHTML = `
        <h3>Add new Prompt</h3>
        <label for="title">Title:</label>
        <input type="text" id="title" required><br>
        <label for="content">Content:</label>
        <textarea id="content" rows="4" required></textarea><br>
        <button id="savePromptButton">Save</button>
      `;

        const savePromptButton = promptDialog.querySelector("#savePromptButton");
        savePromptButton.addEventListener("click", function () {
            const id = new Date().getTime();
            const title = promptDialog.querySelector("#title").value;
            const content = promptDialog.querySelector("#content").value;
            if (title && content) {
                savePrompt(id, title, content);
                addPromptToUI(id, title, content);
                promptDialog.remove();
                promptDialog = null;
            }
        });

        promptList.insertBefore(promptDialog, promptList.firstChild);
    }

    function savePrompt(id, title, content) {
        chrome.storage.sync.get(["prompts"], function (result) {
            const prompts = result.prompts || [];
            prompts.push({ id: id, title: title, content: content });
            chrome.storage.sync.set({ prompts: prompts }, function () {
                console.log("Prompt saved to storage.");
            });
        });
    }

    function addPromptToUI(id, title, content) {
        const promptPanel = document.createElement("div");
        promptPanel.classList.add("panel", "prompt-panel");
        promptPanel.innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
        <button class="delete-prompt-button" data-index="${id}">X</button>
        `;

        promptPanel.addEventListener("click", function () {
            copyToClipboard(content);
        });

        const deleteButton = promptPanel.querySelector(".delete-prompt-button");
        deleteButton.addEventListener("click", function (event) {
            event.stopPropagation();
            deletePrompt(id);
            promptPanel.remove();
        });

        promptList.appendChild(promptPanel);
    }

    function deletePrompt(index) {
        chrome.storage.sync.get(["prompts"], function (result) {
            const prompts = result.prompts || [];
            prompts.splice(prompts.findIndex((prompt) => prompt.id === index), 1);
            chrome.storage.sync.set({ prompts: prompts }, function () {
                console.log("Prompt deleted from storage.");
            });
        });
    }

    function copyToClipboard(text) {
        const variablePattern = /{{(.*?)}}/g;
        const variables = text.match(variablePattern);

        if (variables && variables.length > 0) {
            const uniqueVariables = [...new Set(variables)];
            showVariableDialog(uniqueVariables, text);
        } else {
            copyText(text);
        }
    }

    let variableDialog = null;

    function showVariableDialog(variables, originalText) {
        if (!variableDialog) {
            createVariableDialog(variables, originalText);
        } else {
            updateVariableDialog(variables, originalText);
        }
    }

    function createVariableDialog(variables, originalText) {
        variableDialog = document.createElement("div");
        variableDialog.classList.add("panel", "input-panel", "variable-dialog");
        variableDialog.innerHTML = `
        <h3>Fill in Variables</h3>
        ${variables.map((variable) => `<label>${variable}: <input type="text" data-variable="${variable}"></label><br>`).join("")}
        <button id="replaceVariablesButton">Replace and Copy</button>
        `;

        const replaceVariablesButton = variableDialog.querySelector("#replaceVariablesButton");
        replaceVariablesButton.addEventListener("click", function () {
            const replacedText = replaceVariables(originalText, variableDialog);
            copyText(replacedText);
            variableDialog.remove();
            variableDialog = null;
        });

        promptList.insertBefore(variableDialog, promptList.firstChild);
    }

    function updateVariableDialog(variables, originalText) {
        // const inputContainer = variableDialog.querySelector(".variable-dialog");
        variableDialog.innerHTML = `
        <h3>Fill in Variables</h3>
        ${variables.map((variable) => `<label>${variable}: <input type="text" data-variable="${variable}"></label><br>`).join("")}
        <button id="replaceVariablesButton">Replace and Copy</button>
        `;

        const replaceVariablesButton = variableDialog.querySelector("#replaceVariablesButton");
        replaceVariablesButton.addEventListener("click", function () {
            const replacedText = replaceVariables(originalText, variableDialog);
            copyText(replacedText);
            variableDialog.remove();
            variableDialog = null;
        });
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
