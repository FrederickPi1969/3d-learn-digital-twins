(() => {
  const orbit = (direction) => {
    const canvas = document.querySelector('canvas.digital-twin-canvas')
    if (!canvas) return

    const bounds = canvas.getBoundingClientRect()
    const startX = bounds.left + bounds.width * 0.58
    const startY = bounds.top + bounds.height * 0.54
    const pointerId = 871
    const dispatch = (type, x, y, buttons) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      button: 2,
      buttons,
      clientX: x,
      clientY: y,
      pointerId,
      pointerType: 'mouse',
    }))

    dispatch('pointerdown', startX, startY, 2)
    dispatch('pointermove', startX + direction * 96, startY, 2)
    dispatch('pointerup', startX + direction * 96, startY, 0)
  }

  const mount = () => {
    const toolbar = document.querySelector('.scene-toolbar')
    if (!toolbar || document.querySelector('.camera-orbit-controls')) return

    const controls = document.createElement('div')
    controls.className = 'camera-orbit-controls'
    controls.innerHTML = `
      <button type="button" title="向左旋转镜头" aria-label="向左旋转镜头">↶<small>左转</small></button>
      <button type="button" title="向右旋转镜头" aria-label="向右旋转镜头">↷<small>右转</small></button>
    `
    controls.querySelectorAll('button').forEach((button, index) => {
      button.addEventListener('click', () => orbit(index === 0 ? -1 : 1))
    })
    toolbar.before(controls)
  }

  const style = document.createElement('style')
  style.textContent = `
    .camera-orbit-controls { position: fixed; right: 114px; bottom: 12px; display: flex; gap: 5px; z-index: 11; }
    .camera-orbit-controls button { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 43px; height: 43px; padding: 0; border: 1px solid rgba(66,179,222,.26); background: rgba(4,20,34,.76); color: #6b95a7; cursor: pointer; backdrop-filter: blur(6px); clip-path: polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px); }
    .camera-orbit-controls button:hover { border-color: rgba(97,228,255,.58); color: #dffaff; background: rgba(10,52,76,.82); }
    .camera-orbit-controls button { font-size: 15px; line-height: 1; }
    .camera-orbit-controls small { margin-top: 3px; font-size: 6px; }
  `
  document.head.append(style)
  mount()
  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true })
})()
