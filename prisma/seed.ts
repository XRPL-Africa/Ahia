import { PrismaClient, UserRole, UserStatus, Campus } from '@prisma/client';
import { hashPassword } from '../src/utils/helpers.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create campuses
  const campuses: Campus[] = [];
  
  const uniben = await prisma.campus.upsert({
    where: { subdomain: 'uniben' },
    update: {},
    create: {
      name: 'University of Benin',
      subdomain: 'uniben',
      slug: 'university-of-benin',
      address: 'Ugbowo, Benin City',
      city: 'Benin City',
      state: 'Edo',
      country: 'Nigeria',
      primaryColor: '#1e40af',
      secondaryColor: '#f59e0b',
      isActive: true,
    },
  });
  campuses.push(uniben);

  const ui = await prisma.campus.upsert({
    where: { subdomain: 'ui' },
    update: {},
    create: {
      name: 'University of Ibadan',
      subdomain: 'ui',
      slug: 'university-of-ibadan',
      address: 'Ibadan',
      city: 'Ibadan',
      state: 'Oyo',
      country: 'Nigeria',
      primaryColor: '#166534',
      secondaryColor: '#fcd34d',
      isActive: true,
    },
  });
  campuses.push(ui);

  const unilag = await prisma.campus.upsert({
    where: { subdomain: 'unilag' },
    update: {},
    create: {
      name: 'University of Lagos',
      subdomain: 'unilag',
      slug: 'university-of-lagos',
      address: 'Akoka, Yaba',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      primaryColor: '#7c2d12',
      secondaryColor: '#fef3c7',
      isActive: true,
    },
  });
  campuses.push(unilag);

  console.log(`Created ${campuses.length} campuses`);

  // Create swap spots for UNIBEN
  const swapSpots = [
    { name: 'Main Library', location: 'Main Campus Library Building', campusId: uniben.id },
    { name: 'Student Union Building', location: 'Student Union Car Park', campusId: uniben.id },
    { name: 'Engineering Faculty', location: 'Engineering Complex, Ground Floor', campusId: uniben.id },
    { name: 'Social Sciences', location: 'Social Sciences Building', campusId: uniben.id },
  ];

  for (const spot of swapSpots) {
    await prisma.swapSpot.upsert({
      where: { 
        id: `${spot.campusId}-${spot.name.toLowerCase().replace(/\s+/g, '-')}` 
      },
      update: {},
      create: {
        ...spot,
        isActive: true,
      },
    });
  }

  console.log(`Created ${swapSpots.length} swap spots`);

  // Create admin user
  const adminPassword = await hashPassword('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ahia.app' },
    update: {},
    create: {
      email: 'admin@ahia.app',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Ahia Admin',
      campusId: uniben.id,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.VERIFIED,
      trustScore: 100,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Create sample verified users
  const sampleUsers = [
    { email: 'john.doe@uniben.edu', firstName: 'John', lastName: 'Doe', campusId: uniben.id },
    { email: 'jane.smith@uniben.edu', firstName: 'Jane', lastName: 'Smith', campusId: uniben.id },
    { email: 'mike.wilson@ui.edu.ng', firstName: 'Mike', lastName: 'Wilson', campusId: ui.id },
  ];

  const userPassword = await hashPassword('Password@123');

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: userPassword,
        role: UserRole.STUDENT,
        status: UserStatus.VERIFIED,
        trustScore: 80,
        successfulTrades: 5,
        totalTrades: 5,
      },
    });

    // Create wallet balance for user
    await prisma.walletBalance.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        available: 1000,
        pending: 0,
      },
    });

    console.log(`Created user: ${user.email}`);
  }

  // Create sample listings
  const sampleListings = [
    {
      title: 'iPhone 13 Pro - Like New',
      description: 'iPhone 13 Pro in excellent condition. 256GB storage. Comes with original box and charger.',
      category: 'electronics',
      condition: 'like_new',
      listingType: 'BUY_NOW',
      buyNowPrice: 450000, // in NGN equivalent
      sellerEmail: 'john.doe@uniben.edu',
    },
    {
      title: 'Samsung Galaxy S21',
      description: 'Samsung Galaxy S21, 128GB. Good condition, minor scratches on screen.',
      category: 'electronics',
      condition: 'good',
      listingType: 'OPEN_BID',
      startingBid: 150000,
      sellerEmail: 'jane.smith@uniben.edu',
    },
    {
      title: 'Engineering Textbooks Bundle',
      description: 'Collection of engineering textbooks: Thermodynamics, Mechanics, Calculus.',
      category: 'books',
      condition: 'good',
      listingType: 'BUY_NOW',
      buyNowPrice: 25000,
      sellerEmail: 'mike.wilson@ui.edu.ng',
    },
  ];

  for (const listingData of sampleListings) {
    const seller = await prisma.user.findUnique({
      where: { email: listingData.sellerEmail },
    });

    if (seller) {
      const { sellerEmail, ...listingInfo } = listingData;
      
      await prisma.listing.upsert({
        where: { 
          id: `sample-${listingData.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}` 
        },
        update: {},
        create: {
          ...listingInfo,
          sellerId: seller.id,
          campusId: seller.campusId,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      console.log(`Created listing: ${listingData.title}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
