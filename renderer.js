'use strict'

// DOM elements & variables
// =============================================================================

// Get menubar instance from main.js
const { mb } = require('electron').remote.getGlobal('sharedObject')
const { ipcRenderer } = require('electron')
const path = require('path')
const Timer = require('tiny-timer')

const appContainer = document.querySelector('.js-app')
const startBtn = document.querySelector('.js-start-btn')
const stopBtn = document.querySelector('.js-stop-btn')
const slider = document.querySelector('.js-slider')

// Sounds
const soundWindup = new Audio(path.join(__dirname, '/wav/windup.wav'))
const soundClick = new Audio(path.join(__dirname, '/wav/click.wav'))
const soundDing = new Audio(path.join(__dirname, '/wav/ding.wav'))
let soundEnabled = true

let state = ''
let currentMinute = 0
const maxMinutes = 60
let workMinutes = 25
let breakMinutes = 5

// Timer stuff
const timer = new Timer()

// Utilities
// =============================================================================
const minToMs = min => min * 60 * 1000

const msToMin = ms => ms / 60 / 1000

const getCurrentMinutes = () => state === 'breaking' ? breakMinutes : workMinutes

const getCurrentSliderWidth = () => state === 'breaking' ? breakMinutes*20 : workMinutes*20

const playSound = sound => {
  sound.currentTime = 0
  if (soundEnabled) {
    sound.play()
  }
}

// UI Control
// =============================================================================

const initiateUI = () => {
  let sliderCount = maxMinutes/5
  slider.style.width = (sliderCount+1) * 100 + 'px'
  slider.style.left = (sliderCount+1) * 50 - 3 + 'px'
  slider.innerHTML = ''
  for (let i = 0; i <= sliderCount; i++) {
    let child = document.createElement('span')
    child.classList.add('minute')
    child.innerText = i*5
    slider.appendChild(child)
  }
  slider.innerHTML += '<div class="ruler"></div>'
  const ruler = document.querySelector('.ruler')
  ruler.style.width = sliderCount * 100 + sliderCount + 'px'
}

initiateUI()

// State handling
// =============================================================================

const setState = newState => {
  appContainer.classList.remove('is-stopped', 'is-working', 'is-breaking')
  appContainer.classList.add(`is-${newState}`)
  state = newState
}

setState('stopped')

const setIcon = (currentMinute, currentState) => {
  let file = ''
  const breakSuffix = currentState === 'breaking' ? '-break' : ''

  switch (process.platform) {
    case 'darwin':
      file = `${__dirname}/img/template/icon-${currentMinute}${breakSuffix}-Template.png`
      break
    case 'win32':
      file = `${__dirname}/img/ico/icon-${currentMinute}${breakSuffix}.ico`
      break
    default:
      file = `${__dirname}/img/png/icon-${currentMinute}${breakSuffix}.png`
  }

  mb.tray.setImage(file)
}

const setCurrentMinute = ms => {
  currentMinute = Math.ceil(msToMin(ms))
  setIcon(currentMinute, state)
}

setCurrentMinute(0)

// Event handlers
// =============================================================================

startBtn.addEventListener('click', () => {
  playSound(soundWindup)
  timer.start(minToMs(workMinutes))
  setState('working')
  slider.classList.add('is-resetting-work')
  slider.style.transform = 'translateX(-' + workMinutes*20 + 'px)'
  setTimeout(() => slider.classList.remove('is-resetting-work'), 1000)
})

stopBtn.addEventListener('click', () => {
  playSound(soundClick)
  timer.stop()
  setState('stopped')
})

timer.on('tick', ms => {
  const minutes = getCurrentMinutes()
  const sliderWidth = getCurrentSliderWidth()
  slider.style.transform = 'translateX(-' + Math.ceil((sliderWidth * ms) / (minToMs(minutes))) + 'px)'
  setCurrentMinute(ms)
})

timer.on('done', () => {
  playSound(soundDing)
  setCurrentMinute(0)
  mb.showWindow()

  setTimeout(() => {
    playSound(soundWindup)
    if (state === 'working') {
      setState('breaking')
      timer.start(minToMs(breakMinutes))
      slider.classList.add('is-resetting-break')
      slider.style.transform = 'translateX(-' + breakMinutes*20 + 'px)'
      setTimeout(() => slider.classList.remove('is-resetting-break'), 1000)
    } else {
      setState('working')
      timer.start(minToMs(workMinutes))
      slider.classList.add('is-resetting-work')
      slider.style.transform = 'translateX(-' + workMinutes*20 + 'px)'
      setTimeout(() => slider.classList.remove('is-resetting-work'), 1000)
    }
  }, 2000)
})

ipcRenderer.on('CHANGE_TIMER', (event, data) => {
  let minutes = data.split('/')
  workMinutes = minutes[0]
  breakMinutes = minutes[1]

  timer.stop()
  setState('stopped')
  setCurrentMinute(workMinutes)
  mb.showWindow()
  slider.style.transform = 'translateX(-' + workMinutes*20 + 'px)'
})

ipcRenderer.on('TOGGLE_SOUND', (event, data) => {
  soundEnabled = data
})
