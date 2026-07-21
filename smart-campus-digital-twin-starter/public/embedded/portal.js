const collectionItems = [
  ['A-01', '潮汐记忆', '林澜工作室', '#34d9ff'],
  ['A-02', '星尘索引', 'Northstar Lab', '#7479ff'],
  ['A-03', '城市脉冲', '陆屿', '#9b6dff'],
  ['A-04', '无界回声', 'Studio Meridian', '#48efbd'],
  ['B-13', '引力之环', '周砚', '#ffc96b'],
  ['B-15', '折叠山脉', 'Future Matter', '#ff6da8'],
  ['C-25', '青铜回声', '白昼计划', '#34d9ff'],
  ['C-29', '数字经纬', '顾远', '#7479ff'],
  ['D-37', '光场生命', 'Atelier Zero', '#48efbd'],
  ['D-41', '空间语法', 'Common Form', '#9b6dff'],
  ['D-45', '预测风景', 'Vector Field', '#ffc96b'],
  ['D-48', '下一种现实', 'Future Matter', '#ff6da8'],
]

function renderCollection(filter = 'ALL') {
  const root = document.querySelector('[data-collection-grid]')
  if (!root) return
  root.innerHTML = collectionItems
    .filter(([booth]) => filter === 'ALL' || booth.startsWith(filter))
    .map(([booth, title, artist, accent]) => `
      <article class="collection-item">
        <div class="collection-item__art" style="--accent:${accent}"><span>${booth}</span></div>
        <strong>${title}</strong>
        <small>${artist} · 数字档案已同步</small>
      </article>
    `).join('')
}

renderCollection()

document.querySelectorAll('[data-zone-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-zone-filter]').forEach((item) => item.classList.remove('is-active'))
    button.classList.add('is-active')
    renderCollection(button.dataset.zoneFilter)
  })
})
