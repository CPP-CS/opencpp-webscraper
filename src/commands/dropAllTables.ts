import { sequelize } from "../db/connection";
import { loadModels } from "../db/models";

export const dropAllTables = async () => {
  // Models need to be loaded before dropping
  await loadModels();
  await sequelize.drop();
};
dropAllTables();
