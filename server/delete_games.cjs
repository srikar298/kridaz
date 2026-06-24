require('dotenv').config();
const mongoose = require('mongoose');
const HostedGame = require('./modules/hostedGame/hostedGame.model');
const GameSlot = require('./modules/gameSlot/gameSlot.model');
const GameTeam = require('./modules/gameTeam/gameTeam.model');

async function deleteAll() {
    try {
        console.log('Connecting to DB...', process.env.DATABASE_URL);
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected.');
        
        console.log('Deleting Hosted Games...');
        await HostedGame.deleteMany({});
        console.log('Deleted Hosted Games.');

        console.log('Deleting Game Slots...');
        await GameSlot.deleteMany({});
        console.log('Deleted Game Slots.');

        try {
            console.log('Deleting Game Teams...');
            await GameTeam.deleteMany({});
            console.log('Deleted Game Teams.');
        } catch(e) {
            console.log('GameTeam error:', e.message);
        }

        console.log('Successfully cleared all Hosted Games, Slots, and Teams!');
        process.exit(0);
    } catch(e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

deleteAll();
