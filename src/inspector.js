import React from 'react';
import ReactDOM from 'react-dom';
import './reset.css';
import App from './viewer/App';

const tabId = parseInt(window.location.search.substr(1));

const handlers = {};

function startDebugging() {
  chrome.debugger.sendCommand({tabId}, "Network.enable", null, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else {
      console.log("Network enabled");
    }
  });

  chrome.tabs.get(tabId, tab => {
    if (tab.title) {
      document.title = "WebSocket Inspector - " + tab.title;
    } else {
      document.title = "WebSocket Inspector";
    }
  });
}

chrome.runtime.onMessage.addListener(message => {
  if (message.message === "reattach" && message.tabId === tabId) {
    startDebugging();
  }
});

chrome.debugger.onEvent.addListener((debuggee, message, params) => {
  if (debuggee.tabId !== tabId) {
    return;
  }

  if (handlers[message]) {
    handlers[message](params);
  }
});

window.addEventListener("load", function() {
  startDebugging();
});

ReactDOM.render(<App handlers={handlers}/>, document.getElementById('root'));
