const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 1312 Cafe database with actual menu...');

  // 1. Create Default Admin
  const adminPassword = '1312Cafe@1312';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'cafe1312' },
    update: {
      passwordHash,
    },
    create: {
      username: 'cafe1312',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('Admin seeded: cafe1312 / 1312Cafe@1312');

  // Delete old default admin to secure the app
  await prisma.admin.deleteMany({
    where: {
      username: 'admin'
    }
  });

  // Clear existing items to avoid duplicates
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.coupon.deleteMany({});

  // 2. Create Categories
  const categories = [
    { name: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=60' },
    { name: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=60' },
    { name: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60' },
    { name: 'Mocktails', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60' },
    { name: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60' },
    { name: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
    { name: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60' },
    { name: 'Shawarma', image: 'https://images.unsplash.com/photo-1561651823-34fed022540e?w=500&auto=format&fit=crop&q=60' }
  ];

  const seededCategories = [];
  for (const cat of categories) {
    const item = await prisma.category.create({
      data: cat,
    });
    seededCategories.push(item);
  }
  console.log('Categories seeded.');

  // 3. Create Products
  const products = [
    // MOMOS
    { name: 'Veg Steam Momos (10 pcs)', description: 'Classic steamed momos filled with fresh vegetables, served with spicy red chutney.', price: 119.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },
    { name: 'Non-Veg Steam Momos (10 pcs)', description: 'Classic steamed momos filled with tender chicken mince, served with spicy chutney.', price: 139.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },
    { name: 'Veg Tandoor Momos (10 pcs)', description: 'Momos marinated in rich tandoori spices and grilled to smoky perfection.', price: 149.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },
    { name: 'Non-Veg Tandoor Momos (10 pcs)', description: 'Chicken momos marinated in tandoori paste and char-grilled.', price: 169.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },
    { name: 'Veg Peri Peri Fried Momos (10 pcs)', description: 'Fried veg momos tossed in spicy, tangy peri peri seasoning.', price: 139.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },
    { name: 'Non-Veg Peri Peri Fried Momos (10 pcs)', description: 'Fried chicken momos tossed in firey peri peri powder.', price: 159.00, categoryName: 'Momos', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop' },

    // SANDWICHES
    { name: 'Coleslaw Sandwich', description: 'Creamy coleslaw stuffing with fresh cucumber and carrots in buttered bread.', price: 79.00, categoryName: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop' },
    { name: 'Cheese Corn Sandwich', description: 'Sweet corn kernels mixed with melted cheese and mild herbs.', price: 89.00, categoryName: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop' },
    { name: 'Bombay Masala Sandwich', description: 'Traditional Bombay style sandwich with spiced potato mash, green chutney, and veggies.', price: 119.00, categoryName: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop' },
    { name: 'Chipotle Chicken Sandwich', description: 'Shredded chicken in smoky, spicy chipotle spread layered with lettuce.', price: 99.00, categoryName: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop' },
    { name: 'Chicken Club Sandwich', description: 'Double-decker loaded sandwich with chicken, egg, cheese, and tomatoes.', price: 139.00, categoryName: 'Sandwiches', image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop' },

    // BITES
    { name: 'French Fries', description: 'Classic salted golden crispy French potato fries.', price: 89.00, categoryName: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },
    { name: 'Peri Peri Fries', description: 'Crispy fries dusted with hot and spicy peri peri seasoning.', price: 119.00, categoryName: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },
    { name: 'Cheesy Fries', description: 'Hot fries smothered in creamy cheese sauce.', price: 139.00, categoryName: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },
    { name: 'Chicken Popcorn', description: 'Bite-sized crispy nuggets of tender seasoned chicken.', price: 119.00, categoryName: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },
    { name: 'Chicken Cheesy Fries', description: 'Fries topped with crispy chicken popcorn chunks and melted cheese sauce.', price: 149.00, categoryName: 'Bites', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500' },

    // MOCKTAILS
    { name: 'Minty Mojito', description: 'Refreshing blend of lime, fresh mint leaves, simple syrup, and sparkling soda.', price: 59.00, categoryName: 'Mocktails', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' },
    { name: 'Green Apple Mojito', description: 'Cool soda drink infused with tart green apple syrup, mint, and lime.', price: 59.00, categoryName: 'Mocktails', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' },
    { name: 'Ocean Breeze', description: 'Stunning blue curacao mocktail with sprite and lime.', price: 69.00, categoryName: 'Mocktails', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' },
    { name: 'Thirsty Watermelon', description: 'Fresh sweet watermelon mocktail topped with mint and ice.', price: 99.00, categoryName: 'Mocktails', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500' },

    // SHAKES
    { name: 'Classic Cold Coffee', description: 'Perfect rich creamy blend of espresso and vanilla ice cream.', price: 59.00, categoryName: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500' },
    { name: 'Strawberry Shake', description: 'Creamy milkshake blended with fresh strawberry syrup.', price: 69.00, categoryName: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500' },
    { name: 'Oreo Shake', description: 'Indulgent shake blended with Oreo cookies and chocolate syrup.', price: 99.00, categoryName: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500' },
    { name: 'KitKat Shake', description: 'Thick chocolate milkshake blended with crunchy KitKat bars.', price: 119.00, categoryName: 'Shakes', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500' },

    // PIZZAS
    { name: 'Margherita Pizza', description: 'Classic single-cheese pizza with fresh basil and premium tomato base.', price: 99.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Cheese Chilly Pizza', description: 'Pizza topped with spicy green chillies and loaded mozzarella cheese.', price: 119.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Fresh Farm Pizza', description: 'Topped with bell peppers, onions, tomatoes, sweet corn, and mushrooms.', price: 149.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Classic Chicken Pizza', description: 'Topped with seasoned chicken chunks, onions, and extra cheese.', price: 139.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Peri Peri Chicken Pizza', description: 'Spicy chicken pizza with hot peri peri drizzle and fresh onions.', price: 159.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Tandoori Chicken Pizza', description: 'Topped with clay-oven baked tandoori chicken tikka, onions, and capsicum.', price: 179.00, categoryName: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },

    // BURGERS
    { name: 'Veggie Burger', description: 'Crispy vegetable patty layered with onion, tomato, lettuce, and classic mayonnaise.', price: 69.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Hub Chilly Burger', description: 'Veg patty topped with spicy green chilli sauce and cheese slice.', price: 89.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Double Cheese Burger', description: 'Double crispy veg patty with double cheese slices and signature burger sauce.', price: 139.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Classic Chicken Burger', description: 'Grilled chicken patty with fresh lettuce, onions, and creamy mayo.', price: 89.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Chicken Tikka Burger', description: 'Succulent chicken tikka patty with mint mayo and pickled onions.', price: 119.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Loaded Crunchy Burger', description: 'Thick crispy chicken breast patty loaded with pickles, cheese, and spicy dressing.', price: 159.00, categoryName: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },

    // MEALS & MULTI MEALS
    { name: 'Veg Burger Meal', description: 'Includes: Hub Chilli Burger, Golden French Fries, and refreshing Minty Mojito.', price: 199.00, categoryName: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' },
    { name: 'Non-Veg Burger Meal', description: 'Includes: Classic Chicken Burger, Golden French Fries, and refreshing Minty Mojito.', price: 199.00, categoryName: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' },
    { name: 'Veg Multi Meal', description: 'Includes: Margherita Pizza, Double Cheese Burger, Peri Peri Fries, and Ocean Breeze.', price: 399.00, categoryName: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' },
    { name: 'Non-Veg Multi Meal', description: 'Includes: Tandoori Chicken Pizza, Loaded Crunchy Burger, Peri Peri Fries, and Ocean Breeze.', price: 499.00, categoryName: 'Meals', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500' },

    // SHAWARMA
    { name: 'Classic Shawarma', description: 'Slow-roasted chicken wrapped in pita bread with garlic sauce and pickles.', price: 69.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1561651823-34fed022540e?w=500' },
    { name: 'Hot and Spicy Shawarma', description: 'Spicy chicken shawarma wrapped with chilli flakes and hot garlic paste.', price: 79.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f06?w=500' },
    { name: 'Cheesy Shawarma', description: 'Standard shawarma loaded with extra shredded mozzarella cheese.', price: 99.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500' },
    { name: 'Peri Peri Shawarma', description: 'Tender chicken shawarma seasoned with firey peri peri powder.', price: 119.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1561651823-34fed022540e?w=500' },
    { name: 'BBQ Shawarma', description: 'Roasted chicken tossed in smoky hickory BBQ sauce, wrapped in warm pita.', price: 119.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f06?w=500' },
    { name: 'Mexican Cheese Shawarma', description: 'Shawarma with jalapeños, salsa, and melted Mexican blend cheese.', price: 129.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500' },
    { name: 'Tandoori Shawarma', description: 'Grilled chicken marinated in tandoori masala, wrapped with mint chutney.', price: 129.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1561651823-34fed022540e?w=500' },
    { name: 'Open Shawarma', description: 'Deconstructed chicken shawarma served in a platter with pita, fries, and garlic dip.', price: 149.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f06?w=500' },
    { name: 'Open Cheesy Shawarma', description: 'Deconstructed open shawarma platter loaded with cheese and baked.', price: 169.00, categoryName: 'Shawarma', image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500' },
  ];

  for (const prod of products) {
    const category = seededCategories.find(c => c.name === prod.categoryName);
    if (category) {
      await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          image: prod.image,
          available: true,
          isVeg: prod.isVeg !== undefined ? prod.isVeg : !prod.name.toLowerCase().includes('chicken') && !prod.name.toLowerCase().includes('non-veg') && !prod.categoryName.toLowerCase().includes('shawarma'),
          categoryId: category.id,
        }
      });
    }
  }
  console.log('Products seeded.');

  // 4. Create Coupons
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discount: 10.0,
      active: true,
    }
  });
  await prisma.coupon.create({
    data: {
      code: 'FREE1312',
      discount: 13.12,
      active: true,
    }
  });
  console.log('Coupons seeded.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
