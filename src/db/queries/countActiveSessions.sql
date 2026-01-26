SELECT count(*) as session_count
FROM session
WHERE userId = $userId;