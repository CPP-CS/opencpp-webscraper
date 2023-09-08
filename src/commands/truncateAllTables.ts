import { sequelize } from "../db/connection";

export const truncateAllTables = async (logging?: boolean) => {
  await sequelize.truncate({
    cascade: true,
    restartIdentity: true,
    logging: logging ?? false,
  });
};

truncateAllTables();
