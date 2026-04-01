/**
 * Seeds realistic unclaimed property records for all 50 states.
 * Uses deterministic seeded RNG for reproducible data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seeded PRNG
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Andrew', 'Emily', 'Paul', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jose', 'Maria', 'Pedro', 'Rosa',
  'Carlos', 'Ana', 'Miguel', 'Carmen', 'Luis', 'Gloria', 'Juan', 'Elena',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
];

const PROPERTY_TYPES = [
  'Checking Account', 'Savings Account', 'Certificate of Deposit', 'Money Order',
  'Insurance Proceeds', 'Life Insurance', 'Wages/Payroll', 'Utility Deposit',
  'Refund/Overpayment', 'Gift Certificate', 'Safe Deposit Box', 'Stock/Dividends',
  'Mutual Fund', 'Bond', 'Trust Funds', 'Commission', 'Cashier Check',
  'Traveler Check', 'Court Deposit', 'Mineral/Oil Royalty', 'Customer Overpayment',
  'Vendor Payment', 'Insurance Premium Refund', 'Credit Balance',
];

const HOLDERS = [
  'Bank of America', 'Wells Fargo', 'JPMorgan Chase', 'Citibank', 'US Bank',
  'PNC Bank', 'Capital One', 'TD Bank', 'Truist Financial', 'Fifth Third Bank',
  'State Farm Insurance', 'Allstate', 'GEICO', 'Progressive', 'Liberty Mutual',
  'AT&T', 'Verizon', 'T-Mobile', 'Comcast', 'Duke Energy', 'Pacific Gas & Electric',
  'Amazon', 'Walmart', 'Target', 'Home Depot', 'CVS Health',
  'UnitedHealth Group', 'Anthem', 'Aetna', 'Cigna', 'MetLife',
  'Edward Jones', 'Charles Schwab', 'Fidelity', 'Vanguard', 'Morgan Stanley',
  'FedEx', 'UPS', 'USPS', 'State Government', 'County Government',
];

const STATE_CITIES: Record<string, string[]> = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Chandler'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Oakland'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder'],
  CT: ['Hartford', 'Bridgeport', 'New Haven', 'Stamford', 'Waterbury'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Bear'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg'],
  GA: ['Atlanta', 'Augusta', 'Savannah', 'Columbus', 'Macon'],
  HI: ['Honolulu', 'Hilo', 'Kailua', 'Pearl City', 'Kapolei'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
  MD: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Flint'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Helena'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond'],
  OR: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
  SC: ['Charleston', 'Columbia', 'North Charleston', 'Greenville', 'Rock Hill'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
  VT: ['Burlington', 'Essex', 'South Burlington', 'Colchester', 'Rutland'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Arlington'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'],
};

// Approximate state population for scaling record counts
const STATE_POP: Record<string, number> = {
  CA: 39500000, TX: 30000000, FL: 22200000, NY: 19500000, PA: 13000000,
  IL: 12600000, OH: 11800000, GA: 10800000, NC: 10700000, MI: 10000000,
  NJ: 9300000, VA: 8600000, WA: 7800000, AZ: 7300000, MA: 7000000,
  TN: 7000000, IN: 6800000, MO: 6200000, MD: 6200000, WI: 5900000,
  CO: 5800000, MN: 5700000, SC: 5200000, AL: 5100000, LA: 4600000,
  KY: 4500000, OR: 4200000, OK: 4000000, CT: 3600000, UT: 3400000,
  IA: 3200000, NV: 3200000, AR: 3000000, MS: 2900000, KS: 2900000,
  NM: 2100000, NE: 2000000, ID: 1900000, WV: 1800000, HI: 1400000,
  NH: 1400000, ME: 1400000, MT: 1100000, RI: 1100000, DE: 1000000,
  SD: 900000, ND: 800000, AK: 700000, VT: 650000, WY: 580000,
};

async function main() {
  console.log('Seeding unclaimed property records...');

  const states = Object.keys(STATE_CITIES);
  let totalRecords = 0;

  for (const state of states) {
    const pop = STATE_POP[state] || 1000000;
    // Scale records: 20-200 per state based on population
    const recordCount = Math.min(200, Math.max(20, Math.round(pop / 200000)));
    const rng = mulberry32(hashStr(`unclaimed-${state}`));
    const cities = STATE_CITIES[state];

    const records = [];
    for (let i = 0; i < recordCount; i++) {
      const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      const propType = PROPERTY_TYPES[Math.floor(rng() * PROPERTY_TYPES.length)];
      const holder = HOLDERS[Math.floor(rng() * HOLDERS.length)];
      const city = cities[Math.floor(rng() * cities.length)];

      // Log-normal distribution for amounts: most are small, some are large
      const logAmount = 1 + rng() * 6; // $10 to $1M range
      const amount = Math.round(Math.pow(10, logAmount) * 100) / 100;

      const year = 2018 + Math.floor(rng() * 7); // 2018-2024
      const month = 1 + Math.floor(rng() * 12);

      records.push({
        state,
        ownerName: `${lastName}, ${firstName}`,
        propertyType: propType,
        reportedAmount: amount,
        holderName: holder,
        city,
        reportedDate: `${year}-${String(month).padStart(2, '0')}`,
        externalId: `${state}-${String(i + 1).padStart(6, '0')}`,
      });
    }

    // Batch upsert
    await prisma.unclaimedProperty.createMany({
      data: records,
      skipDuplicates: true,
    });

    totalRecords += records.length;
    console.log(`  ${state}: ${records.length} records`);
  }

  console.log(`\nDone! Seeded ${totalRecords} unclaimed property records across ${states.length} states.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
