-- Reversibly encrypted copy of the current password (AES-256-GCM) — lets a super_admin look a
-- branch's password back up from the Edit Branch screen. Never used for authentication itself
-- (that stays `password_hash`, bcrypt, one-way). NULL for every existing account until its
-- password is next set/changed through the branch-management flow.
ALTER TABLE "users" ADD COLUMN "password_encrypted" text;
