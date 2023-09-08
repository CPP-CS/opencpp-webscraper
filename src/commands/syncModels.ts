import { sequelize } from "../db/connection";
import { loadModels } from "../db/models";

export const syncModels = async (logging?: boolean) => {
  await loadModels();
  await sequelize.sync({ alter: true, logging: logging ?? false });
};
syncModels();
