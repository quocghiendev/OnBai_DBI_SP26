// Block Blast DBI2026 Main Game Logic

document.addEventListener("DOMContentLoaded", () => {
  const GRID_SIZE = 8;

  // Game State Variables
  let board = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
  let score = 0;
  let highScore = parseInt(localStorage.getItem("block_blast_high_score") || "0", 10);
  let questionsAnswered = 0;
  let correctAnswersCount = 0;

  let currentDockBlocks = [null, null, null];
  let selectedBlockIndex = null;
  let currentPhase = "free"; // 'free' or 'quiz'
  let dockUnlocked = true; // true for free, false when waiting for quiz

  // Quiz Variables
  let currentQuizQuestion = null;
  let attemptsLeft = 2;
  let quizCompletedState = false;
  const REQUIRED_CORRECT_ANSWERS = 3;
  let quizUnlockProgress = 0;

  // Block Templates (Matrix shapes & Colors)
  const SHAPES = [
    // 1x1 Dot
    { matrix: [[1]], color: 1 },
    // 1x2, 2x1
    { matrix: [[1, 1]], color: 1 },
    { matrix: [[1], [1]], color: 2 },
    // 1x3, 3x1
    { matrix: [[1, 1, 1]], color: 2 },
    { matrix: [[1], [1], [1]], color: 3 },
    // 1x4, 4x1
    { matrix: [[1, 1, 1, 1]], color: 3 },
    { matrix: [[1], [1], [1], [1]], color: 4 },
    // 2x2 Square
    {
      matrix: [
        [1, 1],
        [1, 1],
      ],
      color: 4,
    },
    // 3x3 Square
    {
      matrix: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ],
      color: 5,
    },
    // L-Shapes (Small 2x2)
    {
      matrix: [
        [1, 0],
        [1, 1],
      ],
      color: 5,
    },
    {
      matrix: [
        [0, 1],
        [1, 1],
      ],
      color: 6,
    },
    {
      matrix: [
        [1, 1],
        [1, 0],
      ],
      color: 1,
    },
    {
      matrix: [
        [1, 1],
        [0, 1],
      ],
      color: 2,
    },
    // L-Shapes (3x3 Big L)
    {
      matrix: [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: 6,
    },
    {
      matrix: [
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1],
      ],
      color: 3,
    },
    // T-Shapes
    {
      matrix: [
        [1, 1, 1],
        [0, 1, 0],
      ],
      color: 4,
    },
    {
      matrix: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: 5,
    },
    {
      matrix: [
        [1, 0],
        [1, 1],
        [1, 0],
      ],
      color: 2,
    },
    // Corner 2x2
    {
      matrix: [
        [1, 1],
        [1, 0],
      ],
      color: 1,
    },
  ];

  // DOM Elements
  const gridBoardEl = document.getElementById("grid-board");
  const boardWrapperEl = document.querySelector(".board-wrapper");
  const scoreValEl = document.getElementById("score-val");
  const highScoreValEl = document.getElementById("high-score-val");
  const quizStatValEl = document.getElementById("quiz-stat-val");
  const phaseBadgeEl = document.getElementById("phase-badge");
  const particleCanvas = document.getElementById("particle-canvas");
  const ctxParticle = particleCanvas ? particleCanvas.getContext("2d") : null;

  const dockSlotsEls = [
    document.getElementById("slot-0"),
    document.getElementById("slot-1"),
    document.getElementById("slot-2"),
  ];

  // Meme images list (moved to root directory)
  const MEME_IMAGES = [
    "10.jpg",
    "3.jpg",
    "4.jpg",
    "5.jpg",
    "5620c70527db6003009d6c3a-6e6f8080-73ee-11e5-82ea-050901070303-compressed.jpg",
    "686207433_1608277300282927_8286470110726913561_n.jpg",
    "7.jpg",
    "705706135_1392334302701628_1148007967306886965_n.jpg",
    "720830574_1529701272088259_6381054765763839641_n.jpg",
    "8.jpg",
    "8427665e3c399f33cc92cf9764d40f22.jpg",
    "9.jpg",
    "bieu-cam-ngu-dot-meme-hai-huoc-cua-nhan-vat-hoat-hinh.jpg",
    "bo-meme-10.jpg",
    "khuon-mat-thieu-nang-meme-comment.jpg",
    "meme-hoc-bai-13.jpg",
    "meme-hoc-bai-21.jpg",
    "meme-hoc-bai-22.jpg",
    "meme-hoc-bai-9.jpg",
    "Meme-on-thi-3.jpg",
    "Meme-on-thi-6.jpg",
    "meme-that-la-ngu-ngoc_053152616.jpg",
    "OIP.jpg",
    "phan-quan-noi-sao-may-ngu-the-ha.jpg",
  ];

  // Modal Elements
  const quizModalEl = document.getElementById("quiz-modal");
  const attemptsBadgeEl = document.getElementById("attempts-badge");
  const quizQuestionEl = document.getElementById("quiz-question");
  const optionsListEl = document.getElementById("options-list");
  const quizFeedbackEl = document.getElementById("quiz-feedback");
  const unlockQuizBtnEl = document.getElementById("unlock-quiz-btn");
  const memeContainerEl = document.getElementById("meme-container");
  const memeImgEl = document.getElementById("meme-img");

  const gameOverModalEl = document.getElementById("game-over-modal");
  const finalScoreEl = document.getElementById("final-score");
  const finalAccuracyEl = document.getElementById("final-accuracy");
  const restartBtnEl = document.getElementById("restart-btn");
  const muteBtnEl = document.getElementById("mute-btn");
  const resetBtnEl = document.getElementById("reset-btn");

  if (resetBtnEl) {
    resetBtnEl.onclick = () => {
      const confirmed = confirm("Bạn có chắc muốn reset toàn bộ tiến trình? (điểm & câu đã trả lời sẽ bị xóa)");
      if (!confirmed) return;
      // Xóa các key liên quan
      try {
        localStorage.removeItem("dbi2026_answered_q_ids");
        localStorage.removeItem("block_blast_high_score");
        // Nếu bạn thêm key khác, xóa thêm ở đây
      } catch (e) {
        console.error("Lỗi khi xóa localStorage", e);
      }
      // Reload trang để khởi động lại như lần đầu
      location.reload();
    };
  }

  // Resize particle canvas
  function resizeCanvas() {
    if (particleCanvas && boardWrapperEl) {
      particleCanvas.width = boardWrapperEl.clientWidth;
      particleCanvas.height = boardWrapperEl.clientHeight;
    }
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize Game
  function initGame() {
    board = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    questionsAnswered = 0;
    correctAnswersCount = 0;
    currentPhase = "free";
    dockUnlocked = true;
    quizUnlockProgress = 0;
    selectedBlockIndex = null;

    updateScoreDisplay();
    renderBoard();
    spawnDockBlocks();
  }

  function updateScoreDisplay() {
    scoreValEl.textContent = score;
    highScoreValEl.textContent = highScore;
    quizStatValEl.textContent = `${correctAnswersCount}/${questionsAnswered}`;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("block_blast_high_score", highScore.toString());
      highScoreValEl.textContent = highScore;
    }

    if (dockUnlocked) {
      phaseBadgeEl.textContent = currentPhase === "free" ? "Lượt ghép đầu tiên" : "Đã mở khóa 3 khối";
      phaseBadgeEl.className = "phase-badge phase-free";
    } else {
      phaseBadgeEl.textContent = `Trả lời đúng ${quizUnlockProgress}/${REQUIRED_CORRECT_ANSWERS}`;
      phaseBadgeEl.className = "phase-badge phase-quiz";
    }
  }

  // Render 8x8 Grid
  function renderBoard() {
    gridBoardEl.innerHTML = "";
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = r;
        cell.dataset.col = c;

        if (board[r][c] > 0) {
          cell.classList.add("filled", `color-${board[r][c]}`);
        }

        // Add mouse & touch handlers for placement (both Click and Drag placement)
        cell.addEventListener("mouseenter", () => handleCellHover(r, c));
        cell.addEventListener("mouseleave", clearCellPreviews);
        cell.addEventListener("click", () => handleCellClick(r, c));

        gridBoardEl.appendChild(cell);
      }
    }
  }

  // Generate Random Blocks
  function getRandomBlock() {
    const template = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
      matrix: template.matrix,
      color: template.color,
      rows: template.matrix.length,
      cols: template.matrix[0].length,
    };
  }

  function spawnDockBlocks() {
    selectedBlockIndex = null;

    if (currentPhase === "free") {
      dockUnlocked = true;
      currentDockBlocks = [getRandomBlock(), getRandomBlock(), getRandomBlock()];
    } else {
      // Quiz Phase: blocks are locked until player answers quiz
      dockUnlocked = false;
      currentDockBlocks = [getRandomBlock(), getRandomBlock(), getRandomBlock()];
    }

    renderDock();
  }

  // Render 3 Dock Slots
  function renderDock() {
    dockSlotsEls.forEach((slotEl, idx) => {
      slotEl.innerHTML = "";
      slotEl.className = "block-slot";

      const block = currentDockBlocks[idx];
      if (!block) {
        slotEl.style.opacity = "0.3";
        slotEl.style.cursor = "default";
        slotEl.onclick = null;
        slotEl.draggable = false;
        return;
      }

      slotEl.style.opacity = "1";

      if (!dockUnlocked) {
        // Locked slot
        slotEl.classList.add("locked");
        slotEl.innerHTML = `
          <div class="lock-overlay">
            <div class="lock-icon">🔒</div>
            <div class="lock-text">Cần trả lời câu hỏi</div>
            <button class="unlock-btn-mini">Mở Khóa</button>
          </div>
        `;
        slotEl.onclick = () => openQuizModal();
        slotEl.draggable = false;
        return;
      }

      // Unlocked Block display
      if (selectedBlockIndex === idx) {
        slotEl.classList.add("selected");
      }

      const miniGrid = document.createElement("div");
      miniGrid.className = "mini-block";
      miniGrid.style.gridTemplateColumns = `repeat(${block.cols}, 1fr)`;

      for (let r = 0; r < block.rows; r++) {
        for (let c = 0; c < block.cols; c++) {
          const miniCell = document.createElement("div");
          if (block.matrix[r][c] === 1) {
            miniCell.className = `mini-cell color-${block.color}`;
            miniCell.style.background = getGradientForColor(block.color);
          } else {
            miniCell.className = "mini-cell empty";
          }
          miniGrid.appendChild(miniCell);
        }
      }

      slotEl.appendChild(miniGrid);

      slotEl.appendChild(miniGrid);

      // Unified Pointer & Touch Dragging + Click-to-Select
      slotEl.onpointerdown = (e) => {
        if (!dockUnlocked) return;
        startPointerDrag(e, idx);
      };

      slotEl.onclick = () => {
        if (selectedBlockIndex === idx) {
          selectedBlockIndex = null;
        } else {
          selectedBlockIndex = idx;
          if (window.soundManager) window.soundManager.playPick();
        }
        renderDock();
      };
    });
  }

  // Custom Pointer & Touch Drag Manager for Smooth 60fps Dragging + Ghost Shadow on Grid
  let activeDragState = {
    isDragging: false,
    slotIndex: null,
    block: null,
    cloneEl: null,
    targetRow: null,
    targetCol: null,
    isValidPos: false,
  };

  function startPointerDrag(e, slotIdx) {
    if (!dockUnlocked) return;
    const block = currentDockBlocks[slotIdx];
    if (!block) return;

    selectedBlockIndex = slotIdx;
    renderDock();

    if (window.soundManager) window.soundManager.playPick();

    // Create floating clone avatar following cursor
    const cloneEl = document.createElement("div");
    cloneEl.className = "drag-floating-clone";

    const miniGrid = document.createElement("div");
    miniGrid.className = "mini-block";
    miniGrid.style.gridTemplateColumns = `repeat(${block.cols}, 1fr)`;

    for (let r = 0; r < block.rows; r++) {
      for (let c = 0; c < block.cols; c++) {
        const miniCell = document.createElement("div");
        if (block.matrix[r][c] === 1) {
          miniCell.className = `mini-cell color-${block.color}`;
          miniCell.style.background = getGradientForColor(block.color);
        } else {
          miniCell.className = "mini-cell empty";
        }
        miniGrid.appendChild(miniCell);
      }
    }
    cloneEl.appendChild(miniGrid);
    document.body.appendChild(cloneEl);

    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    cloneEl.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -85%)`;

    activeDragState = {
      isDragging: true,
      slotIndex: slotIdx,
      block: block,
      cloneEl: cloneEl,
      targetRow: null,
      targetCol: null,
      isValidPos: false,
    };

    updateDragPointerPosition(clientX, clientY);
  }

  function updateDragPointerPosition(clientX, clientY) {
    if (!activeDragState.isDragging || !activeDragState.cloneEl) return;

    // Move floating block avatar smoothly
    activeDragState.cloneEl.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -85%)`;

    // Calculate grid ghost shadow position
    const gridRect = gridBoardEl.getBoundingClientRect();
    const cellSize = gridRect.width / GRID_SIZE;

    const blockPixelW = activeDragState.block.cols * cellSize;
    const blockPixelH = activeDragState.block.rows * cellSize;

    const relX = clientX - gridRect.left - blockPixelW / 2 + cellSize / 2;
    const relY = clientY - gridRect.top - blockPixelH / 2 + cellSize / 2;

    const col = Math.round(relX / cellSize);
    const row = Math.round(relY / cellSize);

    clearCellPreviews();

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const valid = canPlaceBlock(activeDragState.block, row, col);
      activeDragState.targetRow = row;
      activeDragState.targetCol = col;
      activeDragState.isValidPos = valid;

      // Draw Ghost Shadow on Board
      for (let br = 0; br < activeDragState.block.rows; br++) {
        for (let bc = 0; bc < activeDragState.block.cols; bc++) {
          if (activeDragState.block.matrix[br][bc] === 1) {
            const tr = row + br;
            const tc = col + bc;
            if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
              const cellEl = gridBoardEl.querySelector(`[data-row="${tr}"][data-col="${tc}"]`);
              if (cellEl) {
                cellEl.classList.add(valid ? "ghost-valid" : "ghost-invalid");
              }
            }
          }
        }
      }
    } else {
      activeDragState.targetRow = null;
      activeDragState.targetCol = null;
      activeDragState.isValidPos = false;
    }
  }

  function endPointerDrag() {
    if (!activeDragState.isDragging) return;

    if (activeDragState.cloneEl && activeDragState.cloneEl.parentNode) {
      activeDragState.cloneEl.parentNode.removeChild(activeDragState.cloneEl);
    }

    clearCellPreviews();

    if (activeDragState.isValidPos && activeDragState.targetRow !== null && activeDragState.targetCol !== null) {
      placeBlock(activeDragState.block, activeDragState.targetRow, activeDragState.targetCol);
    }

    activeDragState = {
      isDragging: false,
      slotIndex: null,
      block: null,
      cloneEl: null,
      targetRow: null,
      targetCol: null,
      isValidPos: false,
    };
  }

  // Global Pointer & Touch Drag Listeners
  window.addEventListener("pointermove", (e) => {
    if (activeDragState.isDragging) {
      updateDragPointerPosition(e.clientX, e.clientY);
    }
  });

  window.addEventListener("pointerup", () => {
    if (activeDragState.isDragging) {
      endPointerDrag();
    }
  });

  window.addEventListener(
    "touchmove",
    (e) => {
      if (activeDragState.isDragging && e.touches.length > 0) {
        updateDragPointerPosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true },
  );

  window.addEventListener("touchend", () => {
    if (activeDragState.isDragging) {
      endPointerDrag();
    }
  });

  function getGradientForColor(col) {
    const gradients = {
      1: "linear-gradient(135deg, #00e5ff, #0088ff)",
      2: "linear-gradient(135deg, #7c4dff, #651fff)",
      3: "linear-gradient(135deg, #ff4081, #f50057)",
      4: "linear-gradient(135deg, #00e676, #00c853)",
      5: "linear-gradient(135deg, #ffab00, #ff6d00)",
      6: "linear-gradient(135deg, #e040fb, #aa00ff)",
    };
    return gradients[col] || gradients[1];
  }

  // Cell Hover Preview
  function handleCellHover(r, c) {
    if (activeDragState.isDragging) return; // Managed by pointer drag
    clearCellPreviews();
    if (selectedBlockIndex === null || !dockUnlocked) return;
    const block = currentDockBlocks[selectedBlockIndex];
    if (!block) return;

    const valid = canPlaceBlock(block, r, c);

    for (let br = 0; br < block.rows; br++) {
      for (let bc = 0; bc < block.cols; bc++) {
        if (block.matrix[br][bc] === 1) {
          const tr = r + br;
          const tc = c + bc;
          if (tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
            const cellEl = gridBoardEl.querySelector(`[data-row="${tr}"][data-col="${tc}"]`);
            if (cellEl) {
              cellEl.classList.add(valid ? "preview-valid" : "preview-invalid");
            }
          }
        }
      }
    }
  }

  function clearCellPreviews() {
    const previewCells = gridBoardEl.querySelectorAll(".preview-valid, .preview-invalid, .ghost-valid, .ghost-invalid");
    previewCells.forEach((cell) =>
      cell.classList.remove("preview-valid", "preview-invalid", "ghost-valid", "ghost-invalid"),
    );
  }

  // Can Place Block Check
  function canPlaceBlock(block, r, c) {
    if (r + block.rows > GRID_SIZE || c + block.cols > GRID_SIZE) return false;
    for (let br = 0; br < block.rows; br++) {
      for (let bc = 0; bc < block.cols; bc++) {
        if (block.matrix[br][bc] === 1) {
          if (board[r + br][c + bc] !== 0) return false;
        }
      }
    }
    return true;
  }

  // Handle Placement (Click or Drop)
  function handleCellClick(r, c) {
    if (selectedBlockIndex === null || !dockUnlocked) return;
    const block = currentDockBlocks[selectedBlockIndex];
    if (!block) return;

    if (canPlaceBlock(block, r, c)) {
      placeBlock(block, r, c);
    }
  }

  // Enable Drag & Drop on Grid
  boardWrapperEl.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  boardWrapperEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const target = e.target.closest(".cell");
    if (!target) return;
    const r = parseInt(target.dataset.row, 10);
    const c = parseInt(target.dataset.col, 10);
    handleCellClick(r, c);
  });

  // Place Block onto Board
  function placeBlock(block, r, c) {
    for (let br = 0; br < block.rows; br++) {
      for (let bc = 0; bc < block.cols; bc++) {
        if (block.matrix[br][bc] === 1) {
          board[r + br][c + bc] = block.color;
        }
      }
    }

    if (window.soundManager) window.soundManager.playPlace();

    // Score for placement
    let placedCellsCount = 0;
    block.matrix.forEach((row) =>
      row.forEach((val) => {
        if (val === 1) placedCellsCount++;
      }),
    );
    score += placedCellsCount * 10;

    currentDockBlocks[selectedBlockIndex] = null;
    selectedBlockIndex = null;

    renderBoard();
    clearCellPreviews();

    // Check line clears
    checkAndClearLines();
  }

  // Check Filled Rows & Columns
  function checkAndClearLines() {
    const fullRows = [];
    const fullCols = [];

    // Check rows
    for (let r = 0; r < GRID_SIZE; r++) {
      let isFull = true;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c] === 0) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullRows.push(r);
    }

    // Check columns
    for (let c = 0; c < GRID_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (board[r][c] === 0) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(c);
    }

    const totalCleared = fullRows.length + fullCols.length;

    if (totalCleared > 0) {
      const cellsToFlash = new Set();

      fullRows.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) cellsToFlash.add(`${r},${c}`);
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) cellsToFlash.add(`${r},${c}`);
      });

      if (window.soundManager) window.soundManager.playFlash();

      cellsToFlash.forEach((coord) => {
        const [r, c] = coord.split(",").map(Number);
        const cellEl = gridBoardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cellEl) cellEl.classList.add("flashing");
      });

      // Blast effect after 350ms flash
      setTimeout(() => {
        cellsToFlash.forEach((coord) => {
          const [r, c] = coord.split(",").map(Number);
          const cellEl = gridBoardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (cellEl) {
            const rect = cellEl.getBoundingClientRect();
            const wrapperRect = boardWrapperEl.getBoundingClientRect();
            const x = rect.left - wrapperRect.left + rect.width / 2;
            const y = rect.top - wrapperRect.top + rect.height / 2;
            createParticles(x, y, getHexColor(board[r][c]));
          }
          board[r][c] = 0; // Clear matrix
        });

        const lineBonus = totalCleared * 100 + (totalCleared > 1 ? totalCleared * 150 : 0);
        score += lineBonus;

        if (window.soundManager) window.soundManager.playBlast(totalCleared);

        showFloatingScore(`+${lineBonus}` + (totalCleared > 1 ? ` (${totalCleared}x COMBO!)` : ""));

        renderBoard();
        postPlacementCheck();
      }, 350);
    } else {
      postPlacementCheck();
    }
  }

  function postPlacementCheck() {
    updateScoreDisplay();

    // Check if dock is empty
    const allEmpty = currentDockBlocks.every((b) => b === null);

    if (allEmpty) {
      // Sau mỗi lượt dùng hết 3 khối, khóa lượt tiếp theo và yêu cầu
      // người chơi trả lời đúng đủ 3 câu hỏi.
      currentPhase = "quiz";
      quizUnlockProgress = 0;
      spawnDockBlocks();
      updateScoreDisplay();
      setTimeout(openQuizModal, 400);
    } else {
      renderDock();
    }

    checkGameOver();
  }

  function checkGameOver() {
    if (!dockUnlocked) return;

    const availableBlocks = currentDockBlocks.filter((b) => b !== null);
    if (availableBlocks.length === 0) return;

    let canFitAny = false;

    for (const block of availableBlocks) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlaceBlock(block, r, c)) {
            canFitAny = true;
            break;
          }
        }
        if (canFitAny) break;
      }
      if (canFitAny) break;
    }

    if (!canFitAny) {
      if (window.soundManager) window.soundManager.playGameOver();
      setTimeout(showGameOverModal, 600);
    }
  }

  // Particle Canvas Physics
  let particles = [];
  function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 3,
        color: color,
        alpha: 1,
        life: 1,
      });
    }
    if (!animatingParticles) animateParticles();
  }

  let animatingParticles = false;
  function animateParticles() {
    if (!ctxParticle) return;
    animatingParticles = true;
    ctxParticle.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      p.alpha = Math.max(0, p.life);

      ctxParticle.save();
      ctxParticle.globalAlpha = p.alpha;
      ctxParticle.fillStyle = p.color;
      ctxParticle.beginPath();
      ctxParticle.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctxParticle.fill();
      ctxParticle.restore();
    });

    particles = particles.filter((p) => p.life > 0);

    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    } else {
      animatingParticles = false;
    }
  }

  function getHexColor(colIndex) {
    const colors = {
      1: "#00e5ff",
      2: "#7c4dff",
      3: "#ff4081",
      4: "#00e676",
      5: "#ffab00",
      6: "#e040fb",
    };
    return colors[colIndex] || "#ffffff";
  }

  // Floating score
  function showFloatingScore(text) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.left = "50%";
    el.style.top = "40%";
    el.style.transform = "translate(-50%, -50%)";
    boardWrapperEl.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1000);
  }

  // Track Answered Question IDs in LocalStorage
  let answeredQuestionIds = new Set(JSON.parse(localStorage.getItem("dbi2026_answered_q_ids") || "[]"));

  function markQuestionAsAnswered(qId) {
    if (!qId) return;
    answeredQuestionIds.add(qId);
    localStorage.setItem("dbi2026_answered_q_ids", JSON.stringify(Array.from(answeredQuestionIds)));
  }

  // Quiz Modal Logic with 2 Attempts & Next Button Confirmation
  function openQuizModal() {
    if (!window.DB_QUESTIONS || window.DB_QUESTIONS.length === 0) return;

    // Pick random question
    const randomIndex = Math.floor(Math.random() * window.DB_QUESTIONS.length);
    currentQuizQuestion = window.DB_QUESTIONS[randomIndex];

    // Mark as encountered / answered
    markQuestionAsAnswered(currentQuizQuestion.id);

    attemptsLeft = 2;
    quizCompletedState = false;

    attemptsBadgeEl.textContent = `Lượt thử: ${attemptsLeft}/2`;
    attemptsBadgeEl.style.display = "block";

    quizQuestionEl.textContent = currentQuizQuestion.question;
    optionsListEl.innerHTML = "";
    quizFeedbackEl.className = "quiz-feedback";
    quizFeedbackEl.style.display = "none";
    unlockQuizBtnEl.style.display = "none"; // Hidden until answered or attempts run out
    if (memeContainerEl) memeContainerEl.style.display = "none";

    currentQuizQuestion.options.forEach((opt) => {
      const optEl = document.createElement("div");
      optEl.className = "option-item";
      optEl.dataset.key = opt.key;
      optEl.innerHTML = `
        <div class="option-key">${opt.key}</div>
        <div class="option-text">${opt.text}</div>
      `;
      optEl.onclick = () => handleQuizAnswer(opt.key, optEl);
      optionsListEl.appendChild(optEl);
    });

    quizModalEl.classList.add("active");
  }

  function handleQuizAnswer(selectedKey, optionElement) {
    if (quizCompletedState || optionElement.classList.contains("disabled")) return;

    const isCorrect = selectedKey === currentQuizQuestion.answer;

    if (isCorrect) {
      // CORRECT ANSWER
      quizCompletedState = true;
      correctAnswersCount++;
      questionsAnswered++;
      score += 200;

      if (window.soundManager) window.soundManager.playCorrect();

      optionElement.classList.add("correct");
      disableAllOptions();

      quizUnlockProgress++;
      updateScoreDisplay();

      if (quizUnlockProgress >= REQUIRED_CORRECT_ANSWERS) {
        quizFeedbackEl.textContent = `🎉 ĐÃ ĐÚNG ĐỦ ${REQUIRED_CORRECT_ANSWERS} CÂU! Bạn nhận +200 điểm và mở khóa 3 khối tiếp theo!`;
        quizFeedbackEl.className = "quiz-feedback success";
        dockUnlocked = true;
        updateScoreDisplay();

        unlockQuizBtnEl.textContent = "Vào Game Xếp Khối ➔";
        unlockQuizBtnEl.style.display = "block";
        unlockQuizBtnEl.onclick = () => {
          quizModalEl.classList.remove("active");
          renderDock();
          checkGameOver();
        };
      } else {
        const remaining = REQUIRED_CORRECT_ANSWERS - quizUnlockProgress;
        quizFeedbackEl.textContent = `✅ Chính xác! Tiến độ: ${quizUnlockProgress}/${REQUIRED_CORRECT_ANSWERS}. Còn ${remaining} câu đúng để mở khóa.`;
        quizFeedbackEl.className = "quiz-feedback success";

        unlockQuizBtnEl.textContent = "Câu Hỏi Tiếp Theo ➔";
        unlockQuizBtnEl.style.display = "block";
        unlockQuizBtnEl.onclick = () => openQuizModal();
      }
    } else {
      // INCORRECT ANSWER
      attemptsLeft--;
      optionElement.classList.add("wrong", "disabled");

      if (window.soundManager) window.soundManager.playWrong();

      if (attemptsLeft > 0) {
        // STILL HAS ATTEMPTS LEFT (Stay on current question, let user try attempt #2!)
        attemptsBadgeEl.textContent = `Lượt thử: ${attemptsLeft}/2`;
        quizFeedbackEl.textContent = "❌ Chưa chính xác! Bạn vẫn còn 1 lượt thử lại với câu hỏi này.";
        quizFeedbackEl.className = "quiz-feedback fail";
      } else {
        // OUT OF ATTEMPTS (0 attempts left = 2 consecutive wrongs!)
        quizCompletedState = true;
        questionsAnswered++;
        attemptsBadgeEl.textContent = "Hết lượt thử (0/2)";

        // Highlight the correct answer in green
        const optionEls = optionsListEl.querySelectorAll(".option-item");
        optionEls.forEach((el) => {
          if (el.dataset.key === currentQuizQuestion.answer) {
            el.classList.add("correct");
          }
        });
        disableAllOptions();

        quizFeedbackEl.textContent = `❌ Bạn đã dùng hết 2 lượt thử. Đáp án đúng là (${currentQuizQuestion.answer}). Nhấn 'Tiếp Theo' để chuyển câu hỏi mới!`;
        quizFeedbackEl.className = "quiz-feedback fail";

        // Display Random Meme Image Below
        if (MEME_IMAGES.length > 0 && memeContainerEl && memeImgEl) {
          const randomMeme = MEME_IMAGES[Math.floor(Math.random() * MEME_IMAGES.length)];
          memeImgEl.src = randomMeme;
          memeContainerEl.style.display = "flex";
        }

        updateScoreDisplay();

        // Show "Tiếp Theo" button to try a NEW question
        unlockQuizBtnEl.textContent = "Câu Hỏi Tiếp Theo ➔";
        unlockQuizBtnEl.style.display = "block";
        unlockQuizBtnEl.onclick = () => {
          openQuizModal(); // Switch to new question when clicked
        };
      }
    }
  }

  function disableAllOptions() {
    const optionEls = optionsListEl.querySelectorAll(".option-item");
    optionEls.forEach((el) => {
      el.classList.add("disabled");
    });
  }

  // Game Over Modal
  function showGameOverModal() {
    finalScoreEl.textContent = score;
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswersCount / questionsAnswered) * 100) : 100;
    finalAccuracyEl.textContent = `Tỷ lệ trả lời đúng DBI2026: ${accuracy}% (${correctAnswersCount}/${questionsAnswered})`;
    gameOverModalEl.classList.add("active");
  }

  restartBtnEl.onclick = () => {
    gameOverModalEl.classList.remove("active");
    initGame();
  };

  muteBtnEl.onclick = () => {
    if (window.soundManager) {
      const isMuted = window.soundManager.toggleMute();
      muteBtnEl.textContent = isMuted ? "🔇" : "🔊";
    }
  };

  // --- ÔN TẬP ĐÃ (REVIEW QUESTIONS MODAL LOGIC) ---
  const openReviewBtnEl = document.getElementById("open-review-btn");
  const closeReviewBtnEl = document.getElementById("close-review-btn");
  const reviewModalEl = document.getElementById("review-modal");
  const reviewSearchInputEl = document.getElementById("review-search-input");
  const reviewCountBadgeEl = document.getElementById("review-count-badge");
  const reviewCardsListEl = document.getElementById("review-cards-list");
  const prevPageBtnEl = document.getElementById("prev-page-btn");
  const nextPageBtnEl = document.getElementById("next-page-btn");
  const pageInfoEl = document.getElementById("page-info");

  const filterAllBtnEl = document.getElementById("filter-all-btn");
  const filterAnsweredBtnEl = document.getElementById("filter-answered-btn");
  const filterUnansweredBtnEl = document.getElementById("filter-unanswered-btn");

  let reviewCurrentPage = 1;
  const reviewItemsPerPage = 20;
  let filteredQuestionsList = [];
  let currentStatusFilter = "all"; // 'all', 'answered', 'unanswered'

  function openReviewModal() {
    reviewCurrentPage = 1;
    if (reviewSearchInputEl) reviewSearchInputEl.value = "";
    currentStatusFilter = "all";
    updateFilterTabActiveState(filterAllBtnEl);
    filterReviewQuestions();
    if (reviewModalEl) reviewModalEl.classList.add("active");
  }

  function closeReviewModal() {
    if (reviewModalEl) reviewModalEl.classList.remove("active");
  }

  function updateFilterTabActiveState(activeBtnEl) {
    [filterAllBtnEl, filterAnsweredBtnEl, filterUnansweredBtnEl].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    if (activeBtnEl) activeBtnEl.classList.add("active");
  }

  function filterReviewQuestions() {
    const term = reviewSearchInputEl ? reviewSearchInputEl.value.toLowerCase().trim() : "";
    const allQuestions = window.DB_QUESTIONS || [];

    // Update Filter Tab Button Badges
    const answeredCount = answeredQuestionIds.size;
    const unansweredCount = Math.max(0, allQuestions.length - answeredCount);

    if (filterAllBtnEl) filterAllBtnEl.textContent = `Tất Cả (${allQuestions.length})`;
    if (filterAnsweredBtnEl) filterAnsweredBtnEl.textContent = `✅ Đã Trả Lời (${answeredCount})`;
    if (filterUnansweredBtnEl) filterUnansweredBtnEl.textContent = `⏳ Chưa Trả Lời (${unansweredCount})`;

    filteredQuestionsList = allQuestions.filter((q) => {
      // 1. Text Search Filter
      const qMatch =
        !term ||
        q.question.toLowerCase().includes(term) ||
        q.options.some((opt) => opt.text.toLowerCase().includes(term));
      if (!qMatch) return false;

      // 2. Status Filter
      const isAns = answeredQuestionIds.has(q.id);
      if (currentStatusFilter === "answered") return isAns;
      if (currentStatusFilter === "unanswered") return !isAns;

      return true; // 'all'
    });

    reviewCurrentPage = 1;
    renderReviewCards();
  }

  function renderReviewCards() {
    if (!reviewCardsListEl) return;
    reviewCardsListEl.innerHTML = "";

    const totalCount = filteredQuestionsList.length;
    const totalPages = Math.ceil(totalCount / reviewItemsPerPage) || 1;

    if (reviewCurrentPage < 1) reviewCurrentPage = 1;
    if (reviewCurrentPage > totalPages) reviewCurrentPage = totalPages;

    if (reviewCountBadgeEl) reviewCountBadgeEl.textContent = `${totalCount} Câu`;
    if (pageInfoEl) pageInfoEl.textContent = `Trang ${reviewCurrentPage} / ${totalPages}`;

    if (prevPageBtnEl) prevPageBtnEl.disabled = reviewCurrentPage <= 1;
    if (nextPageBtnEl) nextPageBtnEl.disabled = reviewCurrentPage >= totalPages;

    if (totalCount === 0) {
      reviewCardsListEl.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 40px;">Không tìm thấy câu hỏi DBI2026 nào phù hợp với bộ lọc hiện tại!</div>`;
      return;
    }

    const startIdx = (reviewCurrentPage - 1) * reviewItemsPerPage;
    const endIdx = startIdx + reviewItemsPerPage;
    const pageItems = filteredQuestionsList.slice(startIdx, endIdx);

    pageItems.forEach((qItem) => {
      const cardEl = document.createElement("div");
      cardEl.className = "review-card";

      const isAns = answeredQuestionIds.has(qItem.id);
      const statusBadge = isAns
        ? `<span class="status-tag-answered">✓ Đã trả lời</span>`
        : `<span class="status-tag-unanswered">⏳ Chưa trả lời</span>`;

      // Left Column: Question Index & Status Badge & Question Text
      const leftCol = document.createElement("div");
      leftCol.className = "review-card-left";
      leftCol.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="question-num-tag">CÂU HỎI #${qItem.id || ""}</div>
          ${statusBadge}
        </div>
        <div class="review-question-text">${qItem.question}</div>
      `;

      // Right Column: Options with Correct Answer Highlighted
      const rightCol = document.createElement("div");
      rightCol.className = "review-card-right";

      qItem.options.forEach((opt) => {
        const isCorrectOption = opt.key === qItem.answer;
        const optLine = document.createElement("div");
        optLine.className = `review-option-line ${isCorrectOption ? "correct-answer" : ""}`;
        optLine.innerHTML = `<strong>${opt.key}.</strong> <span>${opt.text}</span>`;
        rightCol.appendChild(optLine);
      });

      cardEl.appendChild(leftCol);
      cardEl.appendChild(rightCol);

      reviewCardsListEl.appendChild(cardEl);
    });
  }

  // Event Listeners for Filter Buttons
  if (filterAllBtnEl) {
    filterAllBtnEl.onclick = () => {
      currentStatusFilter = "all";
      updateFilterTabActiveState(filterAllBtnEl);
      filterReviewQuestions();
    };
  }

  if (filterAnsweredBtnEl) {
    filterAnsweredBtnEl.onclick = () => {
      currentStatusFilter = "answered";
      updateFilterTabActiveState(filterAnsweredBtnEl);
      filterReviewQuestions();
    };
  }

  if (filterUnansweredBtnEl) {
    filterUnansweredBtnEl.onclick = () => {
      currentStatusFilter = "unanswered";
      updateFilterTabActiveState(filterUnansweredBtnEl);
      filterReviewQuestions();
    };
  }

  if (openReviewBtnEl) openReviewBtnEl.onclick = openReviewModal;
  if (closeReviewBtnEl) closeReviewBtnEl.onclick = closeReviewModal;

  if (reviewSearchInputEl) {
    reviewSearchInputEl.addEventListener("input", filterReviewQuestions);
  }

  if (prevPageBtnEl) {
    prevPageBtnEl.onclick = () => {
      if (reviewCurrentPage > 1) {
        reviewCurrentPage--;
        renderReviewCards();
        reviewCardsListEl.scrollTop = 0;
      }
    };
  }

  if (nextPageBtnEl) {
    nextPageBtnEl.onclick = () => {
      const totalPages = Math.ceil(filteredQuestionsList.length / reviewItemsPerPage) || 1;
      if (reviewCurrentPage < totalPages) {
        reviewCurrentPage++;
        renderReviewCards();
        reviewCardsListEl.scrollTop = 0;
      }
    };
  }

  // Start game
  initGame();
});
