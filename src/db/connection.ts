import envVars from "../envVars";
import { Sequelize } from "sequelize";

const vars = envVars.database;
export const sequelize = new Sequelize(
  envVars.test ? vars.testDatabaseName : vars.databaseName,
  vars.userName,
  vars.password,
  {
    host: vars.host,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 45,
    },
  }
);
