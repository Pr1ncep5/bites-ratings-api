SELECT id,
    name,
    role,
    email
FROM user
WHERE email = $email;