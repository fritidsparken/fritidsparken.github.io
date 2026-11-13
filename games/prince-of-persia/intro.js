"use strict";

const opening = $('opening'),
  line = $('storyLine');
const chapters = [
  'Jag är prins Navid. I natt försvann min syster Laleh. Hennes flöjt låg vid Solporten.',
  'Inifrån stenen hörde jag hennes röst. ”Navid. Skynda dig. Vid gryningen försvinner djungeln.”',
  'Två skatter öppnar varje passage. Längst in bär Solväktaren sigillet som leder till Laleh.',
  'Muren glöder i öster. Jag stoppar flöjten i bältet. Håll ut, Laleh.'
];
const jungleChapters = [
  'Navid, jag hörde Solporten öppnas. Du tog dig igenom.',
  'Vid gryningen försvinner stigen. Spela min flöjt vid sista lyktan, så hittar jag dig.',
  'Vänta … hör du stenen? Spring, Navid!'
];
const jungleCueTimes = [4950, 5750, 3350];
const lalehVoice = new Audio("assets/audio/intro/laleh.mp3");
const navidVoice = new Audio("assets/audio/intro/navid.mp3");
const palaceCueTimes = [5082, 5294, 5378, 4246];
let storyVoice,
  voicePlaying = false;
function playStoryVoice() {
  storyVoice.play().then(() => {
    voicePlaying = true;
  }).catch(() => {
    voicePlaying = false;
  });
}
let jungleStory = false,
  storyDown = false;
let chapterClock = 0,
  chapterStamp = null,
  chapterFrame = 0,
  chapterIndex = -1;
function showChapter(i) {
  chapterIndex = i;
  chapterClock = 0;
  line.textContent = (jungleStory ? jungleChapters : chapters)[i];
}
function runStory(stamp) {
  if (opening.hidden || document.hidden) return;
  const cues = jungleStory ? jungleCueTimes : palaceCueTimes;
  if (voicePlaying && !storyVoice.ended) {
    const start = cues.slice(0, chapterIndex).reduce((a, b) => a + b, 0);
    chapterClock = Math.max(0, storyVoice.currentTime * 1000 - start);
  } else if (chapterStamp !== null) chapterClock += stamp - chapterStamp;
  chapterStamp = stamp;
  if (chapterClock >= cues[chapterIndex]) {
    if (chapterIndex === (jungleStory ? jungleChapters : chapters).length - 1) {
      finishStory();
      return;
    }
    showChapter(chapterIndex + 1);
  }
  const fade = Math.min(1, chapterClock / 400);
  line.style.opacity = fade;
  line.style.transform = 'translateY(' + (1 - fade) * 5 + 'px)';
  chapterFrame = requestAnimationFrame(runStory);
}
function beginStory(jungle = false) {
  if (!ready || !jungle && jungleSelected) return;
  jungleStory = jungle;
  storyDown = false;
  opening.setAttribute('aria-label', jungle ? 'Lalehs berättelse' : 'Prinsens berättelse');
  quietScore();
  scoreOffset = 0;
  prepareScore();
  stopEffects();
  theme.pause();
  clearInput();
  paused = true;
  menu.hidden = true;
  $('app').inert = true;
  opening.hidden = false;
  scoreWanted = true;
  syncScore();
  chapterClock = 0;
  chapterStamp = null;
  chapterIndex = -1;
  line.style.opacity = 0;
  showChapter(0);
  storyVoice = jungle ? lalehVoice : navidVoice;
  voicePlaying = false;
  storyVoice.currentTime = 0;
  playStoryVoice();
  $('skipIntro').focus({
    preventScroll: true
  });
  chapterFrame = requestAnimationFrame(runStory);
}
function finishStory() {
  if (opening.hidden) return;
  storyVoice.pause();
  voicePlaying = false;
  cancelAnimationFrame(chapterFrame);
  opening.hidden = true;
  if (scoreGain) scoreGain.gain.setTargetAtTime(.21, pickupAudio.currentTime, .3);
  if (jungleStory) {
    jungleStory = false;
    startBridge(true);
    if (bridge.active && storyDown) bridgeKeys.add('forward');
    storyDown = false;
  } else enterWorld();
}
$('skipIntro').onclick = finishStory;
document.addEventListener('visibilitychange', () => {
  if (opening.hidden) return;
  cancelAnimationFrame(chapterFrame);
  chapterStamp = null;
  if (document.hidden) {
    quietScore();
    storyVoice.pause();
  } else {
    playStoryVoice();
    scoreWanted = true;
    syncScore();
    chapterFrame = requestAnimationFrame(runStory);
  }
});
