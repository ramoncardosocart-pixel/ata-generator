import * as mc from "@minecraft/server";
import * as CREATOR_ACRONYM from "./rc_ADDONACRONYM/CREATOR_triggers";

mc.world.afterEvents.worldLoad.subscribe(data => {
    CREATOR_ACRONYM.onWorldLoad();
});

mc.system.beforeEvents.startup.subscribe(data => {
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:ticking', {
        onTick: event => {
            CREATOR_ACRONYM.blockTick(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:random_tick', {
        onRandomTick: event => {
            CREATOR_ACRONYM.blockRandomTick(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:on_place', {
        onPlace: event => {
            CREATOR_ACRONYM.blockPlace(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:on_interact', {
        onPlayerInteract: event => {
            CREATOR_ACRONYM.blockInteract(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:player_break', {
        onPlayerBreak: event => {
            CREATOR_ACRONYM.blockPlayerBreak(event);
        },
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:on_break', {
        onBreak: event => {
            CREATOR_ACRONYM.blockBreak(event);
        },
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:before_place', {
        beforeOnPlayerPlace: event => {
            CREATOR_ACRONYM.beforePlaceBlock(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:step_on', {
        onStepOn: event => {
            CREATOR_ACRONYM.onStepOn(event);
        }
    });
    data.blockComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:step_off', {
        onStepOff: event => {
            CREATOR_ACRONYM.onStepOff(event);
        }
    });
    data.itemComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:use_on', {
        onUseOn: event => {
            CREATOR_ACRONYM.itemUseOn(event);
        }
    });
    data.itemComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:on_mine_block', {
        onMineBlock: event => {
            CREATOR_ACRONYM.itemMineBlock(event);
        }
    });
    data.itemComponentRegistry.registerCustomComponent('rc_ADDONACRONYM:on_use', {
        onUse: event => {
            event
            CREATOR_ACRONYM.itemOnUse(event);
        }
    });
});

mc.world.afterEvents.playerPlaceBlock.subscribe(data => {
    CREATOR_ACRONYM.playerBlockPlace(data);
});

mc.world.afterEvents.itemUse.subscribe(data => {
    CREATOR_ACRONYM.itemUse(data);
});

mc.world.afterEvents.itemStartUse.subscribe(data => {
    CREATOR_ACRONYM.itemStartUse(data);
});

mc.world.afterEvents.itemStopUse.subscribe(data => {
    CREATOR_ACRONYM.itemStopUse(data);
});

mc.world.beforeEvents.playerBreakBlock.subscribe(data => {
    CREATOR_ACRONYM.beforeBlockBreak(data);
});

mc.world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    CREATOR_ACRONYM.beforeBlockInteract(data);
});

mc.world.afterEvents.playerInteractWithBlock.subscribe(data => {
    CREATOR_ACRONYM.afterBlockInteract(data);
});

mc.world.beforeEvents.playerInteractWithEntity.subscribe(data => {
    CREATOR_ACRONYM.beforeEntityInteract(data);
});

mc.world.afterEvents.playerInteractWithEntity.subscribe(data => {
    CREATOR_ACRONYM.entityInteract(data);
});

mc.world.afterEvents.entitySpawn.subscribe(data => {
    CREATOR_ACRONYM.entitySpawn(data);
});

mc.world.afterEvents.entityHitEntity.subscribe(data => {
    CREATOR_ACRONYM.entityHitEntity(data);
});

mc.world.afterEvents.entityHitBlock.subscribe(data => {
    CREATOR_ACRONYM.entityHitBlock(data);
});

mc.world.afterEvents.entityHurt.subscribe(data => {
    CREATOR_ACRONYM.entityHurt(data);
});

mc.world.afterEvents.projectileHitEntity.subscribe(data => {
    CREATOR_ACRONYM.projectileHitEntity(data);
});

mc.world.afterEvents.projectileHitBlock.subscribe(data => {
    CREATOR_ACRONYM.projectileHitBlock(data);
});
mc.world.afterEvents.entityLoad.subscribe(data => {
    CREATOR_ACRONYM.entityLoad(data);
});

mc.world.afterEvents.dataDrivenEntityTrigger.subscribe(data => {
    CREATOR_ACRONYM.entityJsonEvent(data);
});

mc.world.afterEvents.blockExplode.subscribe(data => {
    CREATOR_ACRONYM.blockExplode(data);
});

mc.world.beforeEvents.explosion.subscribe(data => {
    CREATOR_ACRONYM.beforeExplosion(data);
});

mc.world.beforeEvents.entityRemove.subscribe(({ removedEntity: entity }) => {
    CREATOR_ACRONYM.beforeEntityRemove(entity);
});

export let currentTick = mc.system.currentTick;
mc.system.runInterval(() => {
    currentTick = mc.system.currentTick;
    const allPlayers = mc.world.getAllPlayers()
    for (const player of allPlayers) {
        if (!player?.isValid) return;
        CREATOR_ACRONYM.playerTick(player, currentTick);
    };
}, 0);

mc.world.afterEvents.playerHotbarSelectedSlotChange.subscribe(data => {
    CREATOR_ACRONYM.playerHotbarSelectedSlotChange(data);
});

mc.world.afterEvents.playerSpawn.subscribe(data => {
    CREATOR_ACRONYM.playerSpawn(data);
});

mc.world.afterEvents.entityDie.subscribe(data => {
    CREATOR_ACRONYM.entityDie(data);
})


mc.system.afterEvents.scriptEventReceive.subscribe((data) => {
    CREATOR_ACRONYM.scriptEventReceive(data);
});