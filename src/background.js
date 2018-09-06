import './img/icon-128.png';

const inspectors = [];

chrome.windows.onRemoved.addListener(id => {
  const pos = inspectors.findIndex(({popup}) => popup.id === id);
  if (pos >= 0) {
    if (inspectors[pos].active) {
      chrome.debugger.detach({tabId: inspectors[pos].id});
    }
    inspectors.splice(pos, 1);
  }
});
chrome.debugger.onDetach.addListener(({tabId}) => {
  const inspector = inspectors.find(({id}) => id === tabId);
  if (inspector) {
    inspector.active = false;
  }
});

chrome.browserAction.onClicked.addListener(tab => {
  const inspector = inspectors.find(({id}) => id === tab.id);
  if (inspector && inspector.active) {
    chrome.windows.update(inspector.popup.id, {focused: true});
  } else {
    chrome.debugger.attach({tabId: tab.id}, "1.0", () => {
      if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
        return;
      }

      const inspector = inspectors.find(({id}) => id === tab.id);
      if (inspector) {
        inspector.active = true;
        chrome.runtime.sendMessage({
          message: "reattach",
          tabId: tab.id,
        });
        chrome.windows.update(inspector.popup.id, {focused: true});
      } else {
        chrome.windows.create({url: "inspector.html?" + tab.id, type: "popup", width: 800, height: 600}, wnd => {
          inspectors.push({id: tab.id, popup: wnd, active: true});
        });
      }
    });
  }
});
