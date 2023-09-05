import dotenv from "dotenv";

dotenv.config();

type EnvVars = {
  database: {
    databaseName: string;
    userName: string;
    password: string;
    host: string;
  };
  currentTerm: string;
};

export default {
  database: {
    databaseName: process.env.DB_DB_NAME,
    userName: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
  },
  currentTerm: process.env.CURRENT_TERM,
} as EnvVars;
