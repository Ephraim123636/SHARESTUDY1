ShareStudy local setup and connected features

Run locally from http://localhost/STUDYSHARE/ with Apache and MySQL enabled in
XAMPP. The project root index.php redirects to the home page. Do not use file://
URLs.

Database setup
1. Create/select the studyshare database and install the base users, materials,
   downloads, ratings, and reports tables.
2. Run add_profile_photo_column.sql once if users.profile_photo does not exist.
3. Run complete_material_features.sql once to add materials.material_type and
   create the subscriptions table.
4. Run premium_access.sql once if the database does not already have the
   is_premium and expires_at columns. Premium is currently paused: approved
   materials are free, and the legacy columns are retained for possible future
   use.
5. Run flutterwave_payments.sql once to add Flutterwave transaction tracking.
6. Run password_resets.sql once to enable password reset links.
7. Make sure uploads/ is writable by Apache.

Hosting setup
- Create the MySQL database and user in the hosting control panel, then set
  SHARESTUDY_DB_HOST, SHARESTUDY_DB_NAME, SHARESTUDY_DB_USER, and
  SHARESTUDY_DB_PASSWORD to the provider's values. If the host does not support
  PHP environment variables, set the values privately in db.php on the server;
  never publish database credentials.
- Set SHARESTUDY_BASE_URL to the complete public site URL, including its
  subdirectory if it is not installed at the domain root. Set
  SHARESTUDY_MAIL_FROM to an email address allowed by the host if password reset
  email is enabled.
- Upload the project contents into the hosting web root, preserving the folder
  structure, and ensure uploads/ is writable by PHP. Confirm the host supports
  PHP sessions, PDO MySQL, file uploads large enough for the 15 MB limit, and
  HTTPS before testing.

Connected workflows
- Registration creates student accounts; admins are promoted out-of-band by an
  authorized database administrator.
- Login creates a PHP session; logout destroys it.
- Uploads are stored under uploads/ and enter materials with pending status.
- Admin APIs enforce the admin role for moderation, users, reports, and
  historical subscription records.
- Approved materials are searchable and downloadable. My Uploads and
  My Downloads use MySQL.
- Profiles can update academic details and upload JPG/PNG/WebP photos up to 5 MB.
- Ratings and reports are stored in MySQL; admins can review or resolve reports.
- Material type is stored with each new upload and can be used in filters.
- Approved study materials are free to browse and download. Subscription
  checkout is paused while ShareStudy grows its student community. Existing
  subscription records and Premium-related database columns are left in place
  for historical reference and possible future reintroduction; no Flutterwave
  keys or webhook setup are needed while checkout is paused.
- Password reset links are single-use and expire after one hour. To deliver
  them, configure PHP mail() using the SMTP relay in XAMPP's php.ini/sendmail.ini.
  Set SHARESTUDY_BASE_URL and SHARESTUDY_MAIL_FROM in Apache's environment before
  deployment; the source defaults are for local development only. Until email is
  configured, users should contact the site administrator to regain access.

Accepted study material formats are PDF, DOC, DOCX, PPT, and PPTX, up to 15 MB.
Keep the database credentials private and change the default XAMPP root password
before hosting the site outside a local development machine.
