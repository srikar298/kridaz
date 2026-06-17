const fs = require('fs');
const lines = fs.readFileSync('schema.prisma', 'utf8').split(/\r?\n/);

let inUser = false;
let inTurf = false;
let inWalletTx = false;
let inHostedGame = false;
let inTeam = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('model User {')) inUser = true;
  if (inUser && line.includes('@@index([role])')) {
    lines.splice(i, 0, '  ownedTournaments    Tournament[]         @relation("TournamentOwner")', '  tournamentOfficials TournamentOfficial[]');
    inUser = false;
    i += 2;
  }

  if (line.startsWith('model Turf {')) inTurf = true;
  if (inTurf && line.includes('@@index([ownerId])')) {
    lines.splice(i, 0, '  tournamentVenues TournamentVenue[]');
    inTurf = false;
    i += 1;
  }

  if (line.startsWith('model WalletTransaction {')) inWalletTx = true;
  if (inWalletTx && line.includes('@@index([userId, createdAt])')) {
    lines.splice(i, 0, '  tournamentId String?', '  tournament   Tournament? @relation(fields: [tournamentId], references: [id])');
    inWalletTx = false;
    i += 2;
  }

  if (line.startsWith('model HostedGame {')) inHostedGame = true;
  if (inHostedGame && line === '}') {
    lines.splice(i, 0, '  tournamentId       String?', '  tournament         Tournament?          @relation(fields: [tournamentId], references: [id])');
    inHostedGame = false;
    i += 2;
  }

  if (line.startsWith('model Team {')) inTeam = true;
  if (inTeam && line === '}') {
    lines.splice(i, 0, '  tournamentTeams          TournamentTeam[]');
    inTeam = false;
    i += 1;
  }
}

const newModels = `
model Tournament {
  id           String               @id @default(uuid())
  name         String
  sport        String
  format       String
  entryFee     Decimal              @default(0) @db.Decimal(10, 2)
  advanceFee   Decimal              @default(0) @db.Decimal(10, 2)
  prizePool    Decimal              @default(0) @db.Decimal(10, 2)
  posterUrl    String?
  status       String               @default("DRAFT") // DRAFT, PUBLISHED, COMPLETED
  currentStep  Int                  @default(1)
  details      Json? // Store unstructured details for draft
  ownerId      String
  owner        User                 @relation("TournamentOwner", fields: [ownerId], references: [id])
  pools        TournamentPool[]
  teams        TournamentTeam[]
  officials    TournamentOfficial[]
  sponsors     TournamentSponsor[]
  venues       TournamentVenue[]
  matches      HostedGame[]
  transactions WalletTransaction[]
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
}

model TournamentPool {
  id           String           @id @default(uuid())
  tournamentId String
  name         String
  maxTeams     Int
  tournament   Tournament       @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  teams        TournamentTeam[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model TournamentTeam {
  id            String          @id @default(uuid())
  tournamentId  String
  teamId        String
  poolId        String?
  paymentStatus String          @default("PENDING") // PENDING, PARTIAL, FULL
  amountPaid    Decimal         @default(0) @db.Decimal(10, 2)
  tournament    Tournament      @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  pool          TournamentPool? @relation(fields: [poolId], references: [id])
  team          Team            @relation(fields: [teamId], references: [id])
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model TournamentOfficial {
  id            String     @id @default(uuid())
  tournamentId  String
  userId        String? // If registered KRIDAZ user
  name          String
  role          String
  phone         String?
  paymentAmount Decimal    @default(0) @db.Decimal(10, 2)
  tournament    Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  user          User?      @relation(fields: [userId], references: [id])
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model TournamentSponsor {
  id           String     @id @default(uuid())
  tournamentId String
  name         String
  logoUrl      String?
  bannerUrl    String?
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model TournamentVenue {
  id           String     @id @default(uuid())
  tournamentId String
  turfId       String
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  turf         Turf       @relation(fields: [turfId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}
`;

fs.writeFileSync('schema.prisma', lines.join('\n') + '\n' + newModels);
console.log('Schema updated successfully');
