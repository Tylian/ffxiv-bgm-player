const loadingElem = document.getElementById('loading');
const audio = new window.AudioContext();

var songs = [];
var currentSong = null;
var isLoading = false;

function setLoading(loading) {
  isLoading = loading;
  loadingElem.style.display = isLoading ? 'block' : 'none';
}

function playSong(index, layer) {
  window.location.hash = `#${index}:${layer}`;
  if(currentSong && currentSong != songs[index]) {
    currentSong.stop();
  }

  var volume = document.getElementById('volume');
  currentSong = songs[index];
  currentSong.volume(parseInt(volume.value, 10));
  currentSong.play(layer);
}

function getClosest(elem, selector) {
  for(; elem && elem !== document; elem = elem.parentNode)
    if(elem.matches(selector))
      return elem;
  return null;
}

fetch('bgm.json')
  .then(response => response.json())
  .then(data => {
    let songData = data.bgm;
    songData.sort((a, b) => a.index - b.index);
    var rows = songData.map((song, index) => {
      song.path = `bgm/${song.file}.ogg`;
      songs[index] = new AudioWrapper(audio, song);
      songs[index].on('loadstart', () => setLoading(true));
      songs[index].on('loadend', () => setLoading(false));

      var html = "";
      for(var i = 0; i < song.layers; i++) {
        let path = song.file.substr(0, song.file.lastIndexOf('/') + 1);
        let name = song.file.substr(song.file.lastIndexOf('/') + 1);
        let layerInfo = song.layers > 1 ? `<span class="muted">/</span> Layer ${i + 1}` : "";
        html += `
          <div class="song" data-index="${index}" data-layer="${i}">
            <div class="song-wrapper">
              <i class="icon fa"></i>
              <div class="info">
              #${index} <span class="muted">-</span> ${name} ${layerInfo}<br />
              <small>${path}</small>
              </div>
            </div>
          </div>
        `;
      }
      return html;
    });

    var container = document.getElementById("playlist");
    container.innerHTML += rows.join("");
    container.addEventListener('click', function(e) {
      if(e.ctrlKey || isLoading)
        return true;

      var row = getClosest(e.target, '[data-index][data-layer]');

      var previous = document.querySelector('.playing');
      if(previous) { previous.classList.remove('playing'); }
      row.classList.add("playing");

      var index = parseInt(row.getAttribute('data-index'), 10);
      var layer = parseInt(row.getAttribute('data-layer'), 10);

      playSong(index, layer);

      e.preventDefault();
      return false;
    }, true);

    var volume = document.getElementById('volume');
    var volumeVal = document.getElementById('volumeval');
    volume.addEventListener('input', function(e) {
      volumeVal.textContent = volume.value;
      currentSong.volume(parseInt(volume.value, 10));
    });

    setLoading(false);

    if(window.location.hash.match(/#\d+:\d+/)) {
      var split = window.location.hash.substr(1).split(':');
      var index = parseInt(split[0], 10);
      var layer = parseInt(split[1], 10);
      var row = document.querySelector(`[data-index="${index}"][data-layer="${layer}"]`);
      row.classList.add("playing");

      scrollToElement(row, { offset: 0, align: 'middle' });
      playSong(index, layer);
    }
  });

setLoading(true);