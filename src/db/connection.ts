import envVars from "../envVars";
import { Sequelize } from "sequelize";

const vars = envVars.database;
export const sequelize = new Sequelize(vars.databaseName, vars.userName, vars.password, {
  host: vars.host,
  dialect: "postgres",
  logging: false,
  pool: {
    max: 45,
  },
});
