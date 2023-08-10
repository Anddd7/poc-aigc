const CHATGPT_ORIGIN = 'https://chat.openai.com';

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);
    if (url.origin === CHATGPT_ORIGIN) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    } else {
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender);
    if (message.action === "copyToTextArea") {
        writeToTextArea(message.tabId, message.text);
        sendResponse({ success: true });
    }
});

function writeToTextArea(tabId, text) {
    // 在这里找到当前标签页中的 textarea（id 为 "prompt-area"）并将内容写入
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: function (text) {
            const textarea = document.getElementById("prompt-textarea");
            if (textarea) {
                textarea.value = text;
            }
        },
        args: [text],
    });
}