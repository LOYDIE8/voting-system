======================================================
CTU-DB ONLINE VOTING SYSTEM - ADMIN GUIDE
======================================================

OVERVIEW:
This is a secure, client-side web application designed to handle student council elections for CTU-DB. The system ensures election integrity by utilizing a strict dual-login architecture, a predefined voter whitelist, and browser-based local storage to simulate database operations.

KEY FEATURES:
* Dual-Authentication: Separate login portals for System Admins and Student Voters.
* Voter Whitelist: Students can only log in if their exact Last Name matches their assigned 6-digit Student ID.
* One-Vote Limit: The system tracks active sessions and prevents duplicate voting.
* Dynamic Ballot: The voting form is automatically generated based on the active election database.
* Admin Dashboard: Admins have exclusive access to view real-time live vote tallies and perform a secure system reset.
* Data Persistence: Uses Client-Side Scripting (JavaScript localStorage) to store votes securely without needing a backend server.

======================================================
ADMINISTRATOR ACCESS
======================================================
To manage the election, view results, or wipe the data, use the following credentials:
* Username: admin
* Password: admin123

======================================================
AUTHORIZED STUDENT VOTERS (WHITELIST)
======================================================
Only the following 20 students are registered in the system database. To test the voting process, use any Name and its exact corresponding ID:

1.  Capecenio (ID: 840816)
2.  Mendoza   (ID: 840817)
3.  Garcia    (ID: 840818)
4.  Bautista  (ID: 840819)
5.  Aquino    (ID: 840820)
6.  Reyes     (ID: 840821)
7.  Cruz      (ID: 840822)
8.  Ramos     (ID: 840823)
9.  Villanueva(ID: 840824)
10. Del Rosario(ID: 840825)
11. Alvarez   (ID: 840826)
12. Castro    (ID: 840827)
13. Diaz      (ID: 840828)
14. Gomez     (ID: 840829)
15. Perez     (ID: 840830)
16. Lim       (ID: 840831)
17. Tan       (ID: 840832)
18. Navarro   (ID: 840833)
19. Torres    (ID: 840834)
20. Salazar   (ID: 840835)

======================================================
TESTING WORKFLOW
======================================================
1. Log in as a Student using a Name/ID pair from the list above.
2. Cast a vote for the candidates and submit.
3. Attempt to log in with the exact same Student Name/ID. The system will securely deny access.
4. Log in as the Admin (admin / admin123) to verify the live tally updated correctly.