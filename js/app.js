// RAMFAM ARCHIVE — site logic. Edit js/data.js to add footage, not this file.

let player = null;
let playerReady = false;
let pendingLoad = null; // { youtubeId, time } queued until player is ready
let currentVideo = null;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt-player', {
    videoId: '',
    playerVars: { rel: 0 },
    events: {
      onReady: () => {
        playerReady = true;
        if (pendingLoad) {
          player.loadVideoById(pendingLoad.youtubeId, pendingLoad.time);
          pendingLoad = null;
        }
      }
    }
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function playVideoAt(video, seconds) {
  currentVideo = video;
  if (playerReady) {
    player.loadVideoById(video.youtubeId, seconds);
  } else {
    pendingLoad = { youtubeId: video.youtubeId, time: seconds };
  }
  document.getElementById('now-playing-title').textContent = `${video.year} — ${video.title}`;
  renderChapterList(video, seconds);
  document.getElementById('player-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChapterList(video, activeTime) {
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  video.clips
    .slice()
    .sort((a, b) => a.time - b.time)
    .forEach(clip => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'clip-row' + (clip.time === activeTime ? ' active' : '');
      btn.innerHTML = `<span class="clip-time">${formatTime(clip.time)}</span><span>${clip.label}</span><span class="clip-meta">${clip.people.join(', ')}</span>`;
      btn.addEventListener('click', () => playVideoAt(video, clip.time));
      li.appendChild(btn);
      list.appendChild(li);
    });
}

function groupByYear() {
  const years = {};
  VIDEOS.forEach(v => {
    (years[v.year] = years[v.year] || []).push(v);
  });
  return Object.keys(years).sort((a, b) => a - b).map(y => ({ year: Number(y), videos: years[y] }));
}

function allPeople() {
  const set = new Set();
  VIDEOS.forEach(v => v.clips.forEach(c => c.people.forEach(p => set.add(p))));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function renderYearPanel() {
  const container = document.getElementById('year-list');
  container.innerHTML = '';
  const groups = groupByYear();

  const yearBtns = document.createElement('div');
  yearBtns.className = 'year-list';
  const sublist = document.createElement('div');
  sublist.className = 'video-sublist';

  function selectYear(group, yearBtn) {
    [...yearBtns.children].forEach(b => b.classList.remove('active'));
    yearBtn.classList.add('active');
    sublist.innerHTML = '';
    group.videos.forEach(video => {
      const vBtn = document.createElement('button');
      vBtn.className = 'video-pick';
      vBtn.textContent = video.title;
      vBtn.addEventListener('click', () => {
        [...sublist.children].forEach(b => b.classList.remove('active'));
        vBtn.classList.add('active');
        playVideoAt(video, video.clips[0] ? video.clips[0].time : 0);
      });
      sublist.appendChild(vBtn);
    });
    if (group.videos.length === 1) {
      sublist.firstChild.click();
    }
  }

  groups.forEach((group, i) => {
    const btn = document.createElement('button');
    btn.className = 'pick-btn';
    btn.textContent = group.year;
    btn.addEventListener('click', () => selectYear(group, btn));
    yearBtns.appendChild(btn);
  });

  container.appendChild(yearBtns);
  container.appendChild(sublist);

  if (groups.length) {
    yearBtns.firstChild.click();
  } else {
    container.innerHTML = '<p class="empty-note">No videos yet — add one in js/data.js.</p>';
  }
}

function renderPeoplePanel() {
  const peopleContainer = document.getElementById('people-list');
  const clipList = document.getElementById('person-clip-list');
  peopleContainer.innerHTML = '';
  clipList.innerHTML = '';

  const people = allPeople();

  function selectPerson(person, btn) {
    [...peopleContainer.children].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clipList.innerHTML = '';

    const rows = [];
    VIDEOS.forEach(video => {
      video.clips.forEach(clip => {
        if (clip.people.includes(person)) rows.push({ video, clip });
      });
    });
    rows.sort((a, b) => a.video.year - b.video.year || a.clip.time - b.clip.time);

    if (!rows.length) {
      clipList.innerHTML = `<p class="empty-note">No clips tagged for ${person} yet.</p>`;
      return;
    }

    rows.forEach(({ video, clip }) => {
      const li = document.createElement('li');
      const btnRow = document.createElement('button');
      btnRow.className = 'clip-row';
      btnRow.innerHTML = `<span class="clip-time">${video.year}</span><span>${clip.label}</span><span class="clip-meta">${formatTime(clip.time)}</span>`;
      btnRow.addEventListener('click', () => playVideoAt(video, clip.time));
      li.appendChild(btnRow);
      clipList.appendChild(li);
    });
  }

  people.forEach(person => {
    const btn = document.createElement('button');
    btn.className = 'pick-btn';
    btn.textContent = person;
    btn.addEventListener('click', () => selectPerson(person, btn));
    peopleContainer.appendChild(btn);
  });

  if (people.length) {
    peopleContainer.firstChild.click();
  } else {
    peopleContainer.innerHTML = '<p class="empty-note">No people tagged yet — add "people" to clips in js/data.js.</p>';
  }
}

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.panel').forEach(p => {
        p.hidden = p.dataset.panel !== btn.dataset.tab;
      });
    });
  });
}

initTabs();
renderYearPanel();
renderPeoplePanel();
