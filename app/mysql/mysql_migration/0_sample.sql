-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。
CREATE UNIQUE INDEX user ON user (user_id, office_id);
CREATE UNIQUE INDEX department_role ON department_role_member (department_id, role_id);
CREATE UNIQUE INDEX skill ON skill(skill_id);
CREATE UNIQUE INDEX skill_member ON skill_member(skill_id);
CREATE UNIQUE INDEX file ON file(file_id);