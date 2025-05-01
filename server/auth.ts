import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Special case for our test admin user
  if (stored === "admin123_hashed" && supplied === "admin123") {
    return true;
  }

  // Regular password comparison
  if (stored.includes(".")) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  
  return false;
}

export function setupAuth(app: Express) {
  // Usando MemoryStore para desenvolvimento
  const MemoryStore = createMemoryStore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "whatsapp-sender-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Tentando autenticar usuário: ${username}`);
        
        // Para simplificar durante o desenvolvimento, permitir login com usuário "admin"
        if (username === "admin" && password === "admin123") {
          console.log("Login de admin com credenciais de teste bem-sucedido");
          const adminUser = {
            id: 1,
            username: "admin",
            password: "admin123_hashed",
            email: "admin@example.com",
            createdAt: new Date()
          };
          return done(null, adminUser);
        }

        console.log("Buscando usuário no banco de dados...");
        const user = await storage.getUserByUsername(username);
        console.log("Resultado da busca:", user ? "Usuário encontrado" : "Usuário não encontrado");
        
        if (!user) {
          console.log("Usuário não encontrado");
          return done(null, false);
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        console.log("Senha válida?", isPasswordValid);
        
        if (!isPasswordValid) {
          console.log("Senha inválida");
          return done(null, false);
        } else {
          console.log("Login bem-sucedido para usuário:", username);
          return done(null, user);
        }
      } catch (error) {
        console.error("Erro durante autenticação:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializando usuário:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    console.log("Deserializando usuário:", id);
    try {
      // Usuário admin hardcoded para desenvolvimento
      if (id === 1) {
        console.log("Recuperando usuário admin");
        const adminUser = {
          id: 1,
          username: "admin",
          password: "admin123_hashed",
          email: "admin@example.com",
          createdAt: new Date()
        };
        return done(null, adminUser);
      }
      
      console.log("Buscando usuário no banco de dados");
      const user = await storage.getUser(id);
      console.log("Resultado da busca:", user ? "Usuário encontrado" : "Usuário não encontrado");
      
      if (!user) {
        console.log("Usuário não encontrado");
        return done(null, false);
      }
      
      console.log("Usuário encontrado:", user.username);
      done(null, user);
    } catch (error) {
      console.error("Erro durante deserialização:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Nome de usuário já existe");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
