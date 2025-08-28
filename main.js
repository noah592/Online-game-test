// Simple 2D JS Game — fixed-step loop, keyboard input, gravity, ground collision.
// Save this file next to index.html. Open index.html to run.

(() => {
  // ----- Setup -----
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width, HEIGHT = canvas.height;

  // World constants (in pixels and seconds to keep it simple)
  const GROUND_Y = 400;     // horizontal ground line (pixels from top)
  const GRAVITY = 1600;     // downward acceleration (pixels per second^2)
  const STEP = 1 / 60;      // physics step (seconds)
  const MOVE_ACCEL = 1200;  // left/right acceleration (px/s^2)
  const FRICTION = 0.90;    // simple horizontal damping

  // Player state
  const player = { x:100, y:300, w:32, h:32, vx:0, vy:0, onGround:false };

  // ----- Input handling -----
  // "down" means a key is currently held.
  // "pressed" tracks keys that were newly pressed since the last update (for one-shot actions like jump).
  const down = new Set();
  const pressed = new Set();

  window.addEventListener("keydown", (e) => {
    if (!down.has(e.code)) pressed.add(e.code);
    down.add(e.code);
  });
  window.addEventListener("keyup", (e) => { down.delete(e.code); });

  const held = (...codes) => codes.some(c => down.has(c));
  const justPressed = (...codes) => codes.some(c => pressed.has(c));

  // ----- Game loop with accumulator (keeps physics stable) -----
  let last = performance.now() / 1000;
  let acc = 0;

  function loop() {
    const now = performance.now() / 1000;
    let dt = now - last; last = now;
    if (dt > 0.25) dt = 0.25; // prevent giant catch-up if tab was backgrounded

    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
      pressed.clear(); // consume one-shot presses each physics tick
    }

    render();
    requestAnimationFrame(loop);
  }

  // ----- Update (moves the world) -----
  function update(dt) {
    // Horizontal control → acceleration
    let ax = 0;
    if (held("ArrowLeft","KeyA"))  ax -= MOVE_ACCEL;
    if (held("ArrowRight","KeyD")) ax += MOVE_ACCEL;

    // Apply acceleration + friction
    player.vx += ax * dt;
    player.vx *= FRICTION;

    // Jump when on ground and the key was just pressed
    if (player.onGround && justPressed("Space","KeyW","ArrowUp")) {
      player.vy = -650;   // instant upward kick (pixels per second)
      player.onGround = false;
    }

    // Gravity
    player.vy += GRAVITY * dt;

    // Integrate position
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Ground collision: stop the player from sinking below the ground line
    if (player.y + player.h > GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // ----- Render (draws the picture) -----
  function render() {
    // background
    ctx.fillStyle = "#161a22";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ground
    ctx.fillStyle = "#3c783c";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    // player (a rounded rectangle)
    ctx.fillStyle = "#dce4ff";
    roundedRect(ctx, Math.round(player.x), Math.round(player.y), player.w, player.h, 8);
    ctx.fill();

    // tiny overlay
    ctx.fillStyle = "white";
    ctx.fillText("A/D or ◀/▶ to move — Space/W/▲ to jump", 10, 20);
  }

  // Helper: draw a rounded rectangle
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Start the loop
  loop();
})();
