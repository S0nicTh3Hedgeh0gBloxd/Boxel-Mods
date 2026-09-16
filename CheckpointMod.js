(function() {  
    'use strict';  
  
    var checkpointState = null;  
    var checkpointPos = null;  
    var marker = null;  
    var markerTime = 0;  
    var visualGeneration = 0;  
    var manualRestart = false;  
  
    var CRYSTAL_SIZE = 8;  
    var EXPECTED_COLOR = 0x22ff77;  
  
    function findRenderMesh(obj) {  
        if (!obj) return null;  
  
        if (obj.isMesh && obj.geometry && obj.geometry.attributes.position) {  
            return obj;  
        }  
  
        if (obj.children) {  
            for (var i = 0; i < obj.children.length; i++) {  
                var child = obj.children[i];  
  
                if (!child) continue;  
  
                var result = findRenderMesh(child);  
  
                if (result) {  
                    return result;  
                }  
            }  
        }  
  
        return null;  
    }  
  
    function styleCrystalMesh(mesh) {  
        var BufferGeometryClass = mesh.geometry.constructor;  
        var AttributeClass = mesh.geometry.attributes.position.constructor;  
  
        var r = 1;  
  
        var px = [r, 0, 0];  
        var nx = [-r, 0, 0];  
        var py = [0, r, 0];  
        var ny = [0, -r, 0];  
        var pz = [0, 0, r];  
        var nz = [0, 0, -r];  
  
        var tris = [];  
  
        function pushTri(a, b, c) {  
            tris.push(a, b, c);  
        }  
  
        pushTri(py, px, pz);  
        pushTri(py, pz, nx);  
        pushTri(py, nx, nz);  
        pushTri(py, nz, px);  
  
        pushTri(ny, pz, px);  
        pushTri(ny, nx, pz);  
        pushTri(ny, nz, nx);  
        pushTri(ny, px, nz);  
  
        var flat = new Float32Array(tris.length * 3);  
  
        for (var i = 0; i < tris.length; i++) {  
            flat[i * 3] = tris[i][0];  
            flat[i * 3 + 1] = tris[i][1];  
            flat[i * 3 + 2] = tris[i][2];  
        }  
  
        var geometry = new BufferGeometryClass();  
  
        geometry.setAttribute(  
            "position",  
            new AttributeClass(flat, 3)  
        );  
  
        geometry.setIndex(null);  
        geometry.computeVertexNormals();  
        geometry.computeBoundingSphere();  
        geometry.computeBoundingBox();  
  
        mesh.geometry = geometry;  
        mesh.frustumCulled = false;  
        mesh.material.map = null;  
        mesh.material.color.set(EXPECTED_COLOR);  
        mesh.material.transparent = true;  
        mesh.material.opacity = 0.85;  
        mesh.material.side = 2;  
        mesh.material.depthTest = true;  
        mesh.material.depthWrite = true;  
    }  
  
    function setupCrystal(gen) {  
        if (gen !== visualGeneration) return;  
        if (!marker) return;  
  
        var mesh = findRenderMesh(marker);  
  
        if (!mesh) {  
            nextFrameUpdateFunction(function() {  
                setupCrystal(gen);  
            });  
  
            return;  
        }  
  
        styleCrystalMesh(mesh);  
  
        if (marker.helper) {  
            marker.helper.visible = false;  
        }  
    }  
  
    function ensureCrystalStyle() {  
        if (!marker) return;  
  
        var mesh = findRenderMesh(marker);  
  
        if (!mesh || !mesh.material || !mesh.material.color) {  
            return;  
        }  
  
        if (mesh.material.color.getHex() !== EXPECTED_COLOR) {  
            styleCrystalMesh(mesh);  
        }  
  
        if (marker.helper && marker.helper.visible) {  
            marker.helper.visible = false;  
        }  
    }  
  
    function spawnVisualAt(pos) {  
        if (!pos) return;  
  
        removeVisual();  
  
        visualGeneration++;  
  
        var gen = visualGeneration;  
  
        marker = app.level.entityFactory.createObject("default");  
  
        marker.body.collisionFilter.mask = 0;  
  
        app.level.addObject(marker);  
  
        marker.setPosition({  
            x: pos.x,  
            y: pos.y,  
            z: pos.z  
        }, true);  
  
        marker.setScale({  
            x: CRYSTAL_SIZE,  
            y: CRYSTAL_SIZE,  
            z: CRYSTAL_SIZE  
        }, true);  
  
        marker.setStatic(true, false);  
  
        marker.updateMatrix();  
        marker.updateMatrixWorld(true);  
  
        nextFrameUpdateFunction(function() {  
            setupCrystal(gen);  
        });  
    }  
  
    function removeVisual() {  
        visualGeneration++;  
  
        if (marker) {  
            app.level.removeObject(marker, true);  
            marker = null;  
        }  
  
        markerTime = 0;  
    }  
  
    function saveCheckpoint() {  
        checkpointPos = {  
            x: app.player.position.x,  
            y: app.player.position.y,  
            z: app.player.position.z  
        };  
  
        app.player.saveCheckpoint(checkpointPos);  
  
        checkpointState = {  
            mode: app.player.mode,  
            jumpMode: app.player.jumpMode  
        };  
  
        app.assets.audio.play("jump");  
  
        spawnVisualAt(checkpointPos);  
    }  
  
    function restoreCheckpointState() {  
        if (!checkpointState) return;  
  
        nextFrameUpdateFunction(function() {  
            app.player.setMode(checkpointState.mode, false);  
            app.player.setJumpMode(checkpointState.jumpMode, false);  
        });  
    }  
  
    function removeCheckpoint() {  
        app.player.removeCheckpoint();  
  
        checkpointState = null;  
        checkpointPos = null;  
  
        app.assets.audio.play("kill");  
  
        removeVisual();  
    }  
  
    window.addEventListener("playerRespawn", function() {  
        if (!checkpointState) return;  
  
        app.assets.audio.play("teleport");  
  
        restoreCheckpointState();  
    });  
  
    window.addEventListener("playerRestart", function() {  
        if (manualRestart) {  
            manualRestart = false;  
            return;  
        }  
  
        if (!checkpointPos) return;  
  
        spawnVisualAt(checkpointPos);  
    });  
  
    window.addEventListener("pageMounted", function() {  
        checkpointState = null;  
        checkpointPos = null;  
        manualRestart = false;  
  
        removeVisual();  
    });  
  
    document.addEventListener("keydown", function(event) {  
        var key = event.key.toLowerCase();  
  
        if (key === "z") {  
            saveCheckpoint();  
        } else if (key === "x") {  
            removeCheckpoint();  
        } else if (key === "r") {  
            manualRestart = true;  
            removeCheckpoint();  
        }  
    });  
  
    addUpdateFunction(function(delta) {  
        ensureCrystalStyle();  
  
        if (!marker) return;  
  
        markerTime += delta;  
  
        var pulse = 1 + Math.sin(markerTime * 0.004) * 0.06;  
  
        marker.rotation.y += delta * 0.0015;  
  
        marker.scale.set(  
            CRYSTAL_SIZE * pulse,  
            CRYSTAL_SIZE * pulse,  
            CRYSTAL_SIZE * pulse  
        );  
    });  
  
    addModToList("Checkpoint Mod");  
})();
