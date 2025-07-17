const { query } = require('./src/db/db');

const testLogin = async () => {
  const email = 'axel@gmail.com';
  const password = '1234';
  
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Query result:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('User found:', user);
    console.log('Password comparison:');
    console.log('  Input password:', password);
    console.log('  DB password:', user.password);
    console.log('  Are equal?', password === user.password);
    console.log('  Are equal (trimmed)?', password.trim() === user.password.trim());
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testLogin();
