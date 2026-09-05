// RAMFAM ARCHIVE — site logic. Edit js/data.js to add footage, not this file.

let player = null;
let playerReady = false;
let pendingLoad = null; // { youtubeId, time } queued until player is ready
let currentVideo = null;
let ticksRenderedFor = null;
let progressTimer = null;

const els = {};

function cacheEls() {
  els.bigPlay = document.getElementById('big-play');
  els.clickCatcher = document.getElementById('click-catcher');
  els.playToggle = document.getElementById('play-toggle');
  els.muteToggle = document.getElementById('mute-toggle');
  els.scrubTrack = document.getElementById('scrub-track');
  els.scrubFill = document.getElementById('scrub-fill');
  els.scrubTicks = document.getElementById('scrub-ticks');
  els.timeDisplay = document.getElementById('time-display');
  els.unmuteHint = document.getElementById('unmute-hint');
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt-player', {
    videoId: '',
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      playsinline: 1,
      disablekb: 1,
      fs: 0
    },
    events: {
      onReady: () => {
        playerReady = true;
        if (pendingLoad) {
          player.loadVideoById(pendingLoad.youtubeId, pendingLoad.time);
          pendingLoad = null;
        }
      },
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  const playing = event.data === YT.PlayerState.PLAYING;
  setPlayingUI(playing);
  if (playing) startProgressLoop(); else stopProgressLoop();
}

function setPlayingUI(playing) {
  els.bigPlay.hidden = playing;
  els.playToggle.querySelector('.icon-pause').hidden = !playing;
  els.playToggle.querySelector('.icon-play').hidden = playing;
}

function updateMuteUI() {
  if (!player || !player.isMuted) return;
  const muted = player.isMuted();
  els.muteToggle.querySelector('.icon-unmuted').hidden = muted;
  els.muteToggle.querySelector('.icon-muted').hidden = !muted;
}

function startProgressLoop() {
  if (progressTimer) return;
  progressTimer = setInterval(tickProgress, 300);
  tickProgress();
}

function stopProgressLoop() {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  tickProgress();
}

function tickProgress() {
  if (!player || !player.getDuration || !currentVideo) return;
  const duration = player.getDuration() || 0;
  const current = player.getCurrentTime() || 0;
  els.timeDisplay.textContent = duration ? `${formatTime(current)} / ${formatTime(duration)}` : formatTime(current);
  els.scrubFill.style.width = duration ? `${Math.min(100, (current / duration) * 100)}%` : '0%';
  updateMuteUI();

  if (duration && ticksRenderedFor !== currentVideo.id) {
    renderScrubTicks(currentVideo, duration);
    ticksRenderedFor = currentVideo.id;
  }
  updateActiveClipUI(current);
}

function renderScrubTicks(video, duration) {
  els.scrubTicks.innerHTML = '';
  video.clips.forEach(clip => {
    const tick = document.createElement('div');
    tick.className = 'scrub-tick';
    tick.style.left = `${Math.min(100, (clip.time / duration) * 100)}%`;
    tick.addEventListener('click', e => {
      e.stopPropagation();
      playVideoAt(video, clip.time);
    });
    els.scrubTicks.appendChild(tick);
  });
}

function updateActiveClipUI(currentTime) {
  const rows = document.querySelectorAll('.clip-row[data-video]');
  let best = null;
  rows.forEach(row => {
    if (row.dataset.video !== currentVideo.id) { row.classList.remove('active'); return; }
    const t = Number(row.dataset.time);
    if (t <= currentTime + 0.75 && (!best || t > Number(best.dataset.time))) best = row;
  });
  rows.forEach(row => {
    if (row.dataset.video === currentVideo.id) row.classList.toggle('active', row === best);
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function playVideoAt(video, seconds) {
  currentVideo = video;
  ticksRenderedFor = null;
  els.scrubFill.style.width = '0%';
  els.scrubTicks.innerHTML = '';

  if (playerReady) {
    player.loadVideoById(video.youtubeId, seconds);
    player.mute();
  } else {
    pendingLoad = { youtubeId: video.youtubeId, time: seconds };
  }
  els.unmuteHint.hidden = false;
  updateMuteUI();

  document.getElementById('now-playing-title').textContent = `${video.year} — ${video.title}`;
  renderChapterList(video);
  document.getElementById('player-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChapterList(video) {
  const list = document.getElementById('chapter-list');
  list.innerHTML = '';
  video.clips
    .slice()
    .sort((a, b) => a.time - b.time)
    .forEach(clip => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'clip-row';
      btn.dataset.video = video.id;
      btn.dataset.time = clip.time;
      const meta = clip.people.length ? clip.people.join(', ') : '';
      btn.innerHTML = `<span class="clip-time">${formatTime(clip.time)}</span><span>${clip.label}</span><span class="clip-meta">${meta}</span>`;
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

let dialYears = [];
let dialScrollDebounce = null;
let lastSelectedYear = null;

function buildDialYears() {
  const groupMap = new Map(groupByYear().map(g => [g.year, g]));
  const years = [];
  for (let y = YEAR_RANGE.first; y <= YEAR_RANGE.last; y++) {
    years.push({ year: y, group: groupMap.get(y) || null });
  }
  return years;
}

function renderYearPanel() {
  const dial = document.getElementById('year-dial');
  dial.innerHTML = '';
  dialYears = buildDialYears();

  if (!dialYears.length) {
    dial.parentElement.hidden = true;
    document.getElementById('video-sublist').innerHTML = '<p class="empty-note">No videos yet — add one in js/data.js.</p>';
    return;
  }

  dialYears.forEach(entry => {
    const btn = document.createElement('button');
    btn.className = 'year-dial-item' + (entry.group ? '' : ' empty-year');
    btn.textContent = entry.year;
    btn.dataset.year = entry.year;
    btn.addEventListener('click', () => {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    dial.appendChild(btn);
  });

  dial.addEventListener('scroll', onDialScroll);
  window.addEventListener('resize', updateDialVisualState);

  // Land on the first year that actually has footage, or the very first
  // year in the range if nothing has been added yet.
  const initial = dialYears.find(e => e.group) || dialYears[0];
  requestAnimationFrame(() => {
    const btn = dial.querySelector(`[data-year="${initial.year}"]`);
    if (btn) btn.scrollIntoView({ block: 'center' });
    updateDialVisualState();
    selectYear(initial.year);
  });
}

function onDialScroll() {
  updateDialVisualState();
  clearTimeout(dialScrollDebounce);
  dialScrollDebounce = setTimeout(() => {
    const centered = getCenteredDialItem();
    if (centered) selectYear(Number(centered.dataset.year));
  }, 120);
}

function getCenteredDialItem() {
  const dial = document.getElementById('year-dial');
  const rect = dial.getBoundingClientRect();
  const centerY = rect.top + rect.height / 2;
  let closest = null;
  let closestDist = Infinity;
  dial.querySelectorAll('.year-dial-item').forEach(item => {
    const r = item.getBoundingClientRect();
    const dist = Math.abs((r.top + r.height / 2) - centerY);
    if (dist < closestDist) { closestDist = dist; closest = item; }
  });
  return closest;
}

function updateDialVisualState() {
  const dial = document.getElementById('year-dial');
  const rect = dial.getBoundingClientRect();
  const centerY = rect.top + rect.height / 2;
  dial.querySelectorAll('.year-dial-item').forEach(item => {
    const r = item.getBoundingClientRect();
    const dist = Math.abs((r.top + r.height / 2) - centerY);
    const norm = Math.min(1, dist / (rect.height / 2));
    item.style.transform = `scale(${(1.15 - norm * 0.45).toFixed(3)})`;
    item.style.opacity = (1 - norm * 0.75).toFixed(3);
    item.classList.toggle('centered', dist < 18);
  });
}

function selectYear(year) {
  if (year === lastSelectedYear) return;
  lastSelectedYear = year;

  const entry = dialYears.find(e => e.year === year);
  const container = document.getElementById('video-sublist');
  container.innerHTML = '';

  if (!entry || !entry.group) {
    container.innerHTML = `<p class="empty-note">No footage from ${year} yet — add one in js/data.js.</p>`;
    return;
  }

  entry.group.videos.forEach(video => {
    const vBtn = document.createElement('button');
    vBtn.className = 'video-pick';
    vBtn.textContent = video.title;
    vBtn.addEventListener('click', () => {
      [...container.children].forEach(b => b.classList && b.classList.remove('active'));
      vBtn.classList.add('active');
      playVideoAt(video, video.clips[0] ? video.clips[0].time : 0);
    });
    container.appendChild(vBtn);
  });

  if (entry.group.videos.length === 1) {
    container.firstChild.click();
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
      btnRow.dataset.video = video.id;
      btnRow.dataset.time = clip.time;
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

function initCustomControls() {
  els.clickCatcher.addEventListener('click', () => {
    if (!player || !player.getPlayerState) return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  });

  els.bigPlay.addEventListener('click', () => { if (player) player.playVideo(); });

  els.playToggle.addEventListener('click', () => {
    if (!player || !player.getPlayerState) return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  });

  els.muteToggle.addEventListener('click', () => {
    if (!player) return;
    if (player.isMuted()) player.unMute(); else player.mute();
    updateMuteUI();
    if (!player.isMuted()) els.unmuteHint.hidden = true;
  });

  els.unmuteHint.addEventListener('click', () => {
    if (!player) return;
    player.unMute();
    updateMuteUI();
    els.unmuteHint.hidden = true;
  });

  els.scrubTrack.addEventListener('click', e => {
    if (!player || !player.getDuration) return;
    const duration = player.getDuration();
    if (!duration) return;
    const rect = els.scrubTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    player.seekTo(ratio * duration, true);
  });
}

cacheEls();
initTabs();
initCustomControls();
renderYearPanel();
renderPeoplePanel();
