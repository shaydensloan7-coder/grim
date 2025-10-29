// Game Configuration
export const CONFIG = {
    CANVAS_WIDTH: 640,
    CANVAS_HEIGHT: 480,
    BATTLE_WIDTH: 280,
    BATTLE_HEIGHT: 130,
    SAVE_KEY: 'grim_save_data',
    DEBUG: false,
    
    // Asset paths
    ASSETS: {
        SPRITES: {
            BATTLE: '/Grimgame/UI Battle/',
            UI: '/Grimgame/UI Screens/',
            CHARACTERS: '/Grimgame/UNDERTALE Organized Sprite Archive/Battle/Characters/',
            ENEMIES: '/Grimgame/UNDERTALE Organized Sprite Archive/Battle/Enemies/',
            PORTRAITS: '/Grimgame/UNDERTALE Organized Sprite Archive/Portraits/'
        },
        FONTS: {
            DETERMINATION_MONO: '/Grimgame/determination-mono-web-font/DeterminationMonoWebRegular-Z5oq.ttf',
            DETERMINATION_SANS: '/Grimgame/determination-mono-web-font/DeterminationSansWebRegular-369X.ttf'
        },
        AUDIO: {
            MUSIC_PATH: '/Grimgame/Undertale Sounds!/',
            SFX_PATH: '/Grimgame/Undertale Sounds!/'
        }
    },

    // Audio mappings
    AUDIO: {
        MUSIC: {
            'battle': 'mus_battle1.ogg',
            'menu': 'mus_menu1.ogg',
            'game-over': 'mus_gameover.ogg',
            'victory': 'mus_victory.ogg',
            'shop': 'mus_shop.ogg',
            'ruins': 'mus_ruins.ogg'
        },
        SFX: {
            'hit': 'snd_hurt1.ogg',
            'select': 'snd_select.ogg',
            'damage': 'snd_damage.ogg',
            'heal': 'snd_heal.ogg',
            'menu-move': 'snd_menumove.ogg',
            'menu-select': 'snd_menuselect.ogg'
        }
    },
    
    // Color scheme
    COLORS: {
        primary: '#ffffff',
        secondary: '#808080',
        accent: '#ff0000',
        background: '#000000',
        text: '#ffffff',
        healthBar: '#ff0000',
        menuBorder: '#ffffff',
        buttonHover: '#ffff00'
    },
    
    // Audio settings
    AUDIO: {
        master: 1.0,
        music: 0.7,
        sfx: 0.8,
        
        // Music tracks
        MUSIC: {
            mainMenu: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_menu1.ogg',
            gameOver: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_gameover.ogg',
            battle: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_battle1.ogg',
            victoryFanfare: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_reunited.ogg',
            shop: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_shop.ogg'
        },
        
        // Sound effects
        SFX: {
            menuSelect: '/workspaces/grim/Grimgame/snd/mo_pop.ogg',
            menuConfirm: '/workspaces/grim/Grimgame/snd/mail_jingle_alt.ogg',
            battleStart: '/workspaces/grim/Grimgame/Undertale Sounds!/mus_prebattle1.ogg',
            hit: '/workspaces/grim/Grimgame/snd/wood_zap.ogg',
            hurt: '/workspaces/grim/Grimgame/snd/pops_deflate.ogg',
            heal: '/workspaces/grim/Grimgame/snd/clover_jump_dunes.ogg',
            dodge: '/workspaces/grim/Grimgame/snd/pinkgoo_move.ogg'
        }
    },
    
    // Battle settings
    BATTLE: {
        defaultPlayerHP: 20,
        defaultPlayerATK: 4,
        defaultPlayerDEF: 2,
        invincibilityFrames: 30,
        turnDuration: 600
    }
};