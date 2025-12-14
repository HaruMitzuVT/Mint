// Singapura Package Loader
import { Terminit } from './prgm/Terminal.js';
import { initSnapMusicMinimal } from './prgm/Music.js';
import { Journal } from "./Journal.js";

async function SPL() {
    try {
        Terminit();
        initSnapMusicMinimal();
        Journal.add("[SPL] Singapura Package Loader initialized successfully.");
    } catch (error) {
        Journal.add(`[SPL] Initialization Error: ${error.message}`);
        console.error("Error initializing Singapura Package Loader:", error);
    }
}

export { SPL };

// End of Singapura Package Loader