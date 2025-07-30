const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@laundry.com' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'superadmin@laundry.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Create Laundry Owner/Admin
  const laundryAdminPassword = await bcrypt.hash('admin123', 12);
  const laundryAdmin = await prisma.user.upsert({
    where: { email: 'admin@quickwash.com' },
    update: {},
    create: {
      name: 'QuickWash Admin',
      email: 'admin@quickwash.com',
      password: laundryAdminPassword,
      role: 'ADMIN',
      phone: '+212666123456',
      isActive: true,
    },
  });

  // Create Customers
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      name: 'Ahmed Bennani',
      email: 'customer1@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+212661234567',
      isActive: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      name: 'Fatima El Alaoui',
      email: 'customer2@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+212662345678',
      isActive: true,
    },
  });

  // Create Customer Addresses
  const address1 = await prisma.address.create({
    data: {
      userId: customer1.id,
      street: '123 Rue Hassan II',
      city: 'Casablanca',
      state: 'Casablanca-Settat',
      zipCode: '20000',
      country: 'Morocco',
      isDefault: true,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      userId: customer2.id,
      street: '456 Avenue Mohammed V',
      city: 'Rabat',
      state: 'Rabat-Salé-Kénitra',
      zipCode: '10000',
      country: 'Morocco',
      isDefault: true,
    },
  });

  // Create Laundries
  const laundry1 = await prisma.laundry.create({
    data: {
      name: 'QuickWash Casa',
      description: 'Premium laundry service in Casablanca',
      email: 'contact@quickwash.com',
      phone: '+212522123456',
      address: '789 Boulevard Zerktouni',
      city: 'Casablanca',
      state: 'Casablanca-Settat',
      zipCode: '20100',
      country: 'Morocco',
      status: 'ACTIVE',
      rating: 4.5,
      ownerId: laundryAdmin.id,
      operatingHours: {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '09:00', close: '18:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: false }
      },
    },
  });

  const laundry2 = await prisma.laundry.create({
    data: {
      name: 'CleanMaster Rabat',
      description: 'Eco-friendly laundry service',
      email: 'info@cleanmaster.ma',
      phone: '+212537654321',
      address: '321 Avenue Allal Ben Abdellah',
      city: 'Rabat',
      state: 'Rabat-Salé-Kénitra',
      zipCode: '10100',
      country: 'Morocco',
      status: 'ACTIVE',
      rating: 4.2,
      ownerId: laundryAdmin.id,
      operatingHours: {
        monday: { open: '07:00', close: '19:00', closed: false },
        tuesday: { open: '07:00', close: '19:00', closed: false },
        wednesday: { open: '07:00', close: '19:00', closed: false },
        thursday: { open: '07:00', close: '19:00', closed: false },
        friday: { open: '07:00', close: '19:00', closed: false },
        saturday: { open: '08:00', close: '17:00', closed: false },
        sunday: { open: '09:00', close: '15:00', closed: false }
      },
    },
  });

  // Create Products/Services
  await prisma.product.createMany({
    data: [
      {
        laundryId: laundry1.id,
        name: 'Wash & Fold',
        description: 'Standard wash and fold service',
        price: 25.0,
        category: 'Basic',
      },
      {
        laundryId: laundry1.id,
        name: 'Dry Cleaning',
        description: 'Professional dry cleaning service',
        price: 45.0,
        category: 'Premium',
      },
      {
        laundryId: laundry1.id,
        name: 'Express Service',
        description: 'Same day service',
        price: 35.0,
        category: 'Express',
      },
    ],
  });

  await prisma.product.createMany({
    data: [
      {
        laundryId: laundry2.id,
        name: 'Eco Wash',
        description: 'Environmentally friendly washing',
        price: 30.0,
        category: 'Eco',
      },
      {
        laundryId: laundry2.id,
        name: 'Delicate Care',
        description: 'Special care for delicate items',
        price: 40.0,
        category: 'Premium',
      },
    ],
  });

  // Get created products for orders
  const laundry1Products = await prisma.product.findMany({
    where: { laundryId: laundry1.id },
  });

  // Create Orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2024-001',
      customerId: customer1.id,
      laundryId: laundry1.id,
      addressId: address1.id,
      status: 'COMPLETED',
      totalAmount: 70.0,
      deliveryFee: 10.0,
      discount: 5.0,
      finalAmount: 75.0,
      paymentMethod: 'Credit Card',
      paymentStatus: 'PAID',
      notes: 'Handle with care',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(),
    },
  });

  // Create Order Items
  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: laundry1Products[0].id,
        quantity: 2,
        price: 25.0,
        total: 50.0,
      },
      {
        orderId: order1.id,
        productId: laundry1Products[1].id,
        quantity: 1,
        price: 35.0,
        total: 35.0,
      },
    ],
  });

  // Create Reviews
  await prisma.review.create({
    data: {
      customerId: customer1.id,
      laundryId: laundry1.id,
      rating: 5,
      comment: 'Excellent service! Very satisfied with the quality.',
    },
  });

  await prisma.review.create({
    data: {
      customerId: customer2.id,
      laundryId: laundry2.id,
      rating: 4,
      comment: 'Good eco-friendly service, will use again.',
    },
  });

  // Create Activities
  await prisma.activity.createMany({
    data: [
      {
        type: 'ORDER_CREATED',
        title: 'New Order',
        description: 'Order ORD-2024-001 created by Ahmed Bennani',
        userId: customer1.id,
        laundryId: laundry1.id,
        orderId: order1.id,
      },
      {
        type: 'ORDER_COMPLETED',
        title: 'Order Completed',
        description: 'Order ORD-2024-001 has been completed',
        laundryId: laundry1.id,
        orderId: order1.id,
      },
      {
        type: 'REVIEW_CREATED',
        title: 'New Review',
        description: 'Customer Ahmed Bennani left a 5-star review',
        userId: customer1.id,
        laundryId: laundry1.id,
      },
    ],
  });

  // Update laundry statistics
  await prisma.laundry.update({
    where: { id: laundry1.id },
    data: {
      totalOrders: 1,
      totalRevenue: 75.0,
      totalReviews: 1,
      rating: 5.0,
    },
  });

  await prisma.laundry.update({
    where: { id: laundry2.id },
    data: {
      totalOrders: 0,
      totalRevenue: 0.0,
      totalReviews: 1,
      rating: 4.0,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Super Admin: superadmin@laundry.com / superadmin123');
  console.log('👤 Laundry Admin: admin@quickwash.com / admin123');
  console.log('👤 Customer 1: customer1@example.com / customer123');
  console.log('👤 Customer 2: customer2@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });