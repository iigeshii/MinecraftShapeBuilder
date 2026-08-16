const tabContainer = document.getElementById('tabs');
const tabContent = document.getElementById('tabContent');

const workbookTabs = ['Circle Builder', 'Ellipse Builder', 'Arch Builder', 'Dome Builder'];
let activeTab = workbookTabs[0];

function makeGridFromPredicate(cols, rows, predicate) {
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      matrix[row][col] = predicate(row, col, cols, rows);
    }
  }
  return matrix;
}

function numberRuns(matrix) {
  const numbered = matrix.map((row) => row.map((isBlock) => ({ isBlock, label: '' })));

  for (let row = 0; row < numbered.length; row += 1) {
    let run = 0;
    for (let col = 0; col < numbered[row].length; col += 1) {
      if (numbered[row][col].isBlock) {
        run += 1;
        numbered[row][col].label = run;
      } else {
        run = 0;
      }
    }
  }

  return numbered;
}

function renderMatrix(matrix) {
  const grid = document.getElementById('shapeGrid');
  if (!grid) return;

  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  grid.style.gridTemplateColumns = `repeat(${cols}, 18px)`;
  grid.innerHTML = '';

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cellData = matrix[row][col];
      const cell = document.createElement('div');
      cell.className = `cell ${cellData.isBlock ? 'block' : 'air'}`;

      if (cellData.isBlock) {
        cell.textContent = cellData.label || '';
        cell.classList.add('block-label');
      }

      grid.appendChild(cell);
    }
  }
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

  renderMatrix(numberRuns(matrix));
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

  renderMatrix(numberRuns(matrix));
}

function buildArchGrid(totalWidth, totalHeight, wallThickness, deckThickness, shapeFactor) {
  const cols = Math.max(1, Number(totalWidth) || 100);
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

  renderMatrix(numberRuns(matrix));
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

  renderMatrix(numberRuns(matrix));
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
    layerGrid.style.gridTemplateColumns = `repeat(${gridSize}, 18px)`;

    const outerRadius = sliceDiameter / 2;
    const innerRadius = Math.max(outerRadius - 1, 0.001);

    const matrix = makeGridFromPredicate(gridSize, gridSize, (row, col) => {
      const dx = col - cx;
      const dy = row - cx;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= outerRadius && distance > innerRadius;
    });

    const numberedMatrix = numberRuns(matrix);

    for (let row = 0; row < numberedMatrix.length; row += 1) {
      for (let col = 0; col < numberedMatrix[row].length; col += 1) {
        const cellData = numberedMatrix[row][col];
        const cell = document.createElement('div');
        cell.className = `cell ${cellData.isBlock ? 'block' : 'air'}`;
        if (cellData.isBlock) {
          cell.textContent = cellData.label || '';
          cell.classList.add('block-label');
        }
        layerGrid.appendChild(cell);
      }
    }

    layerDiv.appendChild(label);
    layerDiv.appendChild(layerGrid);
    layersContainer.appendChild(layerDiv);
  }
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
      </div>

      <div class="legend">
        <span class="legend-dot dark"></span>
        <span>Dark green = block</span>
        <span class="legend-separator">·</span>
        <span class="legend-dot light"></span>
        <span>Light green = air</span>
      </div>

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
      </div>
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
          <input id="archWidth" type="number" min="1" max="200" value="100" />
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
      </div>
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
      </div>
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
  if (activeTab === 'Circle Builder') {
    const diameterInput = document.getElementById('diameter');
    const ringWidthInput = document.getElementById('ringWidth');
    if (!diameterInput || !ringWidthInput) return;

    const refresh = () => buildCircleGrid(diameterInput.value, ringWidthInput.value);
    diameterInput.oninput = refresh;
    ringWidthInput.oninput = refresh;
    refresh();
    return;
  }

  if (activeTab === 'Ellipse Builder') {
    const widthInput = document.getElementById('ellipseWidth');
    const heightInput = document.getElementById('ellipseHeight');
    const ringInput = document.getElementById('ellipseRing');
    if (!widthInput || !heightInput || !ringInput) return;

    const refresh = () => buildEllipseGrid(widthInput.value, heightInput.value, ringInput.value);
    widthInput.oninput = refresh;
    heightInput.oninput = refresh;
    ringInput.oninput = refresh;
    refresh();
    return;
  }

  if (activeTab === 'Arch Builder') {
    const widthInput = document.getElementById('archWidth');
    const heightInput = document.getElementById('archHeight');
    const wallInput = document.getElementById('archWall');
    const deckInput = document.getElementById('archDeck');
    const shapeInput = document.getElementById('archShape');
    if (!widthInput || !heightInput || !wallInput || !deckInput || !shapeInput) return;

    const refresh = () => buildArchGrid(widthInput.value, heightInput.value, wallInput.value, deckInput.value, shapeInput.value);
    widthInput.oninput = refresh;
    heightInput.oninput = refresh;
    wallInput.oninput = refresh;
    deckInput.oninput = refresh;
    shapeInput.oninput = refresh;
    refresh();
    return;
  }

  if (activeTab === 'Dome Builder') {
    const diameterInput = document.getElementById('domeDiameter');
    const heightInput = document.getElementById('domeHeight');
    if (!diameterInput || !heightInput) return;

    const refresh = () => {
      buildDomeGrid(diameterInput.value, heightInput.value);
      buildDomeLayers(diameterInput.value, heightInput.value);
    };
    diameterInput.oninput = refresh;
    heightInput.oninput = refresh;
    refresh();
  }
}

function renderTabs() {
  renderTabButtons();
  tabContent.innerHTML = renderWorkbookTab(activeTab);
  bindBuilderInputs();
}

renderTabs();
