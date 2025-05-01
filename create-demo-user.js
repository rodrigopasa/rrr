const { Pool } = require('@neondatabase/serverless');
const { hashPassword } = require('./server/auth-helpers');

async function createDemoUser() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Verificando se o usuário demo já existe...");
    const checkResult = await pool.query(
      "SELECT id FROM users WHERE username = 'demo'"
    );

    if (checkResult.rows.length > 0) {
      console.log("Usuário demo já existe. Pulando criação.");
      return;
    }

    console.log("Criando usuário demo para teste...");
    // Usando diretamente o password "demo123" já que a função hashPassword do arquivo auth.ts
    // não pode ser importada diretamente (por isso usamos admin123_hashed como uma string no comparePasswords)
    await pool.query(
      "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
      ["demo", "admin123_hashed", "demo@example.com"]
    );

    console.log("Usuário demo criado com sucesso!");
    console.log("Login: demo");
    console.log("Senha: admin123");
  } catch (error) {
    console.error("Erro ao criar usuário demo:", error);
  } finally {
    await pool.end();
  }
}

createDemoUser();