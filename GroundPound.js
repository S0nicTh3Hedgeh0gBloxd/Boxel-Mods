(function() {
    'use strict';

    let isGroundPounding = false;
    let hasLeftGround = false;
    let fallVelocity = 0;
    const GROUND_POUND_SPEED = 10;
    const BOUNCE_FORCE = 0.00025;

    const AFTERIMAGE_INTERVAL_MS = 25;
    const AFTERIMAGE_LIFETIME_MS = 300;
    const MAX_AFTERIMAGES = 6;

    let afterimagePool = [];
    let lastAfterimageTime = 0;

    function getPlayerScene() {
        return app.player.parent && app.player.parent.parent;
    }

    function createAfterimage() {
        let scene = getPlayerScene();
        if (!scene) return;
        if (afterimagePool.length >= MAX_AFTERIMAGES) return;

        let ghost = app.player.clone(true);
        ghost.position.copy(app.player.position);
        ghost.rotation.copy(app.player.rotation);
        ghost.scale.copy(app.player.scale);

        let meshes = [];
        ghost.traverse(function(child) {
            if (child.isLight) {
                child.visible = false;
            }
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.depthWrite = false;
                child.material.color.set(0x66ccff);
                meshes.push(child);
            }
        });

        scene.add(ghost);
        afterimagePool.push({ obj: ghost, meshes: meshes, spawnTime: performance.now() });
    }

    function startGroundPound() {
        isGroundPounding = true;
        hasLeftGround = false;
        fallVelocity = 0;
        lastAfterimageTime = performance.now();
        setVelocityY(GROUND_POUND_SPEED);
        app.assets.audio.play("resize");
    }

    document.addEventListener("keydown", (e) => {
        if ((e.key === "s" || e.key === "ArrowDown") && !isGroundPounding && !canJump()) {
            startGroundPound();
        }
    });

    addUpdateFunction(() => {
        if (isGroundPounding) {
            if (!hasLeftGround) {
                if (!canJump()) {
                    hasLeftGround = true;
                }
                fallVelocity = getVelocity().y;
            } else {
                if (canJump()) {
                    isGroundPounding = false;
                    Matter.Body.applyForce(app.player.body, app.player.body.position, {
                        x: 0,
                        y: -fallVelocity * BOUNCE_FORCE
                    });
                    app.assets.audio.play(Math.random() < 0.5 ? "impact1" : "impact2");
                } else {
                    fallVelocity = getVelocity().y;
                }
            }

            var now = performance.now();
            if (now - lastAfterimageTime >= AFTERIMAGE_INTERVAL_MS) {
                lastAfterimageTime = now;
                createAfterimage();
            }
        }

        for (let i = afterimagePool.length - 1; i >= 0; i--) {
            let entry = afterimagePool[i];
            let age = performance.now() - entry.spawnTime;
            let fraction = Math.min(age / AFTERIMAGE_LIFETIME_MS, 1);
            let opacity = 0.55 * (1 - fraction);

            entry.meshes.forEach((mesh) => {
                mesh.material.opacity = opacity;
            });

            if (age >= AFTERIMAGE_LIFETIME_MS) {
                let scene = getPlayerScene();
                if (scene) scene.remove(entry.obj);
                afterimagePool.splice(i, 1);
            }
        }
    });

    window.addEventListener("pageMounted", () => {
        let scene = getPlayerScene();
        afterimagePool.forEach((entry) => {
            if (scene) scene.remove(entry.obj);
        });
        afterimagePool = [];
        isGroundPounding = false;
        hasLeftGround = false;
    });

    addModToList("Groundpound Mod");
})();
