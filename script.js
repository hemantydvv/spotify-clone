let currentSong = new Audio();
let songs = [];
let currIndex = -1;
let lastVolume = 0.75;
let currentFolder = "";

async function getSongs(folder) {
  try {
    const res = await fetch(`/songs/${folder}/`);
    if (!res.ok) return [];
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;
    const songsList = [];
    for (const a of div.querySelectorAll("a")) {
      if (a.href.toLowerCase().endsWith(".mp3")) {
        songsList.push(a.href.split('/').pop());
      }
    }
    return songsList;
  } catch (err) {
    console.error("Error loading songs:", err);
    return [];
  }
}

function secondsToTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getArtist(folder) {
  if (folder === "guru-randhawa") return "Guru Randhawa";
  if (folder === "karan-ahujla" || folder === "karan ahujla") return "Karan Aujla";
  if (folder === "no-copyright-vibes") return "No Copyright Vibes";
  return "Hemant Yadav";
}

function playMusic(index, isRandom = false) {
  if (index < 0 || index >= songs.length || !currentFolder) return;

  currIndex = index;
  const track = songs[index];
  currentSong.src = `/songs/${currentFolder}/${track}`;
  currentSong.play().catch(err => console.error("Playback failed:", err));

  document.getElementById("play").src = "playbutton/pause.svg";

  const barSongInfo = document.querySelector(".bar-songinfo");
  if (barSongInfo) {
    barSongInfo.innerHTML = `
      <div>${track.replace(/\.mp3$/i, "")}</div>
      <div>${getArtist(currentFolder)}${isRandom ? " • Random" : ""}</div>
    `;
  }

  document.querySelectorAll(".songList li").forEach((li, i) => {
    li.classList.toggle("playing", i === index);
  });
}

async function renderLibrarySongs(folder) {
  currentFolder = folder;
  songs = await getSongs(folder);
  console.log(`Loaded ${songs.length} songs from /songs/${folder}/`);

  const songUL = document.querySelector(".songList ul");
  if (!songUL) return;
  songUL.innerHTML = "";

  if (songs.length === 0) {
    songUL.innerHTML = `<li>No songs found in this playlist</li>`;
    return;
  }

  songs.forEach((song, index) => {
    songUL.innerHTML += `
      <li data-index="${index}">
        ${song.replace(/\.mp3$/i, "")}
        <div>${getArtist(folder)}</div>
        <div class="play-now">Play Now</div>
      </li>`;
  });

  document.querySelectorAll(".songList li").forEach(li => {
    li.addEventListener("click", () => {
      playMusic(parseInt(li.dataset.index));
    });
  });
}

function setupControls() {
  // Play/Pause
  document.getElementById("play").addEventListener("click", () => {
    if (!currentSong.src || currentSong.ended || currentSong.currentTime === 0) {
      if (songs.length === 0) return;
      playMusic(Math.floor(Math.random() * songs.length), true);
    } else {
      if (currentSong.paused) {
        currentSong.play();
        document.getElementById("play").src = "playbutton/pause.svg";
      } else {
        currentSong.pause();
        document.getElementById("play").src = "playbutton/play.svg";
      }
    }
  });

  // Previous
  document.getElementById("previous").addEventListener("click", () => {
    if (songs.length === 0) return;
    const prev = (currIndex <= 0) ? songs.length - 1 : currIndex - 1;
    playMusic(prev);
  });

  // Next
  document.getElementById("next").addEventListener("click", () => {
    if (songs.length === 0) return;
    const next = (currIndex >= songs.length - 1 || currIndex === -1) ? 0 : currIndex + 1;
    playMusic(next);
  });
}

async function main() {
  // Initial placeholder
  document.querySelector(".songList ul").innerHTML = `
    <li style="padding:30px; text-align:center; color:#888;">
      Click any playlist card to load songs
    </li>`;

  setupControls();

  // ====================== HANDLE CARDS (using data-folder) ======================
  document.querySelectorAll('.cardContainer').forEach(container => {
    const card = container.querySelector('.card');
    if (!card) return;

    container.style.cursor = "pointer";

    card.addEventListener('click', async () => {
      const folder = container.dataset.folder;
      if (!folder) return;

      // Highlight only the clicked card
      document.querySelectorAll('.card').forEach(c => {
        c.style.borderColor = "";
        c.style.boxShadow = "";
      });
      card.style.borderColor = "#1ed760";
      card.style.boxShadow = "0 0 25px rgba(30, 215, 96, 0.7)";

      await renderLibrarySongs(folder);
      if (songs.length > 0) {
        setTimeout(() => playMusic(0), 300);
      }
    });
  });

  // ====================== SEEK ======================
  const seekSlider = document.getElementById("seek");
  currentSong.addEventListener("timeupdate", () => {
    if (!currentSong.duration || isNaN(currentSong.duration)) return;
    const progress = (currentSong.currentTime / currentSong.duration) * 100;
    seekSlider.value = progress;
    const songtime = document.querySelector(".songtime");
    if (songtime) {
      songtime.textContent = `${secondsToTime(currentSong.currentTime)} / ${secondsToTime(currentSong.duration)}`;
    }
  });

  seekSlider.addEventListener("input", () => {
    if (currentSong.duration) {
      currentSong.currentTime = (seekSlider.value / 100) * currentSong.duration;
    }
  });

  currentSong.addEventListener("ended", () => {
    if (songs.length === 0) return;
    const next = (currIndex >= songs.length - 1) ? 0 : currIndex + 1;
    playMusic(next);
  });

  // ====================== HAMBURGER ======================
  document.querySelector(".hamburger")?.addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close")?.addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // ====================== VOLUME ======================
  const volumeSlider = document.querySelector(".range");
  const volumeIcon = document.getElementById("volumeIcon");

  function updateVolumeIcon() {
    if (!volumeIcon) return;
    volumeIcon.src = (currentSong.volume <= 0.01) ? "playbutton/mute.svg" : "playbutton/volume.svg";
  }

  if (volumeSlider) {
    currentSong.volume = 0.75;
    volumeSlider.value = 75;
    volumeSlider.addEventListener("input", (e) => {
      currentSong.volume = parseFloat(e.target.value) / 100;
      lastVolume = currentSong.volume > 0.01 ? currentSong.volume : lastVolume;
      updateVolumeIcon();
    });
  }
  if (volumeIcon) {
    volumeIcon.addEventListener("click", () => {
      if (currentSong.volume > 0.01) {
        lastVolume = currentSong.volume;
        currentSong.volume = 0;
        volumeSlider.value = 0;
      } else {
        currentSong.volume = lastVolume;
        volumeSlider.value = lastVolume * 100;
      }
      updateVolumeIcon();
    });
  }
  updateVolumeIcon();
}

main().catch(err => console.error(err));