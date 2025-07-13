// ==UserScript==
// @name         Uncanny Reddit Tales
// @namespace    https://github.com/Myst1cX/uncanny-reddit-tales
// @version      1.0
// @description  Browse horror/scary/uncanny Reddit stories from your own collection of handpicked users and subreddits. Import/export/edit your list, fetch random stories, and more!
// @author       Myst1cX
// @match        https://www.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Modal HTML & CSS ---
    const modalHTML = `
<div id="urt-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#1a1a1bcc; z-index:9999; justify-content:center; align-items:center;">
  <div style="background:#1a1a1b; color:#d7dadc; border-radius:8px; padding:24px; min-width:350px; box-shadow:0 0 15px #000; max-width:90vw;">
    <h2 style="color:#ff4500;">Uncanny Reddit Tales</h2>
    <textarea id="urt-import" placeholder="Paste your list here (r/subreddit, u/username, or any Reddit URL)" style="width:100%;height:60px;background:#222;color:#d7dadc;margin-bottom:8px;border:1px solid #444;border-radius:4px;"></textarea>
    <button id="urt-import-btn" style="background:#ff4500;color:#fff;border:none;padding:6px 12px;margin-right:8px;border-radius:4px;">Import</button>
    <button id="urt-export-btn" style="background:#0079d3;color:#fff;border:none;padding:6px 12px;margin-right:8px;border-radius:4px;">Export</button>
    <input type="file" id="urt-file" style="margin-left:8px; color:#d7dadc; background:#222; border-radius:4px; border:1px solid #444;">
    <br><br>
    <div>
      <h4 style="margin-bottom:2px;">Subreddits <span style="font-size:0.8em;color:#aaa;">(r/name, one per line)</span></h4>
      <textarea id="urt-subreddits" style="width:100%;height:40px;background:#222;color:#d7dadc;border:1px solid #444;border-radius:4px;"></textarea>
      <h4 style="margin-bottom:2px;">Users <span style="font-size:0.8em;color:#aaa;">(u/name, one per line)</span></h4>
      <textarea id="urt-users" style="width:100%;height:40px;background:#222;color:#d7dadc;border:1px solid #444;border-radius:4px;"></textarea>
    </div>
    <br>
    <button id="urt-random-story" style="background:#ff4500;color:#fff;border:none;padding:8px 16px;margin-right:8px;border-radius:4px;">Random Story</button>
    <button id="urt-random-link" style="background:#0079d3;color:#fff;border:none;padding:8px 16px;border-radius:4px;">Random Link</button>
    <button id="urt-close" style="background:#222;color:#fff;border:none;padding:8px 16px;float:right;border-radius:4px;">Close</button>
  </div>
</div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // --- Utility Functions ---
    function parseEntries(text) {
        const subredditSet = new Set();
        const userSet = new Set();
        const lines = text.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);

        for (let entry of lines) {
            entry = entry.replace(/\/+$/, ''); // Remove trailing slashes
            let match;
            if ((match = entry.match(/^https?:\/\/(www\.)?reddit\.com\/r\/([A-Za-z0-9_]+)/i))) {
                subredditSet.add(match[2]);
            } else if ((match = entry.match(/^https?:\/\/(www\.)?reddit\.com\/user\/([A-Za-z0-9_-]+)/i))) {
                userSet.add(match[2]);
            } else if ((match = entry.match(/^r\/([A-Za-z0-9_]+)/))) {
                subredditSet.add(match[1]);
            } else if ((match = entry.match(/^u\/([A-Za-z0-9_-]+)/))) {
                userSet.add(match[1]);
            }
        }
        return { subreddits: Array.from(subredditSet), users: Array.from(userSet) };
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

    function refreshTextAreas() {
        const lists = loadLists();
        document.getElementById('urt-subreddits').value = lists.subreddits.join('\n');
        document.getElementById('urt-users').value = lists.users.join('\n');
    }

    // --- Button Logic ---
    document.getElementById('urt-import-btn').onclick = function() {
        const { subreddits, users } = parseEntries(document.getElementById('urt-import').value);
        document.getElementById('urt-subreddits').value = subreddits.join('\n');
        document.getElementById('urt-users').value = users.join('\n');
        saveLists(subreddits, users);
        alert('List imported and sorted!');
    };

    document.getElementById('urt-export-btn').onclick = function() {
        const subreddits = document.getElementById('urt-subreddits').value.trim().split('\n').map(x=>x.trim()).filter(Boolean);
        const users = document.getElementById('urt-users').value.trim().split('\n').map(x=>x.trim()).filter(Boolean);
        const txt = `Subreddits:\n${subreddits.join('\n')}\n\nUsers:\n${users.join('\n')}`;
        const blob = new Blob([txt], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'uncanny-reddit-tales-list.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // --- Update storage when editing textareas ---
    document.getElementById('urt-subreddits').onblur = document.getElementById('urt-users').onblur = function() {
        const subreddits = document.getElementById('urt-subreddits').value.trim().split('\n').map(x=>x.trim()).filter(Boolean);
        const users = document.getElementById('urt-users').value.trim().split('\n').map(x=>x.trim()).filter(Boolean);
        saveLists(subreddits, users);
    };

    // --- Import from file ---
    document.getElementById('urt-file').onchange = function(evt) {
        const file = evt.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('urt-import').value = e.target.result;
        };
        reader.readAsText(file);
    };

    // --- Random Story ---
    document.getElementById('urt-random-story').onclick = async function() {
        const subs = document.getElementById('urt-subreddits').value.trim().split('\n').filter(Boolean);
        const users = document.getElementById('urt-users').value.trim().split('\n').filter(Boolean);
        const all = [...subs.map(s=>({type:'subreddit',name:s})), ...users.map(u=>({type:'user',name:u}))];
        if (!all.length) return alert('No entries!');

        const chosen = all[Math.floor(Math.random()*all.length)];
        let url;
        if (chosen.type === 'subreddit') {
            url = `https://www.reddit.com/r/${chosen.name}.json?limit=100`;
        } else {
            url = `https://www.reddit.com/user/${chosen.name}/submitted.json?limit=100`;
        }
        try {
            const resp = await fetch(url);
            const json = await resp.json();
            const posts = json.data?.children?.filter(p => p.data?.permalink);
            if (!posts || posts.length === 0) return alert('No posts found!');
            const post = posts[Math.floor(Math.random()*posts.length)].data;
            window.open(`https://www.reddit.com${post.permalink}`,'_blank');
        } catch (e) {
            alert('Failed to fetch stories. Maybe Reddit is rate-limiting or the user/subreddit does not exist.');
        }
    };

    // --- Random Link ---
    document.getElementById('urt-random-link').onclick = function() {
        const subs = document.getElementById('urt-subreddits').value.trim().split('\n').filter(Boolean);
        const users = document.getElementById('urt-users').value.trim().split('\n').filter(Boolean);
        const all = [...subs.map(s=>({type:'subreddit',name:s})), ...users.map(u=>({type:'user',name:u}))];
        if (!all.length) return alert('No entries!');
        const chosen = all[Math.floor(Math.random()*all.length)];
        if (chosen.type === 'subreddit') {
            window.open(`https://www.reddit.com/r/${chosen.name}`,'_blank');
        } else {
            window.open(`https://www.reddit.com/user/${chosen.name}`,'_blank');
        }
    };

    // --- Modal Show/Hide ---
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Uncanny Reddit Tales';
    openBtn.style = 'position:fixed;bottom:20px;right:20px;z-index:9998;background:#ff4500;color:#fff;padding:8px 16px;border:none;border-radius:8px;box-shadow:0 2px 8px #000;cursor:pointer;';
    openBtn.onclick = () => {
        document.getElementById('urt-modal').style.display = 'flex';
        refreshTextAreas();
    };
    document.body.appendChild(openBtn);

    document.getElementById('urt-close').onclick = function() {
        document.getElementById('urt-modal').style.display = 'none';
    };

    // --- Initial load ---
    refreshTextAreas();

})();
