import { sequelize } from "../db/db";

export const dropAllTables = async () => {
  await sequelize.drop();
};
dropAllTables();
