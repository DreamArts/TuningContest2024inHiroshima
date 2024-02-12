import { RowDataPacket } from "mysql2";
import pool from "../../util/mysql";
import { SearchedUser, User, UserForFilter } from "../../model/types";
import {
  convertToSearchedUser,
  convertToUserForFilter,
  convertToUsers,
} from "../../model/utils";

export const getUserIdByMailAndPassword = async (
  mail: string,
  hashPassword: string
): Promise<string | undefined> => {
  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT user_id FROM user WHERE mail = ? AND password = ?",
    [mail, hashPassword]
  );
  if (user.length === 0) {
    return;
  }

  return user[0].user_id;
};

export const getUsers = async (
  limit: number,
  offset: number
): Promise<User[]> => {
  const query =
    "SELECT user.user_id, user.user_name, user.office_id, user.user_icon_id, office.office_name, file.file_name \
    FROM user INNER JOIN office ON user.office_id=office.office_id INNER JOIN file ON user.user_icon_id=file.file_id \
    ORDER BY entry_date ASC, kana ASC LIMIT ? OFFSET ? \
    ";

  const [userRows] = await pool.query<RowDataPacket[]>(query, [limit, offset]);
  return convertToUsers(userRows);
};

export const getUserByUserId = async (
  userId: string
): Promise<User | undefined> => {
  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT user_id, user_name, office_id, user_icon_id FROM user WHERE user_id = ?",
    [userId]
  );
  if (user.length === 0) {
    return;
  }

  const [office] = await pool.query<RowDataPacket[]>(
    `SELECT office_name FROM office WHERE office_id = ?`,
    [user[0].office_id]
  );
  const [file] = await pool.query<RowDataPacket[]>(
    `SELECT file_name FROM file WHERE file_id = ?`,
    [user[0].user_icon_id]
  );

  return {
    userId: user[0].user_id,
    userName: user[0].user_name,
    userIcon: {
      fileId: user[0].user_icon_id,
      fileName: file[0].file_name,
    },
    officeName: office[0].office_name,
  };
};

// export const getUsersByUserIds = async (
//   userIds: string[]
// ): Promise<SearchedUser[]> => {
//   let users: SearchedUser[] = [];
//   for (const userId of userIds) {
//     const [userRows] = await pool.query<RowDataPacket[]>(
//       "SELECT user_id, user_name, kana, entry_date, office_id, user_icon_id FROM user WHERE user_id = ?",
//       [userId]
//     );
//     if (userRows.length === 0) {
//       continue;
//     }

//     const [officeRows] = await pool.query<RowDataPacket[]>(
//       `SELECT office_name FROM office WHERE office_id = ?`,
//       [userRows[0].office_id]
//     );
//     const [fileRows] = await pool.query<RowDataPacket[]>(
//       `SELECT file_name FROM file WHERE file_id = ?`,
//       [userRows[0].user_icon_id]
//     );
//     userRows[0].office_name = officeRows[0].office_name;
//     userRows[0].file_name = fileRows[0].file_name;

//     users = users.concat(convertToSearchedUser(userRows));
//   }
//   return users;
// };
export const getUsersByUserIds = async (
  userIds: string[]
): Promise<SearchedUser[]> => {
  let users: SearchedUser[] = [];
  let query: string =
    // "SELECT user.user_id, user.user_name, user.office_id, user.user_icon_id, office.office_name, file.file_name \
    // FROM user INNER JOIN office ON user.office_id=office.office_id INNER JOIN file ON user.user_icon_id=file.file_id \
    // WHERE ";
    "SELECT user.user_id, user.user_name, user.office_id, user.user_icon_id, office.office_name, file.file_name \
    FROM user INNER JOIN office ON user.office_id=office.office_id INNER JOIN file ON user.user_icon_id=file.file_id \
    WHERE ";
  userIds.forEach((id) => {
    query += "user.user_id= " + id.toString() + " OR ";
  });
  query += "0";
  const [rows] = await pool.query<RowDataPacket[]>(query, []);

  users = users.concat(convertToSearchedUser(rows));
  return users;
};

export const getUsersByUserName = async (
  userName: string
): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE user_name LIKE ?`,
    [`%${userName}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByKana = async (kana: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE kana LIKE ?`,
    [`%${kana}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByMail = async (mail: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE mail LIKE ?`,
    [`%${mail}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByDepartmentName = async (
  departmentName: string
): Promise<SearchedUser[]> => {
  // const [departmentIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT department_id FROM department WHERE department_name LIKE ? AND active = true`,
  //   [`%${departmentName}%`]
  // );
  // const departmentIds: string[] = departmentIdRows.map(
  //   (row) => row.department_id
  // );
  // if (departmentIds.length === 0) {
  //   return [];
  // }

  // const [userIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT user_id FROM department_role_member WHERE department_id IN (?) AND belong = true`,
  //   [departmentIds]
  // );
  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT drm.user_id FROM department_role_member AS drm\
     INNER JOIN drm.department_id=department.department_id \
     WHERE department.department_id LIKE ? AND belong = true AND active = true`,
    [`%${departmentName}%`]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByRoleName = async (
  roleName: string
): Promise<SearchedUser[]> => {
  // const [roleIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT role_id FROM role WHERE role_name LIKE ? AND active = true`,
  //   [`%${roleName}%`]
  // );
  // const roleIds: string[] = roleIdRows.map((row) => row.role_id);
  // if (roleIds.length === 0) {
  //   return [];
  // }

  // const [userIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT user_id FROM department_role_member WHERE role_id IN (?) AND belong = true`,
  //   [roleIds]
  // );
  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT drm.user_id FROM department_role_member AS drm, role \
    WHERE drm.role_id=role.role_id AND role.role_id LIKE ? AND drm.belong = true AND role.active.true`,
    [`%${roleName}%`]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByOfficeName = async (
  officeName: string
): Promise<SearchedUser[]> => {
  // const [officeIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT office_id FROM office WHERE office_name LIKE ?`,
  //   [`%${officeName}%`]
  // );
  // const officeIds: string[] = officeIdRows.map((row) => row.office_id);
  // if (officeIds.length === 0) {
  //   return [];
  // }

  // const [userIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT user_id FROM user WHERE office_id IN (?)`,
  //   [officeIds]
  // );
  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user.user_id FROM user, office WHERE user.office_id=office.office_id AND office.office_name LIKE ?`,
    [`%${officeName}%`]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersBySkillName = async (
  skillName: string
): Promise<SearchedUser[]> => {
  // const [skillIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT skill_id FROM skill WHERE skill_name LIKE ?`,
  //   [`%${skillName}%`]
  // );
  // const skillIds: string[] = skillIdRows.map((row) => row.skill_id);
  // if (skillIds.length === 0) {
  //   return [];
  // }

  // const [userIdRows] = await pool.query<RowDataPacket[]>(
  //   `SELECT user_id FROM skill_member WHERE skill_id IN (?)`,
  //   [skillIds]
  // );
  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT skm.user_id FROM skill, skill_member AS skm \
    WHERE skm.skill_id=skill.skill_id AND skill.skill_name LIKE ?`,
    [`%${skillName}%`]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByGoal = async (goal: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE goal LIKE ?`,
    [`%${goal}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUserForFilter = async (
  userId?: string
): Promise<UserForFilter> => {
  let userRows: RowDataPacket[];
  if (!userId) {
    [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, user_name, office_id, user_icon_id FROM user ORDER BY RAND() LIMIT 1"
    );
  } else {
    [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, user_name, office_id, user_icon_id FROM user WHERE user_id = ?",
      [userId]
    );
  }
  const user = userRows[0];

  const [officeNameRow] = await pool.query<RowDataPacket[]>(
    `SELECT office_name FROM office WHERE office_id = ?`,
    [user.office_id]
  );
  const [fileNameRow] = await pool.query<RowDataPacket[]>(
    `SELECT file_name FROM file WHERE file_id = ?`,
    [user.user_icon_id]
  );
  const [departmentNameRow] = await pool.query<RowDataPacket[]>(
    `SELECT department_name FROM department WHERE department_id = (SELECT department_id FROM department_role_member WHERE user_id = ? AND belong = true)`,
    [user.user_id]
  );
  const [skillNameRows] = await pool.query<RowDataPacket[]>(
    `SELECT skill_name FROM skill WHERE skill_id IN (SELECT skill_id FROM skill_member WHERE user_id = ?)`,
    [user.user_id]
  );

  user.office_name = officeNameRow[0].office_name;
  user.file_name = fileNameRow[0].file_name;
  user.department_name = departmentNameRow[0].department_name;
  user.skill_names = skillNameRows.map((row) => row.skill_name);

  return convertToUserForFilter(user);
};
