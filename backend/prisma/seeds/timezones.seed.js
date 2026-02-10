const { prisma } = require('../client');

const timezonesData = [
  { code: 'UTC', label: 'UTC', utc_offset: '+00:00' },
  { code: 'Europe/London', label: 'London (GMT)', utc_offset: '+00:00' },
  { code: 'Europe/Paris', label: 'Paris (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Berlin', label: 'Berlin (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Brussels', label: 'Brussels (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Madrid', label: 'Madrid (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Rome', label: 'Rome (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Amsterdam', label: 'Amsterdam (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Zurich', label: 'Zurich (CET)', utc_offset: '+01:00' },
  { code: 'Europe/Athens', label: 'Athens (EET)', utc_offset: '+02:00' },
  { code: 'Europe/Bucharest', label: 'Bucharest (EET)', utc_offset: '+02:00' },
  { code: 'Europe/Helsinki', label: 'Helsinki (EET)', utc_offset: '+02:00' },
  { code: 'Europe/Istanbul', label: 'Istanbul (TRT)', utc_offset: '+03:00' },
  { code: 'Europe/Moscow', label: 'Moscow (MSK)', utc_offset: '+03:00' },
  { code: 'Asia/Dubai', label: 'Dubai (GST)', utc_offset: '+04:00' },
  { code: 'Asia/Kolkata', label: 'Kolkata (IST)', utc_offset: '+05:30' },
  { code: 'Asia/Shanghai', label: 'Shanghai (CST)', utc_offset: '+08:00' },
  { code: 'Asia/Tokyo', label: 'Tokyo (JST)', utc_offset: '+09:00' },
  { code: 'Asia/Singapore', label: 'Singapore (SGT)', utc_offset: '+08:00' },
  { code: 'Australia/Sydney', label: 'Sydney (AEST)', utc_offset: '+10:00' },
  { code: 'Pacific/Auckland', label: 'Auckland (NZST)', utc_offset: '+12:00' },
  { code: 'America/New_York', label: 'New York (EST)', utc_offset: '-05:00' },
  { code: 'America/Chicago', label: 'Chicago (CST)', utc_offset: '-06:00' },
  { code: 'America/Denver', label: 'Denver (MST)', utc_offset: '-07:00' },
  { code: 'America/Los_Angeles', label: 'Los Angeles (PST)', utc_offset: '-08:00' },
  { code: 'America/Sao_Paulo', label: 'São Paulo (BRT)', utc_offset: '-03:00' },
  { code: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)', utc_offset: '-03:00' },
  { code: 'America/Mexico_City', label: 'Mexico City (CST)', utc_offset: '-06:00' },
  { code: 'America/Toronto', label: 'Toronto (EST)', utc_offset: '-05:00' },
  { code: 'America/Vancouver', label: 'Vancouver (PST)', utc_offset: '-08:00' },
  { code: 'Africa/Casablanca', label: 'Casablanca (WET)', utc_offset: '+01:00' },
  { code: 'Africa/Lagos', label: 'Lagos (WAT)', utc_offset: '+01:00' },
  { code: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', utc_offset: '+02:00' },
  { code: 'Africa/Cairo', label: 'Cairo (EET)', utc_offset: '+02:00' },
];

async function seedTimezones() {
  console.log('Seeding timezones...');

  let created = 0;
  let existing = 0;

  for (const tz of timezonesData) {
    const exists = await prisma.timezones.findUnique({
      where: { code: tz.code },
    });

    if (exists) {
      existing++;
      continue;
    }

    await prisma.timezones.create({
      data: tz,
    });
    created++;
    console.log(`  Created timezone: ${tz.code}`);
  }

  console.log(`Timezones seeding completed! Created ${created}, already existing ${existing}.`);
}

module.exports = { seedTimezones };
