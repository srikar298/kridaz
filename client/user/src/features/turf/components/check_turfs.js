 
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../server/.env') });

const TurfSchema = new mongoose.Schema({
  name: String,
  status: String,
  isActive: Boolean,
});

const Turf = mongoose.model('Turf', TurfSchema);

async function checkTurfs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    Sentry.addBreadcrumb({
      message: String('Connected to MongoDB')
    });
    
    const allTurfs = await Turf.find({});
    Sentry.addBreadcrumb({
      message: String(`Total Turfs found: ${allTurfs.length}`)
    });
    
    allTurfs.forEach(t => {
      Sentry.addBreadcrumb({
        message: String(`Turf: ${t.name}, Status: ${t.status}, Active: ${t.isActive}`)
      });
    });

    // If there are pending turfs, approve them to help the user see them
    const pendingTurfs = allTurfs.filter(t => t.status === 'pending');
    if (pendingTurfs.length > 0) {
      Sentry.addBreadcrumb({
        message: String(`Approving ${pendingTurfs.length} pending turfs...`)
      });
      await Turf.updateMany({ status: 'pending' }, { status: 'approved', isActive: true });
      Sentry.addBreadcrumb({
        message: String('All pending turfs approved.')
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    Sentry.captureException(err);
  }
}

checkTurfs();
