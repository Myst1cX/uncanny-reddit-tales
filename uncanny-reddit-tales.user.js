// ==UserScript==
// @name         Uncanny Reddit Tales
// @namespace    https://github.com/Myst1cX/uncanny-reddit-tales
// @version      2.3
// @description  Browse horror/scary/uncanny Reddit stories from your own collection of handpicked users and subreddits. Import/export/edit your list, fetch random stories, and more!
// @author       Myst1cX
// @match        https://www.reddit.com/*
// @grant        none
// @homepageURL  https://github.com/Myst1cX/uncanny-reddit-tales
// @supportURL   https://github.com/Myst1cX/uncanny-reddit-tales/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/uncanny-reddit-tales/main/uncanny-reddit-tales.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/uncanny-reddit-tales/main/uncanny-reddit-tales.user.js
// ==/UserScript==

(function() {
'use strict';

// --- Compact, Reddit-styled CSS ---
const urtStyle = document.createElement('style');
urtStyle.textContent = `
#urt-modal {
  display: none; position:fixed; top:0; left:0; width:100vw; height:100vh;
  background: rgba(26,26,27,0.97); z-index: 9999; justify-content: center; align-items: center;
}
#urt-modal-container {
  background: #181818; color: #d7dadc; border-radius: 8px; padding: 10px 6px;
  min-width: 280px; max-width: 94vw; box-shadow: 0 0 10px #000;
  display: flex; flex-direction: column; gap: 8px;
}
#urt-title-row {
  display: flex; flex-direction: column; align-items: center; gap: 2px; margin-bottom: 2px;
}
#urt-modal h2 {
  color: #ff4500; font-size: 1.16em; font-weight: 700; margin: 0 0 2px 0; text-align:center; letter-spacing: 0.03em; width: 100%;
}
.urt-sort-inline {
  display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 2px;
}
.urt-list-label {
  display: flex;
  align-items: center;
  font-size: 0.97em;
  margin: 0;
  color: inherit;
  font-weight: 600;
  white-space: nowrap;
  gap: 0;
}
.urt-label-hint {
  color: #aaa;
  font-size: 0.8em;
  font-weight: normal;
  margin-left: 4px;
}
.urt-sort-control {
  display: flex; flex-direction: row; align-items: center; gap: 4px;
  font-size: 0.93em;
}
.urt-sort-control label {
  color: #aaa;
  font-size: 0.8em;
  font-weight: normal;
  margin-right: 2px;
  vertical-align: middle;
  line-height: 1.6;
}
.urt-sort-control select {
  background: #282828;
  color: #d7dadc;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0 5px;
  font-size: 0.93em;
  min-width: 55px;
  max-width: 86px;
  height: 1.8em;
  margin: 0;
  vertical-align: middle;
  line-height: 1.6;
}
.urt-row { display: flex; flex-direction: row; gap: 6px; align-items: center; }
.urt-row.vertical { flex-direction: column; align-items: stretch; gap: 7px; }
#urt-modal textarea, #urt-modal input[type="file"] {
  width: 100%; background: #222; color: #dadada;
  border: 1px solid #333; border-radius: 4px; margin-bottom: 0; padding: 7px; font-size: 0.96em;
}
.urt-buttons {
  display: flex; flex-direction: row; gap: 6px; margin-bottom: 0; justify-content: flex-start;
}
.urt-buttons.bottom { margin-top: 5px; }
#urt-modal button {
  background: #232323;
  color: #e2e2e2;
  border: none;
  padding: 6px 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  min-width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: background .13s, color .13s, box-shadow .13s;
  box-shadow: none;
}
#urt-modal button:hover {
  background: #282828;
  color: #fff;
  box-shadow: 0 0 0 1px #343536;
}
#urt-modal button:active {
  background: #181818;
  color: #d7dadc;
}
.urt-msg {
  background: #1a1a1b;
  color: #ffb000;
  border-radius: 3px;
  padding: 7px;
  margin: 4px 0 0 0;
  font-size: 0.93em;
  text-align: center;
  display: none;
}
@media (max-width: 480px) {
  #urt-modal-container { min-width: unset; padding: 4px 1px; }
  .urt-buttons { flex-direction: column; gap: 5px; }
  .urt-sort-inline { flex-direction: column; align-items: stretch; gap:3px;}
}
#urt-circle-btn {
  position: fixed;
  bottom: 22px;
  right: 30px;
  z-index: 9998;
  width: 38px;
  height: 38px;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: none;
}

#urt-circle-btn:hover {
  background: none;
  border: none;
  box-shadow: none;
}

#urt-circle-btn img, #urt-circle-btn svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
`;
document.head.appendChild(urtStyle);

// --- Modal HTML structure ---
const modalHTML = `
<div id="urt-modal">
  <div id="urt-modal-container">
    <div id="urt-title-row">
      <h2>Uncanny Reddit Tales</h2>
    </div>
    <div class="urt-row">
      <button id="urt-import-btn">Import</button>
      <button id="urt-export-btn">Export</button>
      <input type="file" id="urt-file">
    </div>
    <textarea id="urt-import" placeholder="Paste your list here (r/subreddit, u/username, or any Reddit URL)"></textarea>
    <div class="urt-row vertical">
      <div>
        <div class="urt-sort-inline">
  <div class="urt-list-label">
    Subreddits <span class="urt-label-hint">(r/name, one per line)</span>
  </div>
  <span class="urt-sort-control">
    <label for="urt-sort-subs">Sort:</label>
    <select id="urt-sort-subs">
      <option value="az">A-Z</option>
      <option value="za">Z-A</option>
      <option value="first">First Added</option>
      <option value="last">Last Added</option>
    </select>
  </span>
</div>
        <textarea id="urt-subreddits"></textarea>
      </div>
      <div>
        <div class="urt-sort-inline">
  <div class="urt-list-label">
    Users <span class="urt-label-hint">(u/name, one per line)</span>
  </div>
  <span class="urt-sort-control">
    <label for="urt-sort-users">Sort:</label>
    <select id="urt-sort-users">
      <option value="az">A-Z</option>
      <option value="za">Z-A</option>
      <option value="first">First Added</option>
      <option value="last">Last Added</option>
    </select>
  </span>
</div>
        <textarea id="urt-users"></textarea>
      </div>
    </div>
    <div class="urt-buttons bottom">
      <button id="urt-random-story">Random Story</button>
      <button id="urt-random-link">Random Visit</button>
      <button id="urt-close">Close</button>
    </div>
    <div id="urt-msg" class="urt-msg"></div>
  </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

// --- Utility Functions ---
function showMsg(msg, timeout=3200) {
  const e = document.getElementById('urt-msg');
  e.textContent = msg;
  e.style.display = 'block';
  setTimeout(()=>{e.style.display='none';}, timeout);
}

function parseEntries(text) {
  const subredditSet = new Set();
  const userSet = new Set();

  // Find all r/subreddit matches
  const subMatches = text.match(/(?:^|[^\w\/])r\/([A-Za-z0-9_]+)/gi);
  if (subMatches) {
    subMatches.forEach(match => {
      const sub = match.match(/r\/([A-Za-z0-9_]+)/i);
      if (sub) subredditSet.add(sub[1].toLowerCase());
    });
  }

  // Find all u/username matches
  const userMatches = text.match(/(?:^|[^\w\/])u\/([A-Za-z0-9_-]+)/gi);
  if (userMatches) {
    userMatches.forEach(match => {
      const user = match.match(/u\/([A-Za-z0-9_-]+)/i);
      if (user) userSet.add(user[1].toLowerCase());
    });
  }

  // Also support reddit URLs
  const subUrlMatches = text.match(/reddit\.com\/r\/([A-Za-z0-9_]+)/gi);
  if (subUrlMatches) {
    subUrlMatches.forEach(match => {
      const sub = match.match(/r\/([A-Za-z0-9_]+)/i);
      if (sub) subredditSet.add(sub[1].toLowerCase());
    });
  }
  const userUrlMatches = text.match(/reddit\.com\/user\/([A-Za-z0-9_-]+)/gi);
  if (userUrlMatches) {
    userUrlMatches.forEach(match => {
      const user = match.match(/user\/([A-Za-z0-9_-]+)/i);
      if (user) userSet.add(user[1].toLowerCase());
    });
  }

  return {
    subreddits: Array.from(subredditSet),
    users: Array.from(userSet)
  };
}

function prefixList(list, type) {
  const prefix = type === 'subreddit' ? 'r/' : 'u/';
  return list.map(item => item.startsWith(prefix) ? item : prefix + item);
}

function saveLists(subreddits, users) {
  localStorage.setItem('urt-subreddits', JSON.stringify(subreddits));
  localStorage.setItem('urt-users', JSON.stringify(users));
}

function loadLists() {
  return {
    subreddits: JSON.parse(localStorage.getItem('urt-subreddits') || '[]'),
    users: JSON.parse(localStorage.getItem('urt-users') || '[]')
  };
}

function sortList(list, order) {
  if (order === 'az') return [...list].sort();
  if (order === 'za') return [...list].sort().reverse();
  if (order === 'first') return [...list];
  if (order === 'last') return [...list].reverse();
  return [...list];
}

function refreshTextAreas() {
  const lists = loadLists();
  const subsSort = document.getElementById('urt-sort-subs').value;
  const usersSort = document.getElementById('urt-sort-users').value;
  const sortedSubs = sortList(lists.subreddits, subsSort);
  const sortedUsers = sortList(lists.users, usersSort);
  document.getElementById('urt-subreddits').value = prefixList(sortedSubs, 'subreddit').join('\n');
  document.getElementById('urt-users').value = prefixList(sortedUsers, 'user').join('\n');
}

// --- Button Logic ---
document.getElementById('urt-import-btn').onclick = function() {
  const importText = document.getElementById('urt-import').value.trim();
  if (!importText) {
    showMsg('Paste something to import first!');
    return;
  }
  const { subreddits: importedSubs, users: importedUsers } = parseEntries(importText);
  const lists = loadLists();
  const existingSubs = new Set(lists.subreddits.map(x=>x.toLowerCase()));
  const existingUsers = new Set(lists.users.map(x=>x.toLowerCase()));
  let newSubs = importedSubs.filter(x => !existingSubs.has(x));
  let newUsers = importedUsers.filter(x => !existingUsers.has(x));
  const finalSubs = [...existingSubs, ...newSubs].map(x => x.toLowerCase());
  const finalUsers = [...existingUsers, ...newUsers].map(x => x.toLowerCase());
  saveLists(finalSubs, finalUsers);
  refreshTextAreas();
  document.getElementById('urt-import').value = '';
  document.getElementById('urt-file').value = '';
  showMsg(
    `Imported: ${newSubs.length} subreddit${newSubs.length!==1?'s':''}, ${newUsers.length} user${newUsers.length!==1?'s':''}. ` +
    `Skipped: ${importedSubs.length-newSubs.length} subreddit${(importedSubs.length-newSubs.length)!==1?'s':''}, ${importedUsers.length-newUsers.length} user${(importedUsers.length-newUsers.length)!==1?'s':''} (already in your list).`
  );
};

document.getElementById('urt-export-btn').onclick = function() {
  const subsSort = document.getElementById('urt-sort-subs').value;
  const usersSort = document.getElementById('urt-sort-users').value;
  let subreddits = document.getElementById('urt-subreddits').value.trim().split('\n').map(x => x.replace(/^r\//i,'').trim().toLowerCase()).filter(Boolean);
  let users = document.getElementById('urt-users').value.trim().split('\n').map(x => x.replace(/^u\//i,'').trim().toLowerCase()).filter(Boolean);
  subreddits = sortList(subreddits, subsSort);
  users = sortList(users, usersSort);
  const txt = `Subreddits:\n${prefixList(subreddits, 'subreddit').join('\n')}\n\nUsers:\n${prefixList(users, 'user').join('\n')}`;
  const blob = new Blob([txt], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'uncanny-reddit-tales-list.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  showMsg('Your list was exported as a .txt file!');
};

document.getElementById('urt-sort-subs').onchange = function() { refreshTextAreas(); };
document.getElementById('urt-sort-users').onchange = function() { refreshTextAreas(); };

document.getElementById('urt-subreddits').onblur = function() {
  let subs = document.getElementById('urt-subreddits').value.trim().split('\n').map(x=>x.replace(/^r\//i,'').trim().toLowerCase()).filter(Boolean);
  subs = Array.from(new Set(subs));
  saveLists(subs, loadLists().users);
  refreshTextAreas();
};
document.getElementById('urt-users').onblur = function() {
  let users = document.getElementById('urt-users').value.trim().split('\n').map(x=>x.replace(/^u\//i,'').trim().toLowerCase()).filter(Boolean);
  users = Array.from(new Set(users));
  saveLists(loadLists().subreddits, users);
  refreshTextAreas();
};

document.getElementById('urt-file').onchange = function(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('urt-import').value = e.target.result;
    document.getElementById('urt-file').value = '';
  };
  reader.readAsText(file);
};

function getCurrentList(type) {
  const textarea = document.getElementById(type === 'subreddit' ? 'urt-subreddits' : 'urt-users');
  const lines = textarea.value.trim().split('\n').map(x => x.trim()).filter(Boolean);
  if (type === 'subreddit') return lines.map(x => x.replace(/^r\//i, '').toLowerCase());
  else return lines.map(x => x.replace(/^u\//i, '').toLowerCase());
}

document.getElementById('urt-random-story').onclick = async function() {
  refreshTextAreas(); // Ensure textarea is up to date
  const subs = document.getElementById('urt-subreddits').value
  .split('\n').map(x => x.replace(/^r\//i, '').trim().toLowerCase()).filter(Boolean);
if (!subs.length) return showMsg('No subreddits to pick from!');
const chosen = subs[Math.floor(Math.random() * subs.length)];
const url = `https://www.reddit.com/r/${chosen}.json?limit=100`;
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    const posts = json.data?.children?.filter(p => p.data?.permalink);
    if (!posts || posts.length === 0) return showMsg('No posts found for this entry.');
    const post = posts[Math.floor(Math.random()*posts.length)].data;
    window.location.href = `https://www.reddit.com${post.permalink}`;
  } catch (e) {
    showMsg('Problem fetching story. Reddit may be rate-limiting, or the entry does not exist.');
  }
};

document.getElementById('urt-random-link').onclick = function() {
  refreshTextAreas(); // Ensure textarea is up to date
  const subs = document.getElementById('urt-subreddits').value
  .split('\n').map(x => x.replace(/^r\//i, '').trim().toLowerCase()).filter(Boolean);
  const users = document.getElementById('urt-users').value
  .split('\n').map(x => x.replace(/^u\//i, '').trim().toLowerCase()).filter(Boolean);
  const all = [...subs.map(s=>({type:'subreddit',name:s})), ...users.map(u=>({type:'user',name:u}))];
  if (!all.length) return showMsg('No subreddits or users to pick from!');
  const chosen = all[Math.floor(Math.random()*all.length)];
  if (chosen.type === 'subreddit') {
    window.location.href = `https://www.reddit.com/r/${chosen.name}`;
  } else {
    window.location.href = `https://www.reddit.com/user/${chosen.name}`;
  }
};

// --- Modal Show/Hide circle button with Reddit-style refresh icon ---
const circleBtn = document.createElement('div');
circleBtn.id = 'urt-circle-btn';
circleBtn.title = 'Uncanny Reddit Tales';
circleBtn.innerHTML = `<img src="https://raw.githubusercontent.com/Myst1cX/uncanny-reddit-tales/main/Readdit.png"
  alt="Uncanny Reddit Tales Icon"
  style="width:100%;height:100%;object-fit:contain;display:block;" />`;

circleBtn.onclick = () => {
  const modal = document.getElementById('urt-modal');
  if (modal.style.display === 'flex') {
    modal.style.display = 'none';
  } else {
    modal.style.display = 'flex';
    refreshTextAreas();
    document.getElementById('urt-msg').style.display = 'none';
  }
};

document.body.appendChild(circleBtn);

document.getElementById('urt-close').onclick = function() {
  document.getElementById('urt-modal').style.display = 'none';
};

refreshTextAreas();

})();
