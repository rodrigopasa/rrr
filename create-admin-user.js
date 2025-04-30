const { storage } = require('./server/storage');
const { hashPassword } = require('./server/auth');

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByUsername('admin');
    
    if (existingUser) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('admin123');
    
    // Create admin user
    const user = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com'
    });
    
    console.log('Admin user created successfully:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();