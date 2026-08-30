import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";
import { encryptField } from "../lib/crypto.ts";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PACKAGES = [
  {
    tier: "FREE",
    name: "FREE",
    priceTzs: 0,
    durationDays: 30,
    tagline: "Anza safari yako bure",
    features: [
      "Wasifu wa msingi unaonekana",
      "Tazama wasifu 5 kwa siku",
      "Utafutaji wa kawaida",
    ],
  },
  {
    tier: "BASIC",
    name: "BASIC",
    priceTzs: 5000,
    durationDays: 30,
    tagline: "Fungua zaidi ya wasifu",
    features: [
      "Tazama wasifu 20 kwa siku",
      "Vichujio vya msingi vya utafutaji",
      "Jibu ujumbe uliopokea",
    ],
  },
  {
    tier: "SILVER",
    name: "SILVER",
    priceTzs: 15000,
    durationDays: 30,
    tagline: "Onekana zaidi, wasiliana zaidi",
    features: [
      "Tazama wasifu 60 kwa siku",
      "Anzisha mazungumzo mapya",
      "Mwonekano bora kwenye utafutaji",
    ],
  },
  {
    tier: "GOLD",
    name: "GOLD",
    priceTzs: 25000,
    durationDays: 30,
    tagline: "Mawasiliano kamili, kipaumbele",
    features: [
      "Tazama wasifu bila kikomo",
      "Ujumbe bila kikomo",
      "Simu za sauti",
      "Kipaumbele cha mwonekano",
    ],
  },
  {
    tier: "PREMIUM",
    name: "PREMIUM",
    priceTzs: 50000,
    durationDays: 30,
    tagline: "Uzoefu kamili wa VIP",
    features: [
      "Alama ya VIP kwenye wasifu",
      "Ufikiaji usio na kikomo",
      "Simu za sauti na video",
      "Msaada maalum wa haraka",
    ],
  },
] as const;

const SEED_PROFILES = [
  { name: "Amina Juma", gender: "FEMALE", city: "Dar es Salaam", age: 26, bio: "Muumini mwenye tabia njema, napenda kusoma na kupika. Natafuta mwenzi mwenye maadili mema.", phone: "0712000001" },
  { name: "Yusuf Rajabu", gender: "MALE", city: "Dodoma", age: 30, bio: "Mfanyakazi wa serikali, mtulivu na mwenye lengo la kujenga familia yenye msingi wa dini.", phone: "0712000002" },
  { name: "Fatuma Said", gender: "FEMALE", city: "Zanzibar", age: 24, bio: "Mwalimu wa shule ya msingi, napenda watoto na maisha ya utulivu pamoja na familia.", phone: "0712000003" },
  { name: "Hassan Mvungi", gender: "MALE", city: "Mwanza", age: 33, bio: "Mfanyabiashara, ninaamini katika ndoa yenye heshima na uelewano.", phone: "0712000004" },
  { name: "Zainab Omary", gender: "FEMALE", city: "Arusha", age: 28, bio: "Muuguzi, napenda kusaidia wengine. Natafuta mume mwenye hofu ya Mwenyezi Mungu.", phone: "0712000005" },
  { name: "Ibrahim Kassim", gender: "MALE", city: "Tanga", age: 29, bio: "Mhandisi, mpenda michezo na safari. Nataka kuoa mwenzangu wa maisha mwenye mapenzi ya dini.", phone: "0712000006" },
  { name: "Mwanaisha Ally", gender: "FEMALE", city: "Morogoro", age: 25, bio: "Mjasiriamali mdogo, napenda kujifunza mambo mapya na kuishi maisha ya amani.", phone: "0712000007" },
  { name: "Rashid Bakari", gender: "MALE", city: "Mbeya", age: 35, bio: "Mkulima na mfanyabiashara, ninatafuta mke mwenye subira na upendo wa familia.", phone: "0712000008" },
  { name: "Halima Msuya", gender: "FEMALE", city: "Dar es Salaam", age: 27, bio: "Mhasibu, napenda usafi wa moyo na maisha rahisi yaliyojaa baraka.", phone: "0712000009" },
  { name: "Juma Athumani", gender: "MALE", city: "Dodoma", age: 31, bio: "Dereva wa mabasi, mtu wa kujitolea na mwenye moyo wa kusamehe.", phone: "0712000010" },
  { name: "Salma Khamis", gender: "FEMALE", city: "Zanzibar", age: 23, bio: "Mwanafunzi wa chuo kikuu, napenda sanaa ya kuandika na maisha ya kiislamu.", phone: "0712000011" },
  { name: "Omar Selemani", gender: "MALE", city: "Mwanza", age: 32, bio: "Mfanyakazi wa benki, natafuta mwenzi wa kuaminiana naye katika kila hatua.", phone: "0712000012" },
] as const;

const SEED_REVIEWS = [
  { name: "Asha M.", city: "Dar es Salaam", rating: 5, body: "Nilikutana na mume wangu kupitia Nusrah. Mchakato ulikuwa salama na wa heshima kabisa." },
  { name: "Khalid R.", city: "Dodoma", rating: 5, body: "Huduma nzuri na inayoendana na misingi ya Kiislamu. Nashukuru sana." },
  { name: "Neema S.", city: "Mwanza", rating: 4, body: "Nilipata mwenzi mzuri, ingawa ilinichukua muda kidogo. Inafaa kuwa na subira." },
  { name: "Bakari Y.", city: "Arusha", rating: 5, body: "Timu ya Nusrah ilinisaidia sana na faragha yangu ilihifadhiwa vizuri." },
  { name: "Rehema K.", city: "Tanga", rating: 5, body: "Nusrah imenisaidia kupata mke mwenye maadili. Ninapendekeza kwa kila Muislamu." },
  { name: "Said H.", city: "Morogoro", rating: 4, body: "Uzoefu mzuri, lakini ningependa kuona wanachama zaidi eneo langu." },
] as const;

async function main() {
  for (const pkg of PACKAGES) {
    await prisma.package.upsert({
      where: { tier: pkg.tier },
      update: {
        name: pkg.name,
        priceTzs: pkg.priceTzs,
        durationDays: pkg.durationDays,
        tagline: pkg.tagline,
        features: JSON.stringify(pkg.features),
      },
      create: {
        tier: pkg.tier,
        name: pkg.name,
        priceTzs: pkg.priceTzs,
        durationDays: pkg.durationDays,
        tagline: pkg.tagline,
        features: JSON.stringify(pkg.features),
      },
    });
  }
  console.log(`Seeded ${PACKAGES.length} packages`);

  const placeholderPasswordHash = await bcrypt.hash(
    `seed-account-${Date.now()}`,
    10
  );

  for (const p of SEED_PROFILES) {
    const existing = await prisma.user.findUnique({ where: { phone: p.phone } });
    if (existing) continue;

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - p.age);

    await prisma.user.create({
      data: {
        name: p.name,
        phone: p.phone,
        passwordHash: placeholderPasswordHash,
        otpVerified: true,
        profile: {
          create: {
            gender: p.gender,
            city: p.city,
            dob,
            bio: p.bio,
            phoneEnc: encryptField(p.phone),
            locationEnc: encryptField(`${p.city}, Tanzania`),
            showContactToTier: "GOLD",
            isSeed: true,
          },
        },
      },
    });
  }
  console.log(`Seeded ${SEED_PROFILES.length} demo profiles`);

  for (const r of SEED_REVIEWS) {
    const already = await prisma.review.findFirst({
      where: { name: r.name, isSeed: true },
    });
    if (already) continue;
    await prisma.review.create({ data: { ...r, isSeed: true } });
  }
  console.log(`Seeded ${SEED_REVIEWS.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
