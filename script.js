/*
  Minecraft Shape Tool
  Copyright (c) 2026 GeshGiezel (iigeshii)
  Licensed under the MIT License. See LICENSE for details.
*/

const tabContainer = document.getElementById('tabs');
const tabContent = document.getElementById('tabContent');

const workbookTabs = ['Circle Builder', 'Ellipse Builder', 'Arch Builder', 'Dome Builder'];
let activeTab = workbookTabs[0];
let numberingMode = 'ltr';

function numberingModeField() {
  return `
    <div class="field">
      <label for="numberingMode">Numbering direction</label>
      <select id="numberingMode">
        <option value="ltr">Left to Right</option>
        <option value="rtl">Right to Left</option>
        <option value="ttb">Top to Bottom</option>
        <option value="btt">Bottom to Top</option>
        <option value="center-col">Distance from Center Column</option>
        <option value="center-col-to">Distance to Center Column</option>
        <option value="center-row">Distance from Center Row</option>
        <option value="center-row-to">Distance to Center Row</option>
        <option value="radial">Distance from Center (Radial)</option>
        <option value="radial-to">Distance to Center (Radial)</option>
      </select>
    </div>
  `;
}

function makeGridFromPredicate(cols, rows, predicate) {
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      matrix[row][col] = predicate(row, col, cols, rows);
    }
  }
  return matrix;
}

function computeRunLabels(isBlockValues) {
  let run = 0;
  let previousIsBlock = null;
  return isBlockValues.map((isBlock) => {
    run = isBlock === previousIsBlock ? run + 1 : 1;
    previousIsBlock = isBlock;
    return run;
  });
}

function buildCenterRings(size) {
  const innerLow = Math.floor((size - 1) / 2);
  const innerHigh = Math.ceil((size - 1) / 2);
  const rings = innerLow === innerHigh ? [[innerLow]] : [[innerLow, innerHigh]];

  const maxRing = Math.max(innerLow, size - 1 - innerHigh);
  for (let d = 1; d <= maxRing; d += 1) {
    const ring = [];
    if (innerLow - d >= 0) ring.push(innerLow - d);
    if (innerHigh + d <= size - 1) ring.push(innerHigh + d);
    if (ring.length) rings.push(ring);
  }
  return rings;
}

function numberRuns(matrix, mode = 'ltr') {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const numbered = matrix.map((row) => row.map((isBlock) => ({ isBlock, label: '' })));

  const applyOrder = (cells) => {
    const labels = computeRunLabels(cells.map(({ row, col }) => numbered[row][col].isBlock));
    cells.forEach(({ row, col }, index) => {
      numbered[row][col].label = labels[index];
    });
  };

  if (mode === 'ltr' || mode === 'rtl') {
    for (let row = 0; row < rows; row += 1) {
      const colOrder = Array.from({ length: cols }, (_, i) => (mode === 'ltr' ? i : cols - 1 - i));
      applyOrder(colOrder.map((col) => ({ row, col })));
    }
    return numbered;
  }

  if (mode === 'ttb' || mode === 'btt') {
    for (let col = 0; col < cols; col += 1) {
      const rowOrder = Array.from({ length: rows }, (_, i) => (mode === 'ttb' ? i : rows - 1 - i));
      applyOrder(rowOrder.map((row) => ({ row, col })));
    }
    return numbered;
  }

  if (mode === 'center-col' || mode === 'center-col-to') {
    const colRings = buildCenterRings(cols);
    const orderedRings = mode === 'center-col-to' ? colRings.slice().reverse() : colRings;
    for (let row = 0; row < rows; row += 1) {
      let run = 0;
      let previousIsBlock = null;
      orderedRings.forEach((ringCols) => {
        const isBlock = numbered[row][ringCols[0]].isBlock;
        run = isBlock === previousIsBlock ? run + 1 : 1;
        previousIsBlock = isBlock;
        ringCols.forEach((col) => {
          numbered[row][col].label = run;
        });
      });
    }
    return numbered;
  }

  if (mode === 'center-row' || mode === 'center-row-to') {
    const rowRings = buildCenterRings(rows);
    const orderedRings = mode === 'center-row-to' ? rowRings.slice().reverse() : rowRings;
    for (let col = 0; col < cols; col += 1) {
      let run = 0;
      let previousIsBlock = null;
      orderedRings.forEach((ringRows) => {
        const isBlock = numbered[ringRows[0]][col].isBlock;
        run = isBlock === previousIsBlock ? run + 1 : 1;
        previousIsBlock = isBlock;
        ringRows.forEach((row) => {
          numbered[row][col].label = run;
        });
      });
    }
    return numbered;
  }

  if (mode === 'radial' || mode === 'radial-to') {
    const centerRow = (rows - 1) / 2;
    const centerCol = (cols - 1) / 2;
    const groups = new Map();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
        const ring = Math.round(distance);
        if (!groups.has(ring)) groups.set(ring, []);
        groups.get(ring).push({ row, col });
      }
    }

    const ringOrder = Array.from(groups.keys()).sort((a, b) => a - b);
    const orderedRingOrder = mode === 'radial-to' ? ringOrder.reverse() : ringOrder;

    let run = 0;
    let previousIsBlock = null;
    orderedRingOrder.forEach((ring) => {
      const cells = groups.get(ring);
      const blockCount = cells.filter(({ row, col }) => numbered[row][col].isBlock).length;
      const isBlock = blockCount * 2 >= cells.length;
      run = isBlock === previousIsBlock ? run + 1 : 1;
      previousIsBlock = isBlock;
      cells.forEach(({ row, col }) => {
        numbered[row][col].label = run;
      });
    });
    return numbered;
  }

  return numbered;
}

function renderMatrix(matrix, grid = document.getElementById('shapeGrid')) {
  if (!grid) return;

  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  const centerRowLow = Math.floor((rows - 1) / 2);
  const centerRowHigh = Math.ceil((rows - 1) / 2);
  const centerColLow = Math.floor((cols - 1) / 2);
  const centerColHigh = Math.ceil((cols - 1) / 2);

  if (!grid._dimState || grid._dimState.rows !== rows || grid._dimState.cols !== cols) {
    grid._dimState = { rows, cols, dimmedRows: new Set(), dimmedCols: new Set() };
  }
  const { dimmedRows, dimmedCols } = grid._dimState;

  grid.style.gridTemplateColumns = `18px repeat(${cols}, 18px)`;
  grid.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'cell axis-label axis-corner';
  grid.appendChild(corner);

  for (let col = 0; col < cols; col += 1) {
    const colHeader = document.createElement('div');
    colHeader.className = `cell axis-label axis-x${dimmedCols.has(String(col)) ? ' dimmed' : ''}`;
    colHeader.textContent = col + 1;
    colHeader.dataset.col = col;
    grid.appendChild(colHeader);
  }

  for (let row = 0; row < rows; row += 1) {
    const rowHeader = document.createElement('div');
    rowHeader.className = `cell axis-label axis-y${dimmedRows.has(String(row)) ? ' dimmed' : ''}`;
    rowHeader.textContent = row + 1;
    rowHeader.dataset.row = row;
    grid.appendChild(rowHeader);

    for (let col = 0; col < cols; col += 1) {
      const cellData = matrix[row][col];
      const isCenter = (row === centerRowLow || row === centerRowHigh) && (col === centerColLow || col === centerColHigh);
      const isDimmed = dimmedRows.has(String(row)) || dimmedCols.has(String(col));
      const cell = document.createElement('div');
      cell.className = `cell ${cellData.isBlock ? 'block' : 'air'} ${cellData.isBlock ? 'block-label' : 'air-label'}${isCenter ? ' center' : ''}${isDimmed ? ' dimmed' : ''}`;
      cell.textContent = cellData.label || '';
      cell.dataset.row = row;
      cell.dataset.col = col;

      grid.appendChild(cell);
    }
  }

  grid.onclick = (event) => {
    const header = event.target.closest('.axis-x, .axis-y');
    if (!header) return;

    if (header.classList.contains('axis-x')) {
      const col = header.dataset.col;
      dimmedCols.has(col) ? dimmedCols.delete(col) : dimmedCols.add(col);
      grid.querySelectorAll(`[data-col="${col}"]`).forEach((cell) => {
        const dim = dimmedCols.has(col) || dimmedRows.has(cell.dataset.row);
        cell.classList.toggle('dimmed', dim);
      });
    } else {
      const row = header.dataset.row;
      dimmedRows.has(row) ? dimmedRows.delete(row) : dimmedRows.add(row);
      grid.querySelectorAll(`[data-row="${row}"]`).forEach((cell) => {
        const dim = dimmedRows.has(row) || dimmedCols.has(cell.dataset.col);
        cell.classList.toggle('dimmed', dim);
      });
    }
  };
}

function buildCircleGrid(diameter, ringWidth) {
  const size = Math.max(1, Number(diameter) || 35);
  const thickness = Math.max(1, Number(ringWidth) || 3);
  const center = (size - 1) / 2;

  const matrix = makeGridFromPredicate(size, size, (row, col) => {
    const dx = col - center;
    const dy = row - center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const outerRadius = size / 2;
    const innerRadius = outerRadius - thickness;
    return distance <= outerRadius && distance > innerRadius;
  });

  renderMatrix(numberRuns(matrix, numberingMode));
}

function buildEllipseGrid(width, height, ringWidth) {
  const cols = Math.max(1, Number(width) || 50);
  const rows = Math.max(1, Number(height) || 20);
  const thickness = Math.max(1, Number(ringWidth) || 5);
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const a = cols / 2;
  const b = rows / 2;
  const innerA = Math.max(0.001, a - thickness);
  const innerB = Math.max(0.001, b - thickness);

  const matrix = makeGridFromPredicate(cols, rows, (row, col) => {
    const x = col - centerX;
    const y = row - centerY;
    const outer = (x / a) ** 2 + (y / b) ** 2 <= 1;
    const inner = (x / innerA) ** 2 + (y / innerB) ** 2 <= 1;
    return outer && !inner;
  });

  renderMatrix(numberRuns(matrix, numberingMode));
}

function buildArchGrid(totalWidth, totalHeight, wallThickness, deckThickness, shapeFactor) {
  const cols = Math.max(1, Number(totalWidth) || 80);
  const rows = Math.max(1, Number(totalHeight) || 20);
  const wall = Math.max(1, Number(wallThickness) || 2);
  const deck = Math.max(1, Number(deckThickness) || 2);
  const shape = Math.max(0.5, Number(shapeFactor) || 2);
  const centerX = (cols - 1) / 2;
  const innerA = Math.max(cols / 2 - wall, 0.001);
  const innerB = Math.max(rows - deck, 0.001);

  const matrix = makeGridFromPredicate(cols, rows, (row, col) => {
    const x = col - centerX;
    const y = row - (rows - 1);
    const isInsideOpening = Math.abs(x / innerA) ** shape + Math.abs(y / innerB) ** shape < 1;
    const isOpening = isInsideOpening && row >= deck;
    return !isOpening;
  });

  renderMatrix(numberRuns(matrix, numberingMode));
}

function buildDomeGrid(baseDiameter, domeHeight) {
  const base = Math.max(3, Number(baseDiameter) || 20);
  const height = Math.max(2, Number(domeHeight) || 15);
  const radius = base / 2;
  const rows = Math.max(2, height);
  const cols = Math.max(base + 4, 24);
  const cx = (cols - 1) / 2;

  const matrix = makeGridFromPredicate(cols, rows, (row, col) => {
    const normalizedY = (rows - 1 - row) / Math.max(rows - 1, 1);
    const yOffset = normalizedY * radius;
    const sliceRadius = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
    const dx = Math.abs(col - cx);
    return dx <= sliceRadius + 0.5;
  });

  renderMatrix(numberRuns(matrix, numberingMode));
}

function buildDomeLayers(baseDiameter, domeHeight) {
  const base = Math.max(3, Number(baseDiameter) || 20);
  const height = Math.max(2, Number(domeHeight) || 15);
  const radius = base / 2;
  const rows = Math.max(2, height);
  const layersContainer = document.getElementById('domeLayers');
  if (!layersContainer) return;

  layersContainer.innerHTML = '';

  for (let layer = 0; layer < rows; layer += 1) {
    const normalizedY = (rows - 1 - layer) / Math.max(rows - 1, 1);
    const yOffset = normalizedY * radius;
    const sliceRadius = Math.sqrt(Math.max(0, radius * radius - yOffset * yOffset));
    const sliceDiameter = Math.max(1, Math.round(sliceRadius * 2));
    const gridSize = Math.max(sliceDiameter + 4, 20);
    const cx = (gridSize - 1) / 2;

    const layerDiv = document.createElement('div');
    layerDiv.className = 'dome-layer';

    const label = document.createElement('div');
    label.className = 'layer-label';
    label.textContent = `Level ${rows - layer} (diameter: ${sliceDiameter})`;

    const layerGrid = document.createElement('div');
    layerGrid.className = 'grid';

    const outerRadius = sliceDiameter / 2;
    const innerRadius = Math.max(outerRadius - 1, 0.001);

    const matrix = makeGridFromPredicate(gridSize, gridSize, (row, col) => {
      const dx = col - cx;
      const dy = row - cx;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= outerRadius && distance > innerRadius;
    });

    renderMatrix(numberRuns(matrix, numberingMode), layerGrid);

    layerDiv.appendChild(label);
    layerDiv.appendChild(layerGrid);
    layersContainer.appendChild(layerDiv);
  }
}

function legendBlock() {
  return `
    <div class="legend">
      <span class="legend-dot dark"></span>
      <span>Dark green = block</span>
      <span class="legend-separator">·</span>
      <span class="legend-dot light"></span>
      <span>Light green = air</span>
      <span class="legend-separator">·</span>
      <span class="legend-dot center"></span>
      <span>Amber outline = center block</span>
    </div>
    <p class="helper-text">Click a row or column header to gray it out and track your progress in-game.</p>
  `;
}

function renderCircleTab() {
  return `
    <div class="tab-panel active builder-panel">
      <div class="control-panel">
        <div class="field">
          <label for="diameter">Diameter (blocks)</label>
          <input id="diameter" type="number" min="1" max="200" value="35" />
        </div>
        <div class="field">
          <label for="ringWidth">Ring width (blocks)</label>
          <input id="ringWidth" type="number" min="1" max="50" value="3" />
        </div>
        ${numberingModeField()}
      </div>

      ${legendBlock()}

      <div id="shapeGrid" class="grid" aria-label="Minecraft circle grid"></div>
    </div>
  `;
}

function renderEllipseTab() {
  return `
    <div class="tab-panel active builder-panel">
      <div class="control-panel">
        <div class="field">
          <label for="ellipseWidth">Width (blocks)</label>
          <input id="ellipseWidth" type="number" min="1" max="200" value="50" />
        </div>
        <div class="field">
          <label for="ellipseHeight">Height (blocks)</label>
          <input id="ellipseHeight" type="number" min="1" max="200" value="20" />
        </div>
        <div class="field">
          <label for="ellipseRing">Ring width (blocks)</label>
          <input id="ellipseRing" type="number" min="1" max="50" value="5" />
        </div>
        ${numberingModeField()}
      </div>
      ${legendBlock()}
      <div id="shapeGrid" class="grid" aria-label="Minecraft ellipse grid"></div>
    </div>
  `;
}

function renderArchTab() {
  return `
    <div class="tab-panel active builder-panel">
      <div class="control-panel">
        <div class="field">
          <label for="archWidth">Total Width</label>
          <input id="archWidth" type="number" min="1" max="200" value="80" />
        </div>
        <div class="field">
          <label for="archHeight">Total Height</label>
          <input id="archHeight" type="number" min="1" max="200" value="20" />
        </div>
        <div class="field">
          <label for="archWall">Wall thickness</label>
          <input id="archWall" type="number" min="1" max="50" value="2" />
        </div>
        <div class="field">
          <label for="archDeck">Deck thickness</label>
          <input id="archDeck" type="number" min="1" max="50" value="2" />
        </div>
        <div class="field">
          <label for="archShape">Arch shape</label>
          <input id="archShape" type="number" min="0.5" max="10" step="0.5" value="2" />
        </div>
        ${numberingModeField()}
      </div>
      ${legendBlock()}
      <div id="shapeGrid" class="grid" aria-label="Minecraft arch grid"></div>
    </div>
  `;
}

function renderDomeTab() {
  return `
    <div class="tab-panel active builder-panel">
      <div class="control-panel">
        <div class="field">
          <label for="domeDiameter">Base Diameter</label>
          <input id="domeDiameter" type="number" min="1" max="200" value="20" />
        </div>
        <div class="field">
          <label for="domeHeight">Dome Height</label>
          <input id="domeHeight" type="number" min="1" max="200" value="15" />
        </div>
        ${numberingModeField()}
      </div>
      ${legendBlock()}
      <h3 class="section-title">Full Dome Profile</h3>
      <p class="helper-text">Each row shows one horizontal slice; the circle shrinks toward the top.</p>
      <div id="shapeGrid" class="grid" aria-label="Minecraft dome grid"></div>
      <h3 class="section-title" style="margin-top: 2rem;">Layer Breakdown</h3>
      <p class="helper-text">Individual circle for each building level:</p>
      <div id="domeLayers" class="dome-layers-container" aria-label="Dome layers breakdown"></div>
    </div>
  `;
}

function renderWorkbookTab(tabName) {
  switch (tabName) {
    case 'Circle Builder':
      return renderCircleTab();
    case 'Ellipse Builder':
      return renderEllipseTab();
    case 'Arch Builder':
      return renderArchTab();
    case 'Dome Builder':
      return renderDomeTab();
    default:
      return renderCircleTab();
  }
}

function renderTabButtons() {
  tabContainer.innerHTML = workbookTabs
    .map(
      (tabName) => `
        <button
          class="tab-btn ${activeTab === tabName ? 'active' : ''}"
          data-tab="${tabName}"
          type="button"
        >
          ${tabName}
        </button>
      `
    )
    .join('');

  tabContainer.querySelectorAll('.tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      renderTabs();
    });
  });
}

function bindBuilderInputs() {
  let refresh = null;

  if (activeTab === 'Circle Builder') {
    const diameterInput = document.getElementById('diameter');
    const ringWidthInput = document.getElementById('ringWidth');
    if (!diameterInput || !ringWidthInput) return;

    refresh = () => buildCircleGrid(diameterInput.value, ringWidthInput.value);
    diameterInput.oninput = refresh;
    ringWidthInput.oninput = refresh;
  } else if (activeTab === 'Ellipse Builder') {
    const widthInput = document.getElementById('ellipseWidth');
    const heightInput = document.getElementById('ellipseHeight');
    const ringInput = document.getElementById('ellipseRing');
    if (!widthInput || !heightInput || !ringInput) return;

    refresh = () => buildEllipseGrid(widthInput.value, heightInput.value, ringInput.value);
    widthInput.oninput = refresh;
    heightInput.oninput = refresh;
    ringInput.oninput = refresh;
  } else if (activeTab === 'Arch Builder') {
    const widthInput = document.getElementById('archWidth');
    const heightInput = document.getElementById('archHeight');
    const wallInput = document.getElementById('archWall');
    const deckInput = document.getElementById('archDeck');
    const shapeInput = document.getElementById('archShape');
    if (!widthInput || !heightInput || !wallInput || !deckInput || !shapeInput) return;

    refresh = () => buildArchGrid(widthInput.value, heightInput.value, wallInput.value, deckInput.value, shapeInput.value);
    widthInput.oninput = refresh;
    heightInput.oninput = refresh;
    wallInput.oninput = refresh;
    deckInput.oninput = refresh;
    shapeInput.oninput = refresh;
  } else if (activeTab === 'Dome Builder') {
    const diameterInput = document.getElementById('domeDiameter');
    const heightInput = document.getElementById('domeHeight');
    if (!diameterInput || !heightInput) return;

    refresh = () => {
      buildDomeGrid(diameterInput.value, heightInput.value);
      buildDomeLayers(diameterInput.value, heightInput.value);
    };
    diameterInput.oninput = refresh;
    heightInput.oninput = refresh;
  }

  if (!refresh) return;

  const modeSelect = document.getElementById('numberingMode');
  if (modeSelect) {
    modeSelect.value = numberingMode;
    modeSelect.onchange = () => {
      numberingMode = modeSelect.value;
      refresh();
    };
  }

  refresh();
}

function renderTabs() {
  renderTabButtons();
  tabContent.innerHTML = renderWorkbookTab(activeTab);
  bindBuilderInputs();
}

renderTabs();
