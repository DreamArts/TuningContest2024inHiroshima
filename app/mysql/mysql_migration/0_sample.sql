-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。
CREATE INDEX mail_key ON user (mail);
CREATE INDEX kana_index ON user(kana);
CREATE INDEX user_name_index ON user(user_name);
CREATE INDEX department_name_index ON department(department_name);
CREATE INDEX role_name_index ON role(role_name);
CREATE INDEX office_name_index ON office(office_name);
CREATE VIEW login_view AS SELECT user_id, user_name, user_icon_id, file_name, office_name, kana, entry_date FROM user LEFT JOIN office ON user.office_id = office.office_id LEFT JOIN file ON user.user_icon_id = file.file_id;
CREATE VIEW department_user_view AS SELECT d.department_name, drm.user_id, drm.belong FROM department d JOIN department_role_member drm ON d.department_id = drm.department_id;
CREATE VIEW user_skills_view AS SELECT s.skill_name, sm.user_id FROM skill s JOIN skill_member sm ON s.skill_id = sm.skill_id;