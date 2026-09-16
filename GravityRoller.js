(function() {
    'use strict';

    var normalGravity = 0.001;
    var originalRespawn = app.player.respawn;
    var originalCancelRestart = app.player.cancelRestart;
    var respawnWrapped = false;

    function rollGravity() {
        var multiplier = Math.round((0.1 + Math.random() * 1.9) * 10) / 10;
        var gravity = normalGravity * multiplier;

        nextFrameUpdateFunction(function() {
            app.engine.world.gravity.scale = gravity;
            console.log("Gravity:", multiplier + "x", gravity);
        });
    }

    if (!respawnWrapped) {
        app.player.respawn = function() {
            rollGravity();
            return originalRespawn.apply(this, arguments);
        };

        app.player.cancelRestart = function() {
            rollGravity();
            return originalCancelRestart.apply(this, arguments);
        };

        respawnWrapped = true;
    }

    window.addEventListener("levelStart", function() {
        rollGravity();
    });

    addModToList("Gravity Roller");
})();
