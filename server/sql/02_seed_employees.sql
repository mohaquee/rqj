-- ════════════════════════════════════════════════════════════════════
-- Seed: 14 employees + 10 user accounts
-- ════════════════════════════════════════════════════════════════════
-- Passwords are NOT in this file — they are bcrypt-hashed at runtime
-- by the bootstrap.js script. Run that script ONCE after creating the DB:
--   cd server && node src/bootstrap.js
-- ════════════════════════════════════════════════════════════════════

INSERT INTO employees (id, name, short_name, role, tier, category, avatar) VALUES
    ('e1',  'Ruhul Quddus Kazal',     'RQ Kazal',  'Founder & Head of Chambers',          'Senior Advocate',           'head',      'RQ'),
    ('e2',  'Akter Rasul Murad',      'AR Murad',  'Senior Associate',                    'Advocate',                  'senior',    'AM'),
    ('e3',  'Md. Mosaddek Billah',    'M Billah',  'Senior Associate',                    'Advocate',                  'senior',    'MB'),
    ('e4',  'Md. Anwar Hossain',      'A Hossain', 'Associate',                           'Advocate',                  'associate', 'AH'),
    ('e5',  'Md. Salahuddin',         'S Tuhin',   'Associate',                           'Advocate',                  'associate', 'ST'),
    ('e6',  'Syful Islam',            'S Islam',   'Associate',                           'Advocate',                  'associate', 'SI'),
    ('e7',  'Dulon Chapa',            'D Chapa',   'Associate',                           'Advocate',                  'associate', 'DC'),
    ('e8',  'Israt Jahan Monika',     'IJ Monika', 'Associate',                           'Advocate',                  'associate', 'IM'),
    ('e9',  'Habibur Rahman',         'H Rahman',  'Associate',                           'Advocate',                  'associate', 'HR'),
    ('e10', 'Md. Muzahidul Islam',    'M Islam',   'Research Associate',                  'Junior Advocate',           'research',  'MI'),
    ('e11', 'G Uddin',                'G Uddin',   'Office Manager',                      'Support',                   'support',   'GU'),
    ('e12', 'M Mirpur',               'M Mirpur',  'Accounts Officer',                    'Support',                   'support',   'MM'),
    ('e13', 'Z Hasan',                'Z Hasan',   'Court Runner',                        'Support',                   'support',   'ZH'),
    ('e14', 'Md. Jahid',              'M Jahid',   'IT Support',                          'Support',                   'support',   'MJ')
ON CONFLICT (id) DO NOTHING;
