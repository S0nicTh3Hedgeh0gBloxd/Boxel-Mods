(function() {
    'use strict';

    var JUMP_CODES = ['Space', 'ArrowUp', 'KeyW'];
    var MIN_VEL = -4;
    var MAX_VEL = -11;
    var MAX_CHARGE_MS = 2000;

    var isCharging = false;
    var chargeStartTime = 0;
    var forceReleaseTimeout = null;

    var usedJumpSinceGrounded = false;
    var wasGrounded = true;

    var BAR_WIDTH = 220;
    var BAR_HEIGHT = 28;
    var POINTER_SIZE = 14;

    var container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "1.5em";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.display = "none";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";

    var bar = document.createElement("div");
    bar.style.width = BAR_WIDTH + "px";
    bar.style.height = BAR_HEIGHT + "px";
    bar.style.display = "flex";
    bar.style.flexDirection = "row";
    bar.style.border = "3px solid #000";
    bar.style.borderRadius = "3px";
    bar.style.overflow = "hidden";
    bar.style.boxShadow = "0 0.2em 0 #00000040";
    bar.style.boxSizing = "content-box";

    var zones = [
        { color: "#8CE81C", weight: 40 },
        { color: "#FFEB00", weight: 28 },
        { color: "#FF8C00", weight: 20 },
        { color: "#E8232B", weight: 12 }
    ];
    zones.forEach(function(z) {
        var zone = document.createElement("div");
        zone.style.flex = z.weight;
        zone.style.background = z.color;
        bar.appendChild(zone);
    });

    var pointerWrap = document.createElement("div");
    pointerWrap.style.position = "relative";
    pointerWrap.style.width = BAR_WIDTH + "px";
    pointerWrap.style.height = "0px";

    var pointerOutline = document.createElement("div");
    pointerOutline.style.position = "absolute";
    pointerOutline.style.top = "-2px";
    pointerOutline.style.left = "0px";
    pointerOutline.style.width = "0";
    pointerOutline.style.height = "0";
    pointerOutline.style.borderLeft = ((POINTER_SIZE + 6) / 2) + "px solid transparent";
    pointerOutline.style.borderRight = ((POINTER_SIZE + 6) / 2) + "px solid transparent";
    pointerOutline.style.borderBottom = (POINTER_SIZE + 6) + "px solid #000000";
    pointerOutline.style.transform = "translateX(-50%)";
    pointerOutline.style.zIndex = "1";

    var pointer = document.createElement("div");
    pointer.style.position = "absolute";
    pointer.style.top = "0px";
    pointer.style.left = "0px";
    pointer.style.width = "0";
    pointer.style.height = "0";
    pointer.style.borderLeft = (POINTER_SIZE / 2) + "px solid transparent";
    pointer.style.borderRight = (POINTER_SIZE / 2) + "px solid transparent";
    pointer.style.borderBottom = POINTER_SIZE + "px solid #ffffff";
    pointer.style.transform = "translateX(-50%)";
    pointer.style.zIndex = "2";

    pointerWrap.appendChild(pointerOutline);
    pointerWrap.appendChild(pointer);
    container.appendChild(bar);
    container.appendChild(pointerWrap);
    appElement.appendChild(container);

    function showUI() {
        container.style.display = "flex";
    }

    function hideUI() {
        container.style.display = "none";
    }

    function updateBarFill(fraction) {
        var x = fraction * BAR_WIDTH;
        pointer.style.left = x + "px";
        pointerOutline.style.left = x + "px";
    }

    window.addEventListener("pageMounted", function() {
        hideUI();
    });

    function isJumpKeyEvent(e) {
        return JUMP_CODES.indexOf(e.code) !== -1;
    }

    function isJumpPointerEvent(e) {
        return e.pointerType === 'mouse' && e.target && e.target.tagName === 'CANVAS';
    }

    function releaseJump() {
        if (!isCharging) return;
        isCharging = false;
        hideUI();

        if (forceReleaseTimeout) {
            clearTimeout(forceReleaseTimeout);
            forceReleaseTimeout = null;
        }

        var heldMs = performance.now() - chargeStartTime;
        var fraction = Math.min(heldMs, MAX_CHARGE_MS) / MAX_CHARGE_MS;
        var vel = MIN_VEL + (MAX_VEL - MIN_VEL) * fraction;

        if (isFinite(vel)) {
            setVelocityY(vel);
            app.player.jumpReady = false;
            usedJumpSinceGrounded = true;
            wasGrounded = false;
            app.assets.audio.play("pop1");
        }
    }

    app.player.jump = function() {
        if (app.player.mode === 'grapple') {
            app.player.jumpOriginal();
            return;
        }
        if (isCharging) return;
        if (!canJump() || usedJumpSinceGrounded) return;

        isCharging = true;
        chargeStartTime = performance.now();

        app.assets.audio.play("wood");

        if (app.play) {
            updateBarFill(0);
            showUI();
        }

        forceReleaseTimeout = setTimeout(function() {
            forceReleaseTimeout = null;
            releaseJump();
        }, MAX_CHARGE_MS);
    };

    addUpdateFunction(function() {
        if (app.player.mode === 'grapple') {
            if (isCharging) {
                isCharging = false;
                if (forceReleaseTimeout) {
                    clearTimeout(forceReleaseTimeout);
                    forceReleaseTimeout = null;
                }
                hideUI();
            }
            return;
        }

        var grounded = canJump();
        if (grounded && !wasGrounded) {
            usedJumpSinceGrounded = false;
        }
        wasGrounded = grounded;

        if (!app.play) {
            if (isCharging) releaseJump();
            hideUI();
            return;
        }

        if (isCharging) {
            var heldMs = performance.now() - chargeStartTime;
            var fraction = Math.min(heldMs, MAX_CHARGE_MS) / MAX_CHARGE_MS;
            updateBarFill(fraction);
        }
    });

    window.addEventListener('keyup', function(e) {
        if (isJumpKeyEvent(e)) releaseJump();
    }, true);

    window.addEventListener('pointerup', function(e) {
        if (isJumpPointerEvent(e)) releaseJump();
    }, true);

    window.addEventListener('keydown', function(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
        }
    }, true);

    addModToList("Jump Charging");
})();
