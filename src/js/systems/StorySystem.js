// Story system for managing game narrative and progression
export class StorySystem {
    constructor(engine) {
        this.engine = engine;
        
        // Story state
        this.currentChapter = 0;
        this.currentScene = 0;
        this.flags = new Set();
        this.choices = [];
        this.relationships = new Map();
        
        // Load story content
        this.loadStoryContent();
    }
    
    loadStoryContent() {
        // Story structure
        this.chapters = [
            {
                title: "The Beginning",
                scenes: [
                    {
                        type: 'dialogue',
                        content: [
                            "* In a world where reality blurs with dreams...",
                            "* A young soul named Grim finds themselves in an unfamiliar place.",
                            "* The journey begins..."
                        ],
                        background: 'start_area'
                    },
                    {
                        type: 'battle',
                        enemy: 'tutorial_dummy',
                        required: true,
                        intro: [
                            "* A training dummy appears!",
                            "* Time to learn the basics of battle."
                        ]
                    },
                    {
                        type: 'choice',
                        content: [
                            "* The dummy remains motionless.",
                            "* What will you do?"
                        ],
                        options: [
                            {
                                text: "* Destroy it",
                                flag: 'violent_path',
                                relationship: { dummy: -1 }
                            },
                            {
                                text: "* Spare it",
                                flag: 'peaceful_path',
                                relationship: { dummy: 1 }
                            }
                        ]
                    }
                ]
            },
            // Add more chapters here
        ];
    }
    
    async startStory() {
        await this.playChapter(0);
    }
    
    async playChapter(chapterIndex) {
        const chapter = this.chapters[chapterIndex];
        if (!chapter) return false;
        
        this.currentChapter = chapterIndex;
        this.currentScene = 0;
        
        // Play chapter scenes
        for (const scene of chapter.scenes) {
            await this.playScene(scene);
            this.currentScene++;
        }
        
        return true;
    }
    
    async playScene(scene) {
        switch (scene.type) {
            case 'dialogue':
                await this.playDialogue(scene);
                break;
            case 'battle':
                await this.playBattle(scene);
                break;
            case 'choice':
                await this.playChoice(scene);
                break;
            // Add more scene types as needed
        }
    }
    
    async playDialogue(scene) {
        return new Promise(resolve => {
            // Set background if provided
            if (scene.background) {
                // Set background image/animation
            }
            
            // Show dialogue
            this.engine.dialogue.show(scene.content, resolve);
        });
    }
    
    async playBattle(scene) {
        return new Promise(resolve => {
            // Start battle with specified enemy
            this.engine.battle.startBattle({
                type: scene.enemy,
                onComplete: (result) => {
                    // Handle battle result
                    if (result === 'VICTORY') {
                        this.flags.add('defeated_' + scene.enemy);
                    } else if (result === 'SPARE') {
                        this.flags.add('spared_' + scene.enemy);
                    }
                    resolve();
                }
            });
        });
    }
    
    async playChoice(scene) {
        return new Promise(resolve => {
            // Show choice dialogue
            this.engine.dialogue.show(scene.content, () => {
                // Show choice menu
                this.showChoiceMenu(scene.options, (choice) => {
                    this.handleChoice(choice);
                    resolve();
                });
            });
        });
    }
    
    showChoiceMenu(options, callback) {
        // Create and show choice menu
        const menu = document.createElement('div');
        menu.className = 'choice-menu';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = option.text;
            button.addEventListener('click', () => {
                menu.remove();
                callback(option);
            });
            menu.appendChild(button);
        });
        
        document.body.appendChild(menu);
    }
    
    handleChoice(choice) {
        // Set flags
        if (choice.flag) {
            this.flags.add(choice.flag);
        }
        
        // Update relationships
        if (choice.relationship) {
            Object.entries(choice.relationship).forEach(([character, value]) => {
                const currentValue = this.relationships.get(character) || 0;
                this.relationships.set(character, currentValue + value);
            });
        }
        
        // Store choice
        this.choices.push(choice);
    }
    
    checkFlag(flag) {
        return this.flags.has(flag);
    }
    
    getRelationship(character) {
        return this.relationships.get(character) || 0;
    }
    
    getProgress() {
        return {
            chapter: this.currentChapter,
            scene: this.currentScene,
            flags: Array.from(this.flags),
            choices: this.choices,
            relationships: Object.fromEntries(this.relationships)
        };
    }
    
    setProgress(progress) {
        this.currentChapter = progress.chapter;
        this.currentScene = progress.scene;
        this.flags = new Set(progress.flags);
        this.choices = progress.choices;
        this.relationships = new Map(Object.entries(progress.relationships));
    }
}